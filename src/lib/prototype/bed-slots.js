import "./slots.js";
import "./ui.js";
globalThis.BedSlots = {
  parseDate(dateStr) {
    var parts = dateStr.split("-");
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  },

  formatDate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  },

  addDays(dateStr, days) {
    var date = this.parseDate(dateStr);
    date.setDate(date.getDate() + days);
    return this.formatDate(date);
  },

  dayLabel(dateStr) {
    var date = this.parseDate(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  },

  shortDayLabel(dateStr) {
    var date = this.parseDate(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
  },

  horizon() {
    return (globalThis.UI && globalThis.UI.SCHEDULE_HORIZON) || 15;
  },

  rangeDates(startDate, horizon) {
    horizon = horizon || this.horizon();
    var dates = [];
    for (var i = 0; i < horizon; i++) {
      dates.push(this.addDays(startDate, i));
    }
    return dates;
  },

  rangeEndExclusive(startDate, horizon) {
    return this.addDays(startDate, horizon || this.horizon());
  },

  dayIndex(dateStr, rangeStart) {
    var start = this.parseDate(rangeStart).getTime();
    var date = this.parseDate(dateStr).getTime();
    return Math.round((date - start) / 86400000);
  },

  /** dischargeDate is exclusive. Stay occupies admitDate .. dischargeDate-1 */
  stayDays(admitDate, dischargeDate) {
    return Math.max(0, this.dayIndex(dischargeDate, admitDate));
  },

  allotmentSpan(allotment) {
    return {
      start: allotment.admitDate,
      end: allotment.dischargeDate,
      days: this.stayDays(allotment.admitDate, allotment.dischargeDate),
    };
  },

  overlaps(spanA, spanB) {
    return spanA.start < spanB.end && spanB.start < spanA.end;
  },

  percentPosition(admitDate, days, rangeStart, horizon) {
    horizon = horizon || this.horizon();
    var startIndex = this.dayIndex(admitDate, rangeStart);
    var left = (startIndex / horizon) * 100;
    var width = (days / horizon) * 100;
    return { left: left, width: width, startIndex: startIndex };
  },

  clipPercentPosition(admitDate, days, rangeStart, horizon) {
    horizon = horizon || this.horizon();
    var startIndex = this.dayIndex(admitDate, rangeStart);
    var endIndex = startIndex + days;
    var visibleStart = Math.max(0, startIndex);
    var visibleEnd = Math.min(horizon, endIndex);
    if (visibleEnd <= visibleStart) {
      return null;
    }
    return {
      left: (visibleStart / horizon) * 100,
      width: ((visibleEnd - visibleStart) / horizon) * 100,
      startIndex: startIndex,
      clipped: visibleStart !== startIndex || visibleEnd !== endIndex,
    };
  },

  isHourlyAllotment(allotment) {
    return Boolean(
      allotment &&
        (allotment.bookingMode === "Hourly" || (allotment.startTime && allotment.endTime))
    );
  },

  isHourlyRequest(request) {
    return Boolean(request && request.bookingMode === "Hourly");
  },

  isHourlyBed(bed) {
    return Boolean(bed && bed.bookingMode === "Hourly");
  },

  allotmentTimeSpan(allotment) {
    if (!this.isHourlyAllotment(allotment) || !globalThis.SchedulerSlots) {
      return null;
    }
    return {
      start: globalThis.SchedulerSlots.toMinutes(allotment.startTime),
      end: globalThis.SchedulerSlots.toMinutes(allotment.endTime),
    };
  },

  timeOverlaps(spanA, spanB) {
    return spanA.start < spanB.end && spanB.start < spanA.end;
  },

  isBedFree(bedId, admitDate, expectedDays, allotments, excludeRequestId, options) {
    options = options || {};
    var startTime = options.startTime;
    var endTime = options.endTime;
    var isHourly = Boolean(startTime && endTime);
    var candidate = {
      start: admitDate,
      end: this.addDays(admitDate, expectedDays || 1),
    };
    var candidateTime = isHourly
      ? {
          start: globalThis.SchedulerSlots.toMinutes(startTime),
          end: globalThis.SchedulerSlots.toMinutes(endTime),
        }
      : null;

    return !allotments.some(function (allotment) {
      if (allotment.bedId !== bedId || allotment.status === "Cancelled") {
        return false;
      }
      if (excludeRequestId && allotment.bedRequestId === excludeRequestId) {
        return false;
      }
      if (
        !BedSlots.overlaps(candidate, {
          start: allotment.admitDate,
          end: allotment.dischargeDate,
        })
      ) {
        return false;
      }

      var otherHourly = BedSlots.isHourlyAllotment(allotment);
      if (isHourly && otherHourly && allotment.admitDate === admitDate) {
        var otherTime = BedSlots.allotmentTimeSpan(allotment);
        return otherTime ? BedSlots.timeOverlaps(candidateTime, otherTime) : true;
      }

      // Daily vs anything on overlapping days, or mixed modes on same day → conflict.
      return true;
    });
  },

  /**
   * Free day ranges on a bed inside [rangeStart, rangeEndExclusive).
   * Returns { start, end, days } with exclusive end.
   */
  freeWindows(bedId, rangeStart, rangeEndExclusive, allotments, excludeRequestId) {
    var occupied = allotments
      .filter(function (allotment) {
        if (allotment.bedId !== bedId || allotment.status === "Cancelled") {
          return false;
        }
        if (excludeRequestId && allotment.bedRequestId === excludeRequestId) {
          return false;
        }
        return allotment.admitDate < rangeEndExclusive && allotment.dischargeDate > rangeStart;
      })
      .map(function (allotment) {
        return {
          start: allotment.admitDate < rangeStart ? rangeStart : allotment.admitDate,
          end: allotment.dischargeDate > rangeEndExclusive ? rangeEndExclusive : allotment.dischargeDate,
        };
      })
      .sort(function (a, b) {
        return a.start.localeCompare(b.start);
      });

    var windows = [];
    var cursor = rangeStart;
    occupied.forEach(function (span) {
      if (span.start > cursor) {
        windows.push({
          start: cursor,
          end: span.start,
          days: BedSlots.dayIndex(span.start, cursor),
        });
      }
      if (span.end > cursor) {
        cursor = span.end;
      }
    });
    if (cursor < rangeEndExclusive) {
      windows.push({
        start: cursor,
        end: rangeEndExclusive,
        days: BedSlots.dayIndex(rangeEndExclusive, cursor),
      });
    }
    return windows.filter(function (window) {
      return window.days > 0;
    });
  },

  bedMatchesRequest(bed, ward, request, options) {
    options = options || {};
    if (!bed || bed.status !== "Active") {
      return false;
    }
    if (!ward || ward.status === "Inactive") {
      return false;
    }

    var requestHourly = this.isHourlyRequest(request);
    var bedHourly = this.isHourlyBed(bed);
    if (requestHourly !== bedHourly) {
      return false;
    }

    var matchMode = options.matchMode || "exact";
    var deptOk = !request.departmentId || ward.departmentId === request.departmentId;
    var typeOk = !request.preferredWardType || ward.wardType === request.preferredWardType;

    if (matchMode === "exact") {
      return deptOk && typeOk;
    }
    if (matchMode === "wardType") {
      return typeOk;
    }
    if (matchMode === "department") {
      return deptOk;
    }
    return true;
  },

  /**
   * Free hour starts on a bed for a single date that fit durationMinutes.
   */
  freeHourStarts(bedId, date, durationMinutes, allotments, excludeRequestId) {
    if (!globalThis.SchedulerSlots) {
      return [];
    }
    var starts = [];
    var duration = durationMinutes || 60;
    for (
      var t = globalThis.SchedulerSlots.DAY_START;
      t + duration <= globalThis.SchedulerSlots.DAY_END;
      t += globalThis.SchedulerSlots.STEP
    ) {
      var span = { start: t, end: t + duration };
      if (globalThis.SchedulerSlots.overlapsBreak(span)) {
        continue;
      }
      var startTime = globalThis.SchedulerSlots.fromMinutes(t);
      var endTime = globalThis.SchedulerSlots.fromMinutes(t + duration);
      if (
        this.isBedFree(bedId, date, 1, allotments, excludeRequestId, {
          startTime: startTime,
          endTime: endTime,
        })
      ) {
        starts.push({ startTime: startTime, endTime: endTime, startMinutes: t });
      }
    }
    return starts;
  },

  availableHourlyBeds(request, beds, wards, allotments, options) {
    options = options || {};
    var self = this;
    var duration = request.expectedMinutes || 120;
    var excludeRequestId = options.excludeRequestId || request.id;
    var matchMode = options.matchMode || "exact";
    var preferredAdmit = options.admitDate || request.requestedAdmitDate;
    var preferredStart = request.preferredStartTime || null;
    var wardMap = {};

    wards.forEach(function (ward) {
      wardMap[ward.id] = ward;
    });

    var slots = [];
    beds.forEach(function (bed) {
      var ward = wardMap[bed.wardId];
      if (!self.bedMatchesRequest(bed, ward, request, { matchMode: matchMode })) {
        return;
      }

      var freeStarts = self.freeHourStarts(
        bed.id,
        preferredAdmit,
        duration,
        allotments,
        excludeRequestId
      );
      if (!freeStarts.length) {
        return;
      }

      var chosen = null;
      if (preferredStart) {
        for (var i = 0; i < freeStarts.length; i++) {
          if (freeStarts[i].startTime === preferredStart) {
            chosen = freeStarts[i];
            break;
          }
        }
      }
      if (!chosen) {
        chosen = freeStarts[0];
      }

      slots.push({
        bedId: bed.id,
        bedName: bed.name,
        wardId: ward.id,
        wardName: ward.name,
        wardType: ward.wardType,
        departmentId: ward.departmentId,
        admitDate: preferredAdmit,
        expectedDays: 1,
        expectedMinutes: duration,
        dischargeDate: self.addDays(preferredAdmit, 1),
        startTime: chosen.startTime,
        endTime: chosen.endTime,
        bookingMode: "Hourly",
        matchMode: matchMode,
      });
    });

    return slots.sort(function (a, b) {
      if (a.startTime !== b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return a.bedName.localeCompare(b.bedName);
    });
  },

  availableBeds(request, beds, wards, allotments, options) {
    options = options || {};
    if (this.isHourlyRequest(request)) {
      return this.availableHourlyBeds(request, beds, wards, allotments, options);
    }

    var self = this;
    var expectedDays = request.expectedDays || 1;
    var excludeRequestId = options.excludeRequestId || request.id;
    var matchMode = options.matchMode || "exact";
    var rangeStart = options.rangeStart || options.admitDate || request.requestedAdmitDate;
    var rangeEnd =
      options.rangeEndExclusive ||
      this.addDays(rangeStart, options.horizon || this.horizon());
    var preferredAdmit = options.admitDate || request.requestedAdmitDate;
    var scanHorizon = options.scanHorizon !== false;
    var wardMap = {};

    wards.forEach(function (ward) {
      wardMap[ward.id] = ward;
    });

    var slots = [];
    beds.forEach(function (bed) {
      var ward = wardMap[bed.wardId];
      if (!self.bedMatchesRequest(bed, ward, request, { matchMode: matchMode })) {
        return;
      }

      function pushSlot(admitDate) {
        if (!self.isBedFree(bed.id, admitDate, expectedDays, allotments, excludeRequestId)) {
          return;
        }
        var dischargeDate = self.addDays(admitDate, expectedDays);
        if (dischargeDate > rangeEnd) {
          return;
        }
        slots.push({
          bedId: bed.id,
          bedName: bed.name,
          wardId: ward.id,
          wardName: ward.name,
          wardType: ward.wardType,
          departmentId: ward.departmentId,
          admitDate: admitDate,
          expectedDays: expectedDays,
          dischargeDate: dischargeDate,
          bookingMode: "Daily",
          matchMode: matchMode,
        });
      }

      if (!scanHorizon) {
        pushSlot(preferredAdmit);
        return;
      }

      self.freeWindows(bed.id, rangeStart, rangeEnd, allotments, excludeRequestId).forEach(
        function (window) {
          if (window.days < expectedDays) {
            return;
          }
          if (
            preferredAdmit >= window.start &&
            self.addDays(preferredAdmit, expectedDays) <= window.end
          ) {
            pushSlot(preferredAdmit);
          }
        }
      );
    });

    return slots.sort(function (a, b) {
      if (a.admitDate !== b.admitDate) {
        return a.admitDate.localeCompare(b.admitDate);
      }
      return a.bedName.localeCompare(b.bedName);
    });
  },

  scoreBedSlot(slot, request) {
    var score = 100;
    var preferredAdmit = request.requestedAdmitDate || slot.admitDate;
    if (slot.admitDate === preferredAdmit) {
      score += 300;
    }
    if (request.preferredWardType && slot.wardType === request.preferredWardType) {
      score += 200;
    }
    if (request.departmentId && slot.departmentId === request.departmentId) {
      score += 100;
    }
    if (slot.matchMode === "exact") {
      score += 50;
    } else if (slot.matchMode === "wardType") {
      score += 30;
    } else if (slot.matchMode === "department") {
      score += 15;
    }
    if (this.isHourlyRequest(request)) {
      if (request.preferredStartTime && slot.startTime === request.preferredStartTime) {
        score += 150;
      }
    } else {
      score -= this.dayIndex(slot.admitDate, preferredAdmit) * 2;
    }
    return score;
  },

  /**
   * Prefer exact dept+wardType, then softer matches. Scans free gaps across the
   * schedule horizon so bulk preview can fill before AND after existing stays.
   */
  pickBestBed(request, beds, wards, allotments, options) {
    options = options || {};
    var modes =
      options.allowFallback === false
        ? ["exact"]
        : ["exact", "wardType", "department", "any"];
    var self = this;
    var rangeStart = options.rangeStart || options.admitDate || request.requestedAdmitDate;
    var horizon = options.horizon || this.horizon();
    var rangeEndExclusive =
      options.rangeEndExclusive || this.addDays(rangeStart, horizon);

    for (var i = 0; i < modes.length; i++) {
      var tierOptions = {
        admitDate: options.admitDate || request.requestedAdmitDate,
        excludeRequestId: options.excludeRequestId,
        matchMode: modes[i],
        rangeStart: rangeStart,
        rangeEndExclusive: rangeEndExclusive,
        horizon: horizon,
        scanHorizon: options.scanHorizon !== false,
      };
      var slots = this.availableBeds(request, beds, wards, allotments, tierOptions);
      if (!slots.length) {
        continue;
      }
      return slots
        .map(function (slot) {
          return { slot: slot, score: self.scoreBedSlot(slot, request) };
        })
        .sort(function (a, b) {
          return b.score - a.score;
        })[0].slot;
    }

    return null;
  },
};

export const BedSlots = globalThis.BedSlots;
