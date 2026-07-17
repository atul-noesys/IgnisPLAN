const BedTimeline = {
  RANGE_FILTER_SCOPE: "__beds_range__",
  _bulkPreviewPlacements: null,
  _pageMode: null,
  _queueSearchQuery: {},
  _timelineSeverityFilter: {},

  rangeStart(anchorDate) {
    return (
      anchorDate ||
      (typeof globalThis.UI.todayISO === "function"
        ? globalThis.UI.todayISO()
        : globalThis.UI.SCHEDULE_START)
    );
  },

  rangeDates(anchorDate) {
    return globalThis.BedSlots.rangeDates(this.rangeStart(anchorDate));
  },

  rangeEndExclusive(anchorDate) {
    return globalThis.BedSlots.rangeEndExclusive(this.rangeStart(anchorDate));
  },

  getActiveBeds() {
    return globalThis.Store.getActiveBeds();
  },

  rangeAllotments(anchorDate) {
    return globalThis.Store.getAllotmentsInRange(
      this.rangeStart(anchorDate),
      this.rangeEndExclusive(anchorDate)
    );
  },

  queuePriorityScoreForPatient(patient) {
    if (!patient) {
      return 0;
    }
    var score = 0;
    if (patient.severity === "High") {
      score += 100;
    } else if (patient.severity === "Moderate") {
      score += 50;
    } else {
      score += 10;
    }
    if (patient.patientType === "IPD") {
      score += 20;
    }
    return score;
  },

  queueRequestsForHorizon(anchorDate) {
    var self = this;
    var rangeStart = this.rangeStart(anchorDate);
    var rangeEnd = this.rangeEndExclusive(anchorDate);
    var patientMap = globalThis.Store.getPatientMap();
    var allottedPatientIds = {};
    var allottedRequestIds = {};

    this.rangeAllotments(anchorDate).forEach(function (allotment) {
      if (allotment.status === "Cancelled") {
        return;
      }
      if (allotment.patientId) {
        allottedPatientIds[allotment.patientId] = true;
      }
      if (allotment.bedRequestId) {
        allottedRequestIds[allotment.bedRequestId] = true;
      }
    });

    return globalThis.Store.getAwaitingBedRequests()
      .filter(function (request) {
        return (
          request.status === "Pending" &&
          request.requestedAdmitDate >= rangeStart &&
          request.requestedAdmitDate < rangeEnd &&
          !allottedPatientIds[request.patientId] &&
          !allottedRequestIds[request.id]
        );
      })
      .sort(function (a, b) {
        var scoreDiff =
          self.queuePriorityScoreForPatient(patientMap[b.patientId]) -
          self.queuePriorityScoreForPatient(patientMap[a.patientId]);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }
        if (a.requestedAdmitDate !== b.requestedAdmitDate) {
          return a.requestedAdmitDate.localeCompare(b.requestedAdmitDate);
        }
        return a.id.localeCompare(b.id);
      });
  },

  queueRequestsForDay(scheduleDate) {
    var self = this;
    var patientMap = globalThis.Store.getPatientMap();
    var allottedPatientIds = {};
    var allottedRequestIds = {};

    this.allotmentsOccupyingDate(scheduleDate).forEach(function (allotment) {
      if (allotment.patientId) {
        allottedPatientIds[allotment.patientId] = true;
      }
      if (allotment.bedRequestId) {
        allottedRequestIds[allotment.bedRequestId] = true;
      }
    });

    // Also exclude patients already allotted starting this day.
    globalThis.Store.getConfirmedAllotments().forEach(function (allotment) {
      if (allotment.status === "Cancelled" || allotment.admitDate !== scheduleDate) {
        return;
      }
      if (allotment.patientId) {
        allottedPatientIds[allotment.patientId] = true;
      }
      if (allotment.bedRequestId) {
        allottedRequestIds[allotment.bedRequestId] = true;
      }
    });

    return globalThis.Store.getAwaitingBedRequests()
      .filter(function (request) {
        return (
          request.status === "Pending" &&
          request.requestedAdmitDate === scheduleDate &&
          !allottedPatientIds[request.patientId] &&
          !allottedRequestIds[request.id]
        );
      })
      .sort(function (a, b) {
        var scoreDiff =
          self.queuePriorityScoreForPatient(patientMap[b.patientId]) -
          self.queuePriorityScoreForPatient(patientMap[a.patientId]);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }
        return a.id.localeCompare(b.id);
      });
  },

  getBedsPageMode() {
    if (this._pageMode === "day" || this._pageMode === "range") {
      return this._pageMode;
    }
    var page = document.querySelector(".schedule-page[data-beds-date]");
    return page && page.getAttribute("data-beds-mode") === "range" ? "range" : "day";
  },

  queueRequestsForPage(anchorDate) {
    return this.getBedsPageMode() === "range"
      ? this.queueRequestsForHorizon(anchorDate)
      : this.queueRequestsForDay(anchorDate);
  },

  patientInitials(patient) {
    if (!patient || !patient.name) {
      return "??";
    }
    return patient.name
      .split(/\s+/)
      .map(function (part) {
        return part.charAt(0);
      })
      .join("")
      .slice(0, 2)
      .toUpperCase();
  },

  patientBorderClass(patient, prefix) {
    prefix = prefix || "timeline-queue-item";
    if (!patient || !patient.severity) return "";
    if (patient.severity === "High") return prefix + "--sev-high";
    if (patient.severity === "Moderate") return prefix + "--sev-moderate";
    return prefix + "--sev-low";
  },

  wardTypeClass(wardType) {
    if (wardType === "ICU") return "timeline-row--icu";
    if (wardType === "Private") return "timeline-row--private";
    return "timeline-row--general";
  },

  wardTypeBlockClass(wardType) {
    if (wardType === "ICU") return "timeline-block--icu";
    if (wardType === "Private") return "timeline-block--private";
    return "timeline-block--general";
  },

  wardTypeChipClass(wardType) {
    if (wardType === "ICU") return "icu";
    if (wardType === "Private") return "private";
    return "general";
  },

  buildQueueSearchHaystack(request, patient, department) {
    return [
      request.id,
      patient && patient.name,
      patient && patient.mrn,
      patient && patient.patientType,
      patient && patient.severity,
      patient && patient.disease,
      department && department.name,
      request.preferredWardType,
      request.requestedAdmitDate,
      request.bookingMode,
      request.preferredStartTime,
      request.expectedMinutes ? request.expectedMinutes + " min" : "",
      request.expectedDays + " days",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  },

  getQueueSearchQuery(anchorDate) {
    return this._queueSearchQuery[anchorDate] || "";
  },

  setQueueSearchQuery(anchorDate, query) {
    this._queueSearchQuery[anchorDate] = query;
  },

  getTimelineSeverityFilter(filterScope) {
    return this._timelineSeverityFilter[filterScope] || "";
  },

  setTimelineSeverityFilter(filterScope, severity) {
    this._timelineSeverityFilter[filterScope] = severity;
  },

  allotmentMatchesSeverity(allotment, severity) {
    if (!severity) {
      return true;
    }
    var patient = globalThis.Store.getPatient(allotment.patientId);
    return Boolean(patient && patient.severity === severity);
  },

  filterAllotmentsBySeverity(allotments, severity) {
    var self = this;
    if (!severity) {
      return allotments;
    }
    return allotments.filter(function (allotment) {
      return self.allotmentMatchesSeverity(allotment, severity);
    });
  },

  pickBedForRequest(request, allotments, anchorDate) {
    var mode = this.getBedsPageMode();
    var expectedDays = request.expectedDays || 1;
    var preferredAdmit = request.requestedAdmitDate;
    var rangeStart = this.rangeStart(anchorDate || preferredAdmit);
    if (preferredAdmit && rangeStart < preferredAdmit) {
      rangeStart = preferredAdmit;
    }
    var isDay = mode === "day";
    var rangeEndExclusive = isDay
      ? globalThis.BedSlots.addDays(preferredAdmit || rangeStart, expectedDays)
      : this.rangeEndExclusive(rangeStart);
    return globalThis.BedSlots.pickBestBed(
      request,
      Store.getBeds(),
      Store.getWards(),
      allotments || this.rangeAllotments(rangeStart),
      {
        admitDate: preferredAdmit,
        rangeStart: rangeStart,
        rangeEndExclusive: rangeEndExclusive,
        horizon: isDay ? expectedDays : globalThis.BedSlots.horizon(),
        scanHorizon: !isDay,
      }
    );
  },

  suggestBedForRequest(request, anchorDate) {
    return this.pickBedForRequest(request, this.rangeAllotments(anchorDate), anchorDate);
  },

  planBulkAssignments(anchorDate, requestIds) {
    var self = this;
    var mode = this.getBedsPageMode();
    var rangeStart = this.rangeStart(anchorDate);
    var rangeEnd = this.rangeEndExclusive(anchorDate);
    // Daily free-windows always use the full horizon so multi-day stays can pack.
    var packStart = rangeStart;
    var packEnd = rangeEnd;
    var requests = this.queueRequestsForPage(anchorDate);
    if (requestIds && requestIds.length) {
      var selected = {};
      requestIds.forEach(function (id) {
        selected[id] = true;
      });
      requests = requests.filter(function (request) {
        return selected[request.id];
      });
    }
    var allotments = this.rangeAllotments(anchorDate).slice();
    var placements = [];
    var placedIds = {};
    var beds = globalThis.Store.getBeds();
    var wards = globalThis.Store.getWards();
    var wardMap = {};
    wards.forEach(function (ward) {
      wardMap[ward.id] = ward;
    });

    function matchesBed(request, bed) {
      var ward = wardMap[bed.wardId];
      return (
        globalThis.BedSlots.bedMatchesRequest(bed, ward, request, { matchMode: "exact" }) ||
        globalThis.BedSlots.bedMatchesRequest(bed, ward, request, { matchMode: "wardType" }) ||
        globalThis.BedSlots.bedMatchesRequest(bed, ward, request, { matchMode: "department" }) ||
        globalThis.BedSlots.bedMatchesRequest(bed, ward, request, { matchMode: "any" })
      );
    }

    function matchModeFor(request, bed) {
      var ward = wardMap[bed.wardId];
      if (globalThis.BedSlots.bedMatchesRequest(bed, ward, request, { matchMode: "exact" })) {
        return "exact";
      }
      if (globalThis.BedSlots.bedMatchesRequest(bed, ward, request, { matchMode: "wardType" })) {
        return "wardType";
      }
      if (globalThis.BedSlots.bedMatchesRequest(bed, ward, request, { matchMode: "department" })) {
        return "department";
      }
      return "any";
    }

    function pushPlacement(request, slot) {
      var patient = globalThis.Store.getPatient(request.patientId);
      placements.push({ request: request, patient: patient, slot: slot });
      placedIds[request.id] = true;
      allotments.push({
        id: "preview-" + request.id,
        bedId: slot.bedId,
        patientId: request.patientId,
        bedRequestId: request.id,
        admitDate: slot.admitDate,
        dischargeDate: slot.dischargeDate,
        startTime: slot.startTime || null,
        endTime: slot.endTime || null,
        bookingMode: slot.bookingMode || (slot.startTime ? "Hourly" : "Daily"),
        status: "Assigned",
      });
    }

    function sortDailyCandidates(candidates) {
      candidates.sort(function (a, b) {
        var dayDiff = (b.expectedDays || 1) - (a.expectedDays || 1);
        if (dayDiff !== 0) {
          return dayDiff;
        }
        return (
          self.queuePriorityScoreForPatient(globalThis.Store.getPatient(b.patientId)) -
          self.queuePriorityScoreForPatient(globalThis.Store.getPatient(a.patientId))
        );
      });
    }

    function admitDateForWindow(request, window, exactDateOnly) {
      var minAdmit = request.requestedAdmitDate;
      var expectedDays = request.expectedDays || 1;
      if (!minAdmit) {
        return null;
      }

      if (exactDateOnly) {
        if (minAdmit < window.start || minAdmit >= window.end) {
          return null;
        }
      } else {
        minAdmit = window.start < minAdmit ? minAdmit : window.start;
        if (minAdmit >= window.end) {
          return null;
        }
      }

      if (globalThis.BedSlots.addDays(minAdmit, expectedDays) > window.end) {
        return null;
      }
      return minAdmit;
    }

    function packDailyGaps(exactDateOnly) {
      var progress = true;
      while (progress) {
        progress = false;
        beds.forEach(function (bed) {
          if (bed.status !== "Active" || globalThis.BedSlots.isHourlyBed(bed)) {
            return;
          }
          var windows = globalThis.BedSlots.freeWindows(bed.id, packStart, packEnd, allotments);
          windows.forEach(function (window) {
            var candidates = requests.filter(function (request) {
              if (
                placedIds[request.id] ||
                globalThis.BedSlots.isHourlyRequest(request) ||
                !matchesBed(request, bed)
              ) {
                return false;
              }
              var admitDate = admitDateForWindow(request, window, exactDateOnly);
              if (!admitDate) {
                return false;
              }
              return globalThis.BedSlots.isBedFree(
                bed.id,
                admitDate,
                request.expectedDays || 1,
                allotments
              );
            });
            if (!candidates.length) {
              return;
            }
            sortDailyCandidates(candidates);
            var request = candidates[0];
            var expectedDays = request.expectedDays || 1;
            var admitDate = admitDateForWindow(request, window, exactDateOnly);
            var ward = wardMap[bed.wardId];
            pushPlacement(request, {
              bedId: bed.id,
              bedName: bed.name,
              wardId: ward.id,
              wardName: ward.name,
              wardType: ward.wardType,
              departmentId: ward.departmentId,
              admitDate: admitDate,
              expectedDays: expectedDays,
              dischargeDate: globalThis.BedSlots.addDays(admitDate, expectedDays),
              bookingMode: "Daily",
              matchMode: matchModeFor(request, bed),
            });
            progress = true;
          });
        });
      }
    }

    function pickHourlyRequest(bed, date, durationHint) {
      var exact = null;
      var fallback = null;
      for (var i = 0; i < requests.length; i++) {
        var request = requests[i];
        if (
          placedIds[request.id] ||
          !globalThis.BedSlots.isHourlyRequest(request) ||
          !matchesBed(request, bed)
        ) {
          continue;
        }
        if (request.requestedAdmitDate && date < request.requestedAdmitDate) {
          continue;
        }
        if (durationHint && (request.expectedMinutes || 120) > durationHint) {
          continue;
        }
        if (request.requestedAdmitDate === date) {
          exact = request;
          break;
        }
        if (!fallback) {
          fallback = request;
        }
      }
      return exact || fallback;
    }

    function packHourlyDate(date) {
      beds.forEach(function (bed) {
        if (bed.status !== "Active" || !globalThis.BedSlots.isHourlyBed(bed)) {
          return;
        }
        var ward = wardMap[bed.wardId];
        var cursor = globalThis.SchedulerSlots.DAY_START;
        while (cursor < globalThis.SchedulerSlots.DAY_END) {
          if (cursor >= globalThis.SchedulerSlots.BREAK_START && cursor < globalThis.SchedulerSlots.BREAK_END) {
            cursor = globalThis.SchedulerSlots.BREAK_END;
            continue;
          }

          var blockEnd =
            cursor < globalThis.SchedulerSlots.BREAK_START
              ? globalThis.SchedulerSlots.BREAK_START
              : globalThis.SchedulerSlots.DAY_END;
          var maxFit = blockEnd - cursor;
          if (maxFit < 60) {
            cursor = blockEnd === globalThis.SchedulerSlots.BREAK_START ? globalThis.SchedulerSlots.BREAK_END : blockEnd;
            continue;
          }

          var request = pickHourlyRequest(bed, date, maxFit);
          if (!request) {
            break;
          }

          var duration = request.expectedMinutes || 120;
          if (duration > maxFit) {
            if (maxFit >= 180) {
              duration = 180;
            } else if (maxFit >= 120) {
              duration = 120;
            } else if (maxFit >= 90) {
              duration = 90;
            } else {
              duration = 60;
            }
          }

          var endMin = cursor + duration;
          if (
            globalThis.SchedulerSlots.overlapsBreak({ start: cursor, end: endMin }) ||
            endMin > globalThis.SchedulerSlots.DAY_END
          ) {
            cursor += globalThis.SchedulerSlots.STEP;
            continue;
          }

          if (
            !globalThis.BedSlots.isBedFree(bed.id, date, 1, allotments, request.id, {
              startTime: globalThis.SchedulerSlots.fromMinutes(cursor),
              endTime: globalThis.SchedulerSlots.fromMinutes(endMin),
            })
          ) {
            cursor += globalThis.SchedulerSlots.STEP;
            continue;
          }

          pushPlacement(request, {
            bedId: bed.id,
            bedName: bed.name,
            wardId: ward.id,
            wardName: ward.name,
            wardType: ward.wardType,
            departmentId: ward.departmentId,
            admitDate: date,
            expectedDays: 1,
            expectedMinutes: duration,
            dischargeDate: globalThis.BedSlots.addDays(date, 1),
            startTime: globalThis.SchedulerSlots.fromMinutes(cursor),
            endTime: globalThis.SchedulerSlots.fromMinutes(endMin),
            bookingMode: "Hourly",
            matchMode: matchModeFor(request, bed),
          });
          cursor = endMin;
        }
      });
    }

    // Exact-date daily packing first, then (15-day only) fill leftover gaps
    // with any matching queue request so utilization stays high.
    packDailyGaps(true);
    if (mode === "range") {
      packDailyGaps(false);
    }

    if (mode === "day") {
      packHourlyDate(packStart);
    } else {
      BedSlots.rangeDates(packStart).forEach(function (date) {
        packHourlyDate(date);
      });
    }

    return {
      placements: placements,
      skipped: requests.length - placements.length,
      total: requests.length,
    };
  },

  applyBulkPreview(anchorDate) {
    var placements = this._bulkPreviewPlacements || [];
    placements.forEach(function (placement) {
      Store.assignBedRequest(
        placement.request.id,
        placement.slot.bedId,
        placement.slot.admitDate,
        placement.slot.startTime || null
      );
    });
    return {
      assigned: placements.length,
      skipped: 0,
      total: placements.length,
    };
  },

  renderQueueSearchBox(anchorDate) {
    var query = this.getQueueSearchQuery(anchorDate);
    return (
      '<div class="timeline-queue-search">' +
      '<label class="timeline-queue-search-box" for="queue-search">' +
      globalThis.UI.icons.search() +
      '<input type="search" id="queue-search" placeholder="Search patients…" value="' +
      String(query).replace(/"/g, "&quot;") +
      '" autocomplete="off" />' +
      "</label></div>"
    );
  },

  renderQueueItem(request, patientMap) {
    var patient = patientMap[request.patientId];
    var department = globalThis.Store.getDepartment(request.departmentId);
    var name = patient ? patient.name : request.id;
    var borderClass = patient ? this.patientBorderClass(patient) : "";
    var searchHaystack = this.buildQueueSearchHaystack(request, patient, department);
    var isHourly = globalThis.BedSlots.isHourlyRequest(request);
    var stayLabel = isHourly
      ? (request.expectedMinutes || 60) + " min" +
        (request.preferredStartTime ? " · " + request.preferredStartTime : "")
      : (request.expectedDays || 1) + " day" + (request.expectedDays === 1 ? "" : "s");

    return (
      '<label class="timeline-queue-item ' +
      borderClass +
      '" data-bed-request-id="' +
      request.id +
      '" data-search="' +
      searchHaystack.replace(/&/g, "&amp;").replace(/"/g, "&quot;") +
      '" data-severity="' +
      (patient && patient.severity ? patient.severity : "") +
      '">' +
      '<span class="timeline-queue-lead">' +
      '<span class="timeline-patient-avatar" aria-hidden="true">' +
      this.patientInitials(patient) +
      "</span>" +
      '<input type="checkbox" class="timeline-queue-check" data-bed-request-id="' +
      request.id +
      '" aria-label="Select ' +
      name.replace(/"/g, "&quot;") +
      ' for allocation" />' +
      "</span>" +
      '<div class="timeline-patient-details">' +
      '<span class="timeline-patient-name">' +
      name +
      "</span>" +
      '<span class="timeline-queue-line">' +
      (patient ? '<span class="timeline-patient-mrn">' + patient.mrn + "</span>" : "") +
      (patient && department ? '<span class="timeline-queue-sep">·</span>' : "") +
      (department ? '<span class="timeline-queue-service">' + department.name + "</span>" : "") +
      "</span>" +
      (patient
        ? '<span class="timeline-patient-tags">' +
          '<span class="timeline-queue-pref">' +
          globalThis.BedSlots.shortDayLabel(request.requestedAdmitDate) +
          " · " +
          stayLabel +
          "</span>" +
          globalThis.UI.badge(patient.patientType) +
          globalThis.UI.badge(patient.severity) +
          globalThis.UI.badge("Pending") +
          (isHourly ? globalThis.UI.badge("Hourly") : "") +
          (request.preferredWardType ? globalThis.UI.badge(request.preferredWardType) : "") +
          "</span>"
        : "") +
      "</div></label>"
    );
  },

  renderQueueSelectAll() {
    return (
      '<label class="timeline-queue-select-all" title="Select all visible patients">' +
      '<input type="checkbox" id="queue-select-all" class="timeline-queue-check timeline-queue-check--all" aria-label="Select all visible patients" />' +
      "</label>"
    );
  },

  renderQueuePanel(anchorDate) {
    var self = this;
    var mode = this.getBedsPageMode();
    var requests = this.queueRequestsForPage(anchorDate);
    var emptyMsg =
      mode === "range"
        ? "No pending bed requests in this " + globalThis.BedSlots.horizon() + "-day window."
        : "No pending bed requests for this day.";

    if (!requests.length) {
      return (
        '<aside class="timeline-patients-panel timeline-queue-panel" aria-label="Awaiting patients queue">' +
        '<div class="timeline-patients-head">' +
        '<span class="timeline-patients-title">Awaiting Patients Queue</span>' +
        '<span class="timeline-patients-count">0</span>' +
        "</div>" +
        '<p class="timeline-patients-empty">' +
        emptyMsg +
        "</p>" +
        "</aside>"
      );
    }

    var patientMap = globalThis.Store.getPatientMap();
    var items = requests
      .map(function (request) {
        return self.renderQueueItem(request, patientMap);
      })
      .join("");

    return (
      '<aside class="timeline-patients-panel timeline-queue-panel" aria-label="Awaiting patients queue">' +
      '<div class="timeline-patients-head">' +
      this.renderQueueSelectAll() +
      '<span class="timeline-patients-title">Awaiting Patients Queue</span>' +
      '<span class="timeline-patients-count">' +
      requests.length +
      "</span>" +
      "</div>" +
      this.renderQueueSearchBox(anchorDate) +
      '<div class="timeline-patients-list timeline-queue-list">' +
      items +
      "</div>" +
      '<p class="timeline-queue-search-empty" hidden>No matching patients in the queue.</p>' +
      "</aside>"
    );
  },

  renderPatientMeta(patient) {
    if (!patient) {
      return "";
    }
    var pills =
      '<span class="timeline-block-pill">' +
      patient.mrn +
      "</span>" +
      '<span class="timeline-block-pill timeline-block-pill--' +
      patient.patientType.toLowerCase() +
      '">' +
      patient.patientType +
      "</span>";
    if (patient.severity) {
      pills +=
        '<span class="timeline-block-pill timeline-block-pill--sev-' +
        patient.severity.toLowerCase() +
        '">' +
        patient.severity +
        "</span>";
    }
    return '<div class="timeline-block-meta">' + pills + "</div>";
  },

  isNullishStaffField(value) {
    if (value === null || value === undefined) {
      return true;
    }
    var text = String(value).trim().toLowerCase();
    return text === "" || text === "null" || text === "undefined";
  },

  renderStaffAvatar(staffName, options) {
    options = options || {};
    if (!staffName) {
      return "";
    }
    var initials = String(staffName)
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 2)
      .toUpperCase();
    var unknownClass = options.unknown ? " timeline-block-avatar--staff-unknown" : "";
    return (
      '<span class="timeline-block-avatar timeline-block-avatar--staff' +
      unknownClass +
      '" title="' +
      staffName +
      '">' +
      (initials || "??") +
      "</span>"
    );
  },

  renderBedAvatar(bed, ward) {
    if (!bed) {
      return "";
    }
    var color =
      ward && ward.wardType === "ICU"
        ? "#364fc7"
        : ward && ward.wardType === "Private"
          ? "#e67700"
          : "#2b8a3e";
    var initials = String(bed.name || "??")
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 2)
      .toUpperCase();
    return (
      '<span class="timeline-block-avatar" style="background:' +
      color +
      '" title="' +
      bed.name +
      '">' +
      initials +
      "</span>"
    );
  },

  renderAllotmentBlock(allotment, anchorDate, options) {
    options = options || {};
    var mode = options.mode || (this.getBedsPageMode() === "range" ? "multiday" : "hourly");
    var patient = globalThis.Store.getPatient(allotment.patientId);
    var bed = globalThis.Store.getBed(allotment.bedId);
    var ward = bed ? globalThis.Store.getWard(bed.wardId) : null;
    var days = globalThis.BedSlots.stayDays(allotment.admitDate, allotment.dischargeDate);
    var isTimed = globalThis.BedSlots.isHourlyAllotment(allotment);
    var pos;

    if (mode === "hourly") {
      if (isTimed) {
        var startMin = globalThis.SchedulerSlots.toMinutes(allotment.startTime);
        var endMin = globalThis.SchedulerSlots.toMinutes(allotment.endTime);
        pos = globalThis.SchedulerSlots.percentPosition(startMin, Math.max(15, endMin - startMin));
      } else {
        // Overnight / daily stay occupying this calendar day → full working hours.
        pos = globalThis.SchedulerSlots.percentPosition(
          globalThis.SchedulerSlots.DAY_START,
          globalThis.SchedulerSlots.DAY_END - globalThis.SchedulerSlots.DAY_START
        );
      }
    } else {
      pos = globalThis.BedSlots.clipPercentPosition(
        allotment.admitDate,
        days,
        this.rangeStart(anchorDate)
      );
    }
    if (!pos) {
      return "";
    }

    var label = patient ? patient.name : allotment.id;
    var rawStaffId = allotment.staffId || allotment.staffid || "";
    var staffUnknown = this.isNullishStaffField(rawStaffId);
    var staffLabel =
      allotment.staffName ||
      allotment.staffname ||
      rawStaffId ||
      "No Staff Allocated";
    var staffNameClass = staffUnknown
      ? " timeline-block-operator-name--staff-unknown"
      : "";
    var lastDay = globalThis.BedSlots.addDays(allotment.dischargeDate, -1);
    var isNarrow = mode === "hourly" ? pos.width < 12 : pos.width < 12;
    var isCompact = mode === "hourly" ? pos.width < 18 : pos.width < 20;
    var sizeClass = isNarrow ? " timeline-block--narrow" : isCompact ? " timeline-block--compact" : "";
    var timeLabel = isTimed ? allotment.startTime + "–" + allotment.endTime : "";
    var title =
      label +
      " · " +
      (isTimed
        ? allotment.admitDate + " " + timeLabel
        : allotment.admitDate + "–" + lastDay + " · " + days + "d") +
      (ward ? " · " + ward.name : "") +
      (bed ? " · " + bed.name : "") +
      (staffLabel ? " · " + staffLabel : "");

    var metaHtml = isNarrow ? "" : this.renderPatientMeta(patient);
    var serviceHtml = isNarrow
      ? ""
      : '<div class="timeline-block-service-row">' +
        '<span class="timeline-block-service">' +
        (isTimed ? timeLabel : days + " day stay") +
        "</span>" +
        (isTimed ? globalThis.UI.badge("Hourly") : "") +
        (ward ? globalThis.UI.badge(ward.wardType) : "") +
        "</div>";

    // Same lead/procedure/lag segment strip as Schedule Day cards.
    var leadPct = 20;
    var procedurePct = 60;
    var lagPct = 20;

    var operatorRow =
      '<div class="timeline-block-operator-row timeline-block-operator-row--staff' +
      (staffUnknown ? " timeline-block-operator-row--staff-unknown" : "") +
      '">' +
      this.renderStaffAvatar(staffLabel, { unknown: staffUnknown }) +
      '<div class="timeline-block-operator-info">' +
      '<span class="timeline-block-operator-name timeline-block-operator-name--staff' +
      staffNameClass +
      '">' +
      staffLabel +
      "</span>" +
      (allotment.role
        ? '<span class="timeline-block-operator-designation">' +
          allotment.role +
          "</span>"
        : "") +
      "</div></div>";

    return (
      '<div class="timeline-block timeline-block--rich' +
      sizeClass +
      " " +
      this.wardTypeBlockClass(ward && ward.wardType) +
      '" data-allotment-id="' +
      allotment.id +
      '" data-severity="' +
      (patient && patient.severity ? patient.severity : "") +
      '" style="left:' +
      pos.left +
      "%;width:" +
      pos.width +
      '%;" title="' +
      title.replace(/&/g, "&amp;").replace(/"/g, "&quot;") +
      '">' +
      '<div class="timeline-block-segments" aria-hidden="true">' +
      '<span class="slot-segment slot-lead" style="width:' +
      leadPct +
      '%"></span>' +
      '<span class="slot-segment slot-procedure" style="width:' +
      procedurePct +
      '%"></span>' +
      '<span class="slot-segment slot-lag" style="width:' +
      lagPct +
      '%"></span>' +
      "</div>" +
      '<div class="timeline-block-body">' +
      '<div class="timeline-block-main">' +
      '<div class="timeline-block-top">' +
      '<div class="timeline-block-patient">' +
      '<span class="timeline-block-name">' +
      label +
      "</span>" +
      metaHtml +
      "</div>" +
      "</div>" +
      serviceHtml +
      "</div>" +
      operatorRow +
      "</div></div>"
    );
  },

  renderBedRow(bed, ward, department, allotments, anchorDate, options) {
    options = options || {};
    var self = this;
    var mode = options.mode || "multiday";
    var bedAllotments = allotments.filter(function (allotment) {
      var resolved = globalThis.Store.findBedByReference(allotment.bedId);
      return resolved && resolved.id === bed.id;
    });
    var blocks = bedAllotments
      .map(function (allotment) {
        return self.renderAllotmentBlock(allotment, anchorDate, { mode: mode });
      })
      .join("");
    var trackClass = bed.status === "Under Maintenance" ? " timeline-track--maintenance" : "";
    var breakBand =
      mode === "hourly"
        ? globalThis.SchedulerSlots.renderBreakBand({
            compact: true,
            label: globalThis.SchedulerSlots.breakLabel() + " Break",
          })
        : "";
    var hourlyBadge = globalThis.BedSlots.isHourlyBed(bed) ? globalThis.UI.badge("Hourly") : "";

    return (
      '<div class="timeline-row ' +
      this.wardTypeClass(ward.wardType) +
      (globalThis.BedSlots.isHourlyBed(bed) ? " timeline-row--hourly-bed" : "") +
      '">' +
      '<div class="timeline-setup">' +
      '<div class="timeline-setup-head">' +
      '<span class="timeline-setup-name">' +
      bed.name +
      "</span>" +
      globalThis.UI.badge(ward.wardType) +
      hourlyBadge +
      '<span class="timeline-setup-count">' +
      bedAllotments.length +
      " occupied</span>" +
      "</div>" +
      '<div class="timeline-setup-availability">' +
      '<span class="timeline-setup-avail">' +
      department.name +
      " · " +
      ward.name +
      "</span>" +
      "</div>" +
      (bed.status === "Under Maintenance" ? globalThis.UI.setupStatusBadge(bed.status) : "") +
      "</div>" +
      '<div class="timeline-track' +
      trackClass +
      '" data-bed-id="' +
      bed.id +
      '">' +
      breakBand +
      blocks +
      "</div></div>"
    );
  },

  renderGroupHeader(label, sublabel) {
    return (
      '<div class="timeline-group-header">' +
      '<div class="timeline-group-label">' +
      '<span class="timeline-group-title">' +
      label +
      "</span>" +
      (sublabel ? '<span class="timeline-group-sub">' + sublabel + "</span>" : "") +
      "</div>" +
      '<div class="timeline-group-track" aria-hidden="true"></div>' +
      "</div>"
    );
  },

  renderDayHeader(anchorDate) {
    var dates = this.rangeDates(anchorDate);
    var horizon = dates.length;
    var dayCells = dates
      .map(function (date, index) {
        var left;
        var alignClass = "";
        if (index === 0) {
          left = 0;
          alignClass = " timeline-hour--start";
        } else if (index === dates.length - 1) {
          // Pin to the track's right edge so the label stays inside the last column.
          left = 100;
          alignClass = " timeline-hour--end";
        } else {
          // Center label within its day column.
          left = ((index + 0.5) / horizon) * 100;
        }
        return (
          '<span class="timeline-hour timeline-day-tick' +
          alignClass +
          '" style="left:' +
          left +
          '%;">' +
          globalThis.BedSlots.shortDayLabel(date) +
          "</span>"
        );
      })
      .join("");

    return (
      '<div class="timeline-table-head">' +
      '<div class="timeline-hours">' +
      '<span class="timeline-corner">Bed / Day</span>' +
      '<div class="timeline-hours-track timeline-days-track">' +
      dayCells +
      "</div></div></div>"
    );
  },

  renderHourHeader() {
    var hourLabels = globalThis.SchedulerSlots.hourLabels();
    var hourRange = globalThis.SchedulerSlots.DAY_END - globalThis.SchedulerSlots.DAY_START;
    var hourCells = hourLabels
      .map(function (label, index) {
        var left = ((globalThis.SchedulerSlots.toMinutes(label) - globalThis.SchedulerSlots.DAY_START) / hourRange) * 100;
        var alignClass = "";
        if (index === 0) {
          alignClass = " timeline-hour--start";
        } else if (index === hourLabels.length - 1) {
          alignClass = " timeline-hour--end";
        }
        return (
          '<span class="timeline-hour' +
          alignClass +
          '" style="left:' +
          left +
          '%">' +
          label.replace(":00", "") +
          "</span>"
        );
      })
      .join("");

    return (
      '<div class="timeline-table-head">' +
      '<div class="timeline-hours">' +
      '<span class="timeline-corner">Bed / Time</span>' +
      '<div class="timeline-hours-track">' +
      hourCells +
      globalThis.SchedulerSlots.renderBreakBand({
        compact: true,
        label: globalThis.SchedulerSlots.breakLabel() + " Break",
      }) +
      "</div></div></div>"
    );
  },

  renderGroupedBedRows(allotments, anchorDate, options) {
    var self = this;
    options = options || {};
    var grouped = globalThis.Store.getBedsGrouped();
    if (!grouped.length) {
      return "";
    }

    return grouped
      .map(function (deptGroup) {
        return deptGroup.wards
          .map(function (wardGroup) {
            var wardHtml = self.renderGroupHeader(
              wardGroup.ward.name,
              deptGroup.department.name + " · " + wardGroup.ward.wardType
            );
            var bedRows = wardGroup.beds
              .map(function (bed) {
                return self.renderBedRow(
                  bed,
                  wardGroup.ward,
                  deptGroup.department,
                  allotments,
                  anchorDate,
                  options
                );
              })
              .join("");
            return wardHtml + bedRows;
          })
          .join("");
      })
      .join("");
  },

  renderMultiDayTimeline(anchorDate) {
    var severity = this.getTimelineSeverityFilter(anchorDate);
    var allotments = this.filterAllotmentsBySeverity(this.rangeAllotments(anchorDate), severity);

    if (!globalThis.Store.getBedsGrouped().length) {
      return (
        '<div class="schedule-empty">' +
        "<p>No active beds to display. Seed departments, wards, and beds first.</p>" +
        "</div>"
      );
    }

    return (
      '<div class="timeline-wrap timeline-wrap--beds">' +
      this.renderDayHeader(anchorDate) +
      this.renderGroupedBedRows(allotments, anchorDate, { mode: "multiday" }) +
      "</div>"
    );
  },

  renderHourlyTimeline(scheduleDate) {
    var severity = this.getTimelineSeverityFilter(scheduleDate);
    var allotments = this.allotmentsOccupyingDate(scheduleDate, severity);

    if (!globalThis.Store.getBedsGrouped().length) {
      return (
        '<div class="schedule-empty">' +
        "<p>No active beds to display. Seed departments, wards, and beds first.</p>" +
        "</div>"
      );
    }

    return (
      '<div class="timeline-wrap timeline-wrap--beds-hourly">' +
      this.renderHourHeader() +
      this.renderGroupedBedRows(allotments, scheduleDate, { mode: "hourly" }) +
      "</div>"
    );
  },

  renderTimeline(anchorDate) {
    return this.getBedsPageMode() === "range"
      ? this.renderMultiDayTimeline(anchorDate)
      : this.renderHourlyTimeline(anchorDate);
  },

  buildSuggestionElement(request, patient, slot, anchorDate) {
    var mode = this.getBedsPageMode();
    var isHourly = Boolean(slot.startTime && slot.endTime);
    var pos;
    if (mode === "day") {
      if (isHourly) {
        var startMin = globalThis.SchedulerSlots.toMinutes(slot.startTime);
        var endMin = globalThis.SchedulerSlots.toMinutes(slot.endTime);
        pos = globalThis.SchedulerSlots.percentPosition(startMin, Math.max(15, endMin - startMin));
      } else {
        pos = globalThis.SchedulerSlots.percentPosition(
          globalThis.SchedulerSlots.DAY_START,
          globalThis.SchedulerSlots.DAY_END - globalThis.SchedulerSlots.DAY_START
        );
      }
    } else {
      pos = globalThis.BedSlots.clipPercentPosition(
        slot.admitDate,
        slot.expectedDays || 1,
        this.rangeStart(anchorDate)
      );
    }
    if (!pos) {
      return "";
    }
    var label = patient ? patient.name : request.id;
    var endDate = globalThis.BedSlots.addDays(slot.admitDate, (slot.expectedDays || 1) - 1);
    var title = isHourly
      ? label +
        " · " +
        slot.admitDate +
        " " +
        slot.startTime +
        "–" +
        slot.endTime +
        " · " +
        slot.bedName
      : label +
        " · " +
        slot.admitDate +
        "–" +
        endDate +
        " · " +
        slot.expectedDays +
        "d · " +
        slot.bedName;
    var isCompact = mode === "day" && isHourly && pos.width < 18;

    return (
      '<div class="timeline-suggestion' +
      (isCompact ? " timeline-suggestion--compact" : "") +
      '" data-bed-request-id="' +
      request.id +
      '" data-bed-id="' +
      slot.bedId +
      '" data-admit-date="' +
      slot.admitDate +
      '" data-start-time="' +
      (slot.startTime || "") +
      '" data-severity="' +
      (patient && patient.severity ? patient.severity : "") +
      '" style="left:' +
      pos.left +
      "%;width:" +
      pos.width +
      '%;" role="status" aria-live="polite" title="' +
      title.replace(/&/g, "&amp;").replace(/"/g, "&quot;") +
      '">' +
      '<div class="timeline-suggestion-body">' +
      '<span class="timeline-suggestion-patient">' +
      label +
      "</span></div>" +
      '<div class="timeline-suggestion-actions">' +
      '<button type="button" class="timeline-suggestion-btn timeline-suggestion-btn--reject" aria-label="Reject suggestion for ' +
      label.replace(/"/g, "&quot;") +
      '">' +
      '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
      "</button>" +
      '<button type="button" class="timeline-suggestion-btn timeline-suggestion-btn--accept" aria-label="Accept suggestion for ' +
      label.replace(/"/g, "&quot;") +
      '">' +
      '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>' +
      "</button></div></div>"
    );
  },

  clearSlotSuggestions() {
    document.querySelectorAll(".timeline-suggestion").forEach(function (node) {
      node.remove();
    });
    document.querySelectorAll(".timeline-queue-item--selected").forEach(function (node) {
      node.classList.remove("timeline-queue-item--selected");
      node.setAttribute("aria-pressed", "false");
    });
    document.querySelectorAll(".timeline-queue-item--preview").forEach(function (node) {
      node.classList.remove("timeline-queue-item--preview");
    });
    document.querySelectorAll(".timeline-queue-item--spotlight").forEach(function (node) {
      node.classList.remove("timeline-queue-item--spotlight");
    });
    document.querySelectorAll(".timeline-queue-slot").forEach(function (node) {
      node.remove();
    });
    document.querySelectorAll(".timeline-queue-item--unavailable").forEach(function (node) {
      node.classList.remove("timeline-queue-item--unavailable");
    });
    document.querySelectorAll(".timeline-row--suggested").forEach(function (node) {
      node.classList.remove("timeline-row--suggested");
    });
    document.querySelectorAll(".timeline-track--suggested").forEach(function (node) {
      node.classList.remove("timeline-track--suggested");
    });

    this._bulkPreviewPlacements = null;

    var page = document.querySelector(".schedule-page[data-beds-date]");
    if (page) {
      this.hideBulkPreviewToolbar(page.getAttribute("data-beds-date"));
    }
  },

  formatAllocationSlotLabel(slot) {
    if (!slot) {
      return "";
    }
    if (slot.startTime && slot.endTime) {
      return slot.startTime + "–" + slot.endTime;
    }
    if (!slot.admitDate) {
      return "";
    }
    var days = slot.expectedDays || 1;
    var endDate = globalThis.BedSlots.addDays(slot.admitDate, days - 1);
    if (days === 1 || slot.admitDate === endDate) {
      return globalThis.BedSlots.shortDayLabel(slot.admitDate);
    }
    return globalThis.BedSlots.shortDayLabel(slot.admitDate) + "–" + globalThis.BedSlots.shortDayLabel(endDate);
  },

  setQueueItemSlotBadge(item, timeLabel) {
    if (!item || !timeLabel) {
      return;
    }
    var existing = item.querySelector(".timeline-queue-slot");
    if (existing) {
      existing.remove();
    }
    var nameEl = item.querySelector(".timeline-patient-name");
    if (!nameEl) {
      return;
    }
    var row = nameEl.closest(".timeline-patient-name-row");
    if (!row) {
      row = document.createElement("span");
      row.className = "timeline-patient-name-row";
      nameEl.parentNode.insertBefore(row, nameEl);
      row.appendChild(nameEl);
    }
    var badge = document.createElement("button");
    badge.type = "button";
    badge.className = "timeline-queue-slot";
    badge.textContent = timeLabel;
    badge.title = "Show suggestion on board";
    badge.setAttribute("aria-label", "Show allocated time on board: " + timeLabel);
    row.appendChild(badge);
  },

  clearSuggestionSpotlight() {
    document.querySelectorAll(".timeline-suggestion--spotlight").forEach(function (node) {
      node.classList.remove("timeline-suggestion--spotlight");
    });
    document.querySelectorAll(".timeline-queue-item--spotlight").forEach(function (node) {
      node.classList.remove("timeline-queue-item--spotlight");
    });
  },

  spotlightSuggestionForRequest(requestId) {
    if (!requestId) {
      return;
    }

    this.clearSuggestionSpotlight();

    var suggestion = document.querySelector(
      '.timeline-suggestion[data-bed-request-id="' + requestId + '"]'
    );
    var item = document.querySelector(
      '.timeline-queue-item[data-bed-request-id="' + requestId + '"]'
    );

    if (item) {
      item.classList.add("timeline-queue-item--spotlight");
    }

    if (!suggestion) {
      return;
    }

    var row = suggestion.closest(".timeline-row");
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    suggestion.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

    void suggestion.offsetWidth;
    suggestion.classList.add("timeline-suggestion--spotlight");
  },

  markQueueItemPreview(item, timeLabel) {
    if (!item) {
      return;
    }
    item.classList.add("timeline-queue-item--preview");
    this.setQueueItemSlotBadge(item, timeLabel);
  },

  showSlotSuggestion(requestId, anchorDate) {
    this.clearSlotSuggestions();
    var request = globalThis.Store.getBedRequest(requestId);
    if (!request) {
      return;
    }

    var item = document.querySelector(
      '.timeline-queue-item[data-bed-request-id="' + requestId + '"]'
    );
    var slot = this.suggestBedForRequest(request, anchorDate);
    if (!slot) {
      if (item) {
        item.classList.add("timeline-queue-item--unavailable");
        item.setAttribute("aria-pressed", "true");
      }
      if (globalThis.UI && globalThis.UI.showToast) {
        UI.showToast("No free bed matches this request.");
      }
      return;
    }

    var track = document.querySelector('.timeline-track[data-bed-id="' + slot.bedId + '"]');
    if (!track) {
      return;
    }

    var patient = globalThis.Store.getPatient(request.patientId);
    track.classList.add("timeline-track--suggested");
    var row = track.closest(".timeline-row");
    if (row) {
      row.classList.add("timeline-row--suggested");
    }
    track.insertAdjacentHTML(
      "beforeend",
      this.buildSuggestionElement(request, patient, slot, anchorDate)
    );

    if (item) {
      item.classList.add("timeline-queue-item--selected");
      item.setAttribute("aria-pressed", "true");
    }

    this.refreshTimelineSeverityFilter(anchorDate);
  },

  showBulkPreviewToolbar(anchorDate, count, skipped) {
    var bulkBtn = document.getElementById("bulk-assign-btn");
    var previewBar = document.getElementById("schedule-ops-preview");
    var countEl = document.getElementById("bulk-preview-count");
    var skippedEl = document.getElementById("bulk-preview-skipped");

    if (bulkBtn) {
      bulkBtn.hidden = true;
    }
    if (previewBar) {
      previewBar.hidden = false;
    }
    if (countEl) {
      countEl.textContent = String(count);
    }
    if (skippedEl) {
      if (skipped) {
        skippedEl.hidden = false;
        skippedEl.textContent = " · " + skipped + " unplaced";
      } else {
        skippedEl.hidden = true;
        skippedEl.textContent = "";
      }
    }
  },

  hideBulkPreviewToolbar(anchorDate) {
    var previewBar = document.getElementById("schedule-ops-preview");
    var bulkBtn = document.getElementById("bulk-assign-btn");

    if (previewBar) {
      previewBar.hidden = true;
    }
    if (bulkBtn) {
      bulkBtn.hidden = false;
    }
    var confirmBtn = document.getElementById("bulk-preview-confirm");
    if (confirmBtn) {
      confirmBtn.disabled = false;
    }
    if (anchorDate) {
      this.refreshBulkAssignButton(anchorDate);
    }
  },

  updateBulkPreviewToolbarCount(count) {
    var countEl = document.getElementById("bulk-preview-count");
    if (countEl) {
      countEl.textContent = String(count);
    }
  },

  renderBulkPreviewOverlays(anchorDate) {
    var self = this;
    var placements = this._bulkPreviewPlacements || [];

    placements.forEach(function (placement) {
      var track = document.querySelector(
        '.timeline-track[data-bed-id="' + placement.slot.bedId + '"]'
      );
      if (!track) {
        return;
      }
      track.classList.add("timeline-track--suggested");
      track.insertAdjacentHTML(
        "beforeend",
        self.buildSuggestionElement(
          placement.request,
          placement.patient,
          placement.slot,
          anchorDate
        )
      );
      var item = document.querySelector(
        '.timeline-queue-item[data-bed-request-id="' + placement.request.id + '"]'
      );
      if (item) {
        self.markQueueItemPreview(item, self.formatAllocationSlotLabel(placement.slot));
      }
    });

    if (placements.length) {
      this.showBulkPreviewToolbar(anchorDate, placements.length, 0);
    }
    this.refreshTimelineSeverityFilter(anchorDate);
  },

  refreshSuggestionTrackHighlights() {
    document.querySelectorAll(".timeline-track--suggested").forEach(function (track) {
      if (!track.querySelector(".timeline-suggestion")) {
        track.classList.remove("timeline-track--suggested");
        var row = track.closest(".timeline-row");
        if (row && !row.querySelector(".timeline-suggestion")) {
          row.classList.remove("timeline-row--suggested");
        }
      }
    });
  },

  removeSuggestionPreview(requestId, suggestionEl) {
    if (suggestionEl) {
      suggestionEl.remove();
    } else {
      var node = document.querySelector(
        '.timeline-suggestion[data-bed-request-id="' + requestId + '"]'
      );
      if (node) {
        node.remove();
      }
    }

    var item = document.querySelector(
      '.timeline-queue-item[data-bed-request-id="' + requestId + '"]'
    );
    if (item) {
      item.classList.remove("timeline-queue-item--preview", "timeline-queue-item--selected");
      item.setAttribute("aria-pressed", "false");
      var slotBadge = item.querySelector(".timeline-queue-slot");
      if (slotBadge) {
        slotBadge.remove();
      }
    }
    this.refreshSuggestionTrackHighlights();
  },

  acceptSuggestion(requestId, anchorDate, suggestionEl) {
    var bedId = suggestionEl.getAttribute("data-bed-id");
    var admitDate = suggestionEl.getAttribute("data-admit-date");
    var startTime = suggestionEl.getAttribute("data-start-time") || null;
    if (!bedId || !admitDate) {
      return;
    }

    globalThis.Store.assignBedRequest(requestId, bedId, admitDate, startTime || null);

    if (this._bulkPreviewPlacements) {
      this._bulkPreviewPlacements = this._bulkPreviewPlacements.filter(function (placement) {
        return placement.request.id !== requestId;
      });
    }

    this.refreshDayWorkspace(anchorDate);

    if (this._bulkPreviewPlacements && this._bulkPreviewPlacements.length) {
      this.renderBulkPreviewOverlays(anchorDate);
    } else {
      this._bulkPreviewPlacements = null;
      this.hideBulkPreviewToolbar(anchorDate);
    }

    if (globalThis.UI && globalThis.UI.showToast) {
      UI.showToast("Bed allotted.");
    }
  },

  rejectSuggestion(requestId, anchorDate) {
    if (this._bulkPreviewPlacements) {
      this._bulkPreviewPlacements = this._bulkPreviewPlacements.filter(function (placement) {
        return placement.request.id !== requestId;
      });
    }

    this.removeSuggestionPreview(
      requestId,
      document.querySelector('.timeline-suggestion[data-bed-request-id="' + requestId + '"]')
    );

    if (this._bulkPreviewPlacements && this._bulkPreviewPlacements.length) {
      this.updateBulkPreviewToolbarCount(this._bulkPreviewPlacements.length);
    } else if (!document.querySelector(".timeline-suggestion")) {
      this.clearSlotSuggestions();
    }
  },

  async applyBulkPreviewFromToolbar(anchorDate) {
    var confirmBtn = document.getElementById("bulk-preview-confirm");
    var page = document.querySelector('.schedule-page[data-beds-date="' + anchorDate + '"]');
    var mode = this.getBedsPageMode();
    var placements = this._bulkPreviewPlacements || [];
    var recordIds = [];
    var bedIds = [];

    placements.forEach(function (placement) {
      var recordId = placement.request && placement.request.id;
      var bedId = placement.slot && placement.slot.bedId;
      if (recordId && bedId) {
        recordIds.push(recordId);
        bedIds.push(bedId);
      }
    });

    if (confirmBtn) {
      confirmBtn.disabled = true;
    }

    var assignBeds = globalThis.__ignisAssignBedsToPatients;
    var apiAssigned = false;
    if (typeof assignBeds === "function" && recordIds.length) {
      try {
        var ok = await assignBeds(recordIds, bedIds);
        if (!ok) {
          if (confirmBtn) {
            confirmBtn.disabled = false;
          }
          if (globalThis.UI && globalThis.UI.showToast) {
            globalThis.UI.showToast(
              "Bed allocation failed — could not update allocations on the server."
            );
          }
          return false;
        }
        apiAssigned = true;
      } catch (err) {
        if (confirmBtn) {
          confirmBtn.disabled = false;
        }
        if (globalThis.UI && globalThis.UI.showToast) {
          globalThis.UI.showToast(
            "Bed allocation failed — could not update allocations on the server."
          );
        }
        return false;
      }
    }

    var result;
    if (apiAssigned) {
      result = {
        assigned: recordIds.length,
        skipped: 0,
        total: recordIds.length,
      };
    } else {
      result = this.applyBulkPreview(anchorDate);
    }
    this.clearSlotSuggestions();

    if (page && !apiAssigned) {
      page.outerHTML =
        mode === "range" ? this.renderRangeView() : this.renderDayView(anchorDate);
      this.initQueueSuggestions(anchorDate);
      this.initSuggestionActions(anchorDate);
      this.refreshPageToolbar(anchorDate);
      this.initQueueSearch(anchorDate);
      this.initTimelineFilters(anchorDate);
      this.initBulkAssign(anchorDate);
    }

    if (globalThis.UI && globalThis.UI.showToast) {
      UI.showToast(result.assigned + " bed" + (result.assigned === 1 ? "" : "s") + " allotted.");
    }
    return true;
  },

  refreshDayWorkspace(anchorDate) {
    var page = document.querySelector('.schedule-page[data-beds-date="' + anchorDate + '"]');
    if (!page) {
      return;
    }

    var workspace = page.querySelector(".schedule-day-workspace");
    if (!workspace) {
      return;
    }

    workspace.innerHTML =
      '<div class="card schedule-patients-card">' +
      this.renderQueuePanel(anchorDate) +
      "</div>" +
      '<div class="card schedule-timeline-card">' +
      '<div id="timeline-container">' +
      this.renderTimeline(anchorDate) +
      "</div></div>";

    page.removeAttribute("data-queue-init");
    page.removeAttribute("data-suggestion-init");
    page.removeAttribute("data-search-init");
    page.removeAttribute("data-filter-init");
    page.removeAttribute("data-bulk-init");

    this.initQueueSuggestions(anchorDate);
    this.initQueueSearch(anchorDate);
    this.initTimelineFilters(anchorDate);
    this.initSuggestionActions(anchorDate);
    this.initBulkAssign(anchorDate);
    this.refreshPageToolbar(anchorDate);
  },

  getSelectedQueueRequestIds(page) {
    page = page || document.querySelector(".schedule-page[data-beds-date]");
    if (!page) {
      return [];
    }
    var ids = [];
    page
      .querySelectorAll(
        ".timeline-queue-panel .timeline-queue-item:not([hidden]) .timeline-queue-check:checked"
      )
      .forEach(function (input) {
        var id = input.getAttribute("data-bed-request-id");
        if (id) {
          ids.push(id);
        }
      });
    return ids;
  },

  syncQueueSelectAll(page) {
    page = page || document.querySelector(".schedule-page[data-beds-date]");
    if (!page) {
      return;
    }
    var selectAll = page.querySelector("#queue-select-all");
    if (!selectAll) {
      return;
    }
    var checks = page.querySelectorAll(
      ".timeline-queue-panel .timeline-queue-item:not([hidden]) .timeline-queue-check"
    );
    var checked = 0;
    checks.forEach(function (input) {
      if (input.checked) {
        checked += 1;
      }
    });
    selectAll.checked = checks.length > 0 && checked === checks.length;
    selectAll.indeterminate = checked > 0 && checked < checks.length;
  },

  refreshBulkAssignButton(anchorDate) {
    var btn = document.getElementById("bulk-assign-btn");
    if (!btn) {
      return;
    }
    var page = document.querySelector('.schedule-page[data-beds-date="' + anchorDate + '"]');
    var selectedCount = this.getSelectedQueueRequestIds(page).length;
    btn.disabled = selectedCount === 0;
    btn.textContent = "Allocate" + (selectedCount ? " (" + selectedCount + ")" : "");
    this.syncQueueSelectAll(page);
  },

  renderBulkPreviewBar() {
    return (
      '<div id="schedule-ops-preview" class="schedule-ops-preview" hidden>' +
      '<span class="schedule-ops-preview-label">Preview only · <strong id="bulk-preview-count">0</strong> beds' +
      '<span id="bulk-preview-skipped" hidden></span></span>' +
      '<button type="button" class="table-action-btn table-action-btn--neutral" id="bulk-preview-cancel">Clear</button>' +
      '<button type="button" class="table-action-btn table-action-btn--primary" id="bulk-preview-confirm">Confirm all</button>' +
      "</div>"
    );
  },

  renderTimelineSeverityFilter(filterScope) {
    var severity = this.getTimelineSeverityFilter(filterScope);
    return (
      '<div class="schedule-ops-filters">' +
      '<label class="schedule-ops-filter-label" for="timeline-severity">Severity</label>' +
      '<select id="timeline-severity" class="schedule-ops-severity-select" data-filter-scope="' +
      filterScope +
      '">' +
      '<option value=""' +
      (!severity ? " selected" : "") +
      ">All severities</option>" +
      '<option value="High"' +
      (severity === "High" ? " selected" : "") +
      ">High</option>" +
      '<option value="Moderate"' +
      (severity === "Moderate" ? " selected" : "") +
      ">Moderate</option>" +
      '<option value="Low"' +
      (severity === "Low" ? " selected" : "") +
      ">Low</option>" +
      "</select>" +
      "</div>"
    );
  },

  refreshTimelineSeverityFilter(filterScope) {
    var severity = this.getTimelineSeverityFilter(filterScope);
    var select = document.getElementById("timeline-severity");
    if (select) {
      severity = select.value || "";
    }
    document.querySelectorAll(".timeline-block[data-severity], .timeline-suggestion[data-severity]").forEach(
      function (node) {
        if (!severity || node.getAttribute("data-severity") === severity) {
          node.hidden = false;
        } else {
          node.hidden = true;
        }
      }
    );

    var page =
      document.querySelector('.schedule-page[data-beds-date="' + filterScope + '"]') ||
      document.querySelector(".schedule-page[data-beds-date]");
    if (page) {
      this.applyQueueVisibilityFilters(page);
    }
  },

  applyQueueVisibilityFilters(page) {
    if (!page) {
      return;
    }
    var panel = page.querySelector(".timeline-queue-panel");
    if (!panel) {
      return;
    }

    var filterScope = page.getAttribute("data-beds-date") || "";
    var select = document.getElementById("timeline-severity");
    var severity = select ? select.value || "" : this.getTimelineSeverityFilter(filterScope) || "";
    var input = panel.querySelector("#queue-search");
    var query = input ? (input.value || "").trim().toLowerCase() : "";
    if (!query && filterScope) {
      query = (this.getQueueSearchQuery(filterScope) || "").trim().toLowerCase();
    }

    var items = panel.querySelectorAll(".timeline-queue-item");
    var visible = 0;
    items.forEach(function (item) {
      var itemSeverity = item.getAttribute("data-severity") || "";
      var haystack = item.getAttribute("data-search") || "";
      var matchSeverity = !severity || itemSeverity === severity;
      var matchSearch = !query || haystack.indexOf(query) >= 0;
      var match = matchSeverity && matchSearch;
      item.hidden = !match;
      if (match) {
        visible += 1;
      }
    });

    var filtered = Boolean(severity || query);
    var countEl = panel.querySelector(".timeline-patients-count");
    if (countEl) {
      countEl.textContent = filtered ? visible + " / " + items.length : String(items.length);
    }
    var empty = panel.querySelector(".timeline-queue-search-empty");
    if (empty) {
      if (filtered && visible === 0) {
        empty.hidden = false;
        empty.textContent = severity && !query
          ? "No " + severity.toLowerCase() + " severity patients in the queue."
          : "No matching patients in the queue.";
      } else {
        empty.hidden = true;
      }
    }
    if (filterScope) {
      this.refreshBulkAssignButton(filterScope);
    }
  },

  computeDayStats(anchorDate) {
    var mode = this.getBedsPageMode();
    var beds = this.getActiveBeds();
    var allotments =
      mode === "day"
        ? this.allotmentsOccupyingDate(anchorDate)
        : this.rangeAllotments(anchorDate);
    var active = beds.filter(function (bed) {
      return bed.status === "Active";
    }).length;
    var maintenance = beds.filter(function (bed) {
      return bed.status === "Under Maintenance";
    }).length;
    var occupiedBedIds = {};
    allotments.forEach(function (allotment) {
      occupiedBedIds[allotment.bedId] = true;
    });
    return {
      mode: mode,
      allotments: allotments.length,
      active: active,
      maintenance: maintenance,
      beds: beds.length,
      occupied: Object.keys(occupiedBedIds).length,
      pending: this.queueRequestsForPage(anchorDate).length,
      byWardType: this.countAllotmentsByWardType(allotments),
    };
  },

  countAllotmentsByWardType(allotments) {
    var counts = { General: 0, Private: 0, ICU: 0 };
    allotments.forEach(function (allotment) {
      var bed = globalThis.Store.getBed(allotment.bedId);
      var ward = bed ? globalThis.Store.getWard(bed.wardId) : null;
      if (ward && Object.prototype.hasOwnProperty.call(counts, ward.wardType)) {
        counts[ward.wardType] += 1;
      }
    });
    return counts;
  },

  renderQueueSkeletonPanel() {
    var items = [0, 1, 2, 3]
      .map(function () {
        return (
          '<div class="timeline-queue-item timeline-queue-item--skeleton" aria-hidden="true">' +
          '<span class="timeline-skeleton-block timeline-skeleton-line"></span>' +
          '<span class="timeline-skeleton-block timeline-skeleton-line timeline-skeleton-line--short"></span>' +
          "</div>"
        );
      })
      .join("");

    return (
      '<aside class="timeline-patients-panel timeline-queue-panel timeline-queue-panel--loading" aria-busy="true" aria-label="Loading awaiting patients queue">' +
      '<div class="timeline-patients-head">' +
      '<span class="timeline-skeleton-block timeline-skeleton-line timeline-skeleton-line--title"></span>' +
      "</div>" +
      '<div class="timeline-queue-search-box timeline-queue-search-box--skeleton" aria-hidden="true">' +
      '<span class="timeline-skeleton-block timeline-skeleton-search"></span>' +
      "</div>" +
      '<div class="timeline-patients-list timeline-queue-list">' +
      items +
      "</div></aside>"
    );
  },

  renderTimelineSkeletonRow() {
    return (
      '<div class="timeline-row timeline-row--skeleton" aria-hidden="true">' +
      '<div class="timeline-setup">' +
      '<div class="timeline-setup-head">' +
      '<span class="timeline-skeleton-block timeline-skeleton-line timeline-skeleton-line--setup"></span>' +
      "</div>" +
      '<span class="timeline-skeleton-block timeline-skeleton-line timeline-skeleton-line--meta"></span>' +
      "</div>" +
      '<div class="timeline-track timeline-track--skeleton">' +
      '<span class="timeline-skeleton-block timeline-skeleton-track" aria-hidden="true"></span>' +
      "</div></div>"
    );
  },

  renderHourlyTimelineSkeleton() {
    var rows = [0, 1, 2, 3]
      .map(this.renderTimelineSkeletonRow, this)
      .join("");
    return (
      '<div class="timeline-wrap timeline-wrap--beds-hourly timeline-wrap--loading" aria-busy="true" aria-label="Loading beds timeline">' +
      this.renderHourHeader() +
      rows +
      "</div>"
    );
  },

  renderMultiDayTimelineSkeleton() {
    var rows = [0, 1, 2, 3]
      .map(this.renderTimelineSkeletonRow, this)
      .join("");
    var anchorDate =
      typeof globalThis.UI.todayISO === "function"
        ? globalThis.UI.todayISO()
        : globalThis.UI.SCHEDULE_START;
    return (
      '<div class="timeline-wrap timeline-wrap--beds timeline-wrap--loading" aria-busy="true" aria-label="Loading beds timeline">' +
      this.renderDayHeader(anchorDate) +
      rows +
      "</div>"
    );
  },

  renderNavbarStatsSkeleton() {
    return (
      '<div id="schedule-navbar-stats" class="schedule-stats schedule-navbar-stats schedule-stats--loading" aria-busy="true">' +
      '<span class="timeline-skeleton-block timeline-skeleton-stat"></span>' +
      '<span class="timeline-skeleton-block timeline-skeleton-stat timeline-skeleton-stat--short"></span>' +
      '<span class="timeline-skeleton-block timeline-skeleton-stat"></span>' +
      "</div>"
    );
  },

  renderNavbarStatsContent(stats) {
    stats = stats || this.computeDayStats(globalThis.UI.SCHEDULE_START);
    var horizonStat =
      stats.mode === "day"
        ? '<span class="schedule-stat">Hourly day</span>'
        : '<span class="schedule-stat"><strong>' +
          globalThis.BedSlots.horizon() +
          "</strong> day horizon</span>";
    return (
      '<span class="schedule-stat"><strong>' +
      stats.active +
      "</strong> active beds</span>" +
      (stats.maintenance
        ? '<span class="schedule-stat-divider">·</span><span class="schedule-stat"><strong>' +
          stats.maintenance +
          "</strong> in maintenance</span>"
        : "") +
      '<span class="schedule-stat-divider">·</span>' +
      '<span class="schedule-stat"><strong>' +
      stats.occupied +
      "</strong> occupied</span>" +
      '<span class="schedule-stat-divider">·</span>' +
      '<span class="schedule-stat"><strong>' +
      stats.pending +
      "</strong> in queue</span>" +
      '<span class="schedule-stat-divider">·</span>' +
      horizonStat
    );
  },

  renderNavbarStats(anchorDate) {
    this._pageMode = "day";
    var html =
      '<div id="schedule-navbar-stats" class="schedule-stats schedule-navbar-stats">' +
      this.renderNavbarStatsContent(this.computeDayStats(anchorDate)) +
      "</div>";
    this._pageMode = null;
    return html;
  },

  renderNavbarRangeStats() {
    this._pageMode = "range";
    var html =
      '<div id="schedule-navbar-stats" class="schedule-stats schedule-navbar-stats">' +
      this.renderNavbarStatsContent(this.computeRangeStats()) +
      "</div>";
    this._pageMode = null;
    return html;
  },

  computeRangeStats() {
    var today =
      typeof globalThis.UI.todayISO === "function"
        ? globalThis.UI.todayISO()
        : globalThis.UI.SCHEDULE_START;
    var stats = this.computeDayStats(today);
    stats.days = globalThis.BedSlots.horizon();
    return stats;
  },

  renderScheduleViewToggle(activeView, anchorDate) {
    anchorDate =
      anchorDate ||
      (typeof globalThis.UI.todayISO === "function"
        ? globalThis.UI.todayISO()
        : globalThis.UI.SCHEDULE_START);
    var dayHref = "beds-day.html?date=" + encodeURIComponent(anchorDate);
    var rangeHref = "beds-range.html";
    var isDay = activeView === "day";

    return (
      '<div class="schedule-view-toggle" role="tablist" aria-label="Beds view">' +
      '<a href="' +
      dayHref +
      '" class="schedule-view-toggle-btn' +
      (isDay ? " schedule-view-toggle-btn--active" : "") +
      '" role="tab" aria-selected="' +
      isDay +
      '" title="Day view">Day</a>' +
      '<a href="' +
      rangeHref +
      '" class="schedule-view-toggle-btn' +
      (!isDay ? " schedule-view-toggle-btn--active" : "") +
      '" role="tab" aria-selected="' +
      !isDay +
      '" title="15-day view">15d</a>' +
      "</div>"
    );
  },

  renderBulkAssignButton(anchorDate) {
    return (
      '<button type="button" class="table-action-btn table-action-btn--primary" id="bulk-assign-btn" disabled' +
      ' title="Allocate selected patients">Allocation</button>'
    );
  },

  renderScheduleOpsActions(anchorDate) {
    return (
      '<div class="schedule-ops-actions">' +
      this.renderBulkPreviewBar() +
      this.renderTimelineSeverityFilter(anchorDate) +
      "</div>"
    );
  },

  renderPageToolbar(anchorDate) {
    this._pageMode = "day";
    var html =
      '<div class="schedule-page-toolbar">' +
      this.renderScheduleOpsActions(anchorDate) +
      this.renderScheduleViewToggle("day", anchorDate) +
      this.renderBulkAssignButton(anchorDate) +
      "</div>";
    this._pageMode = null;
    return html;
  },

  renderRangePageToolbar() {
    var anchorDate =
      typeof globalThis.UI.todayISO === "function"
        ? globalThis.UI.todayISO()
        : globalThis.UI.SCHEDULE_START;
    this._pageMode = "range";
    var html =
      '<div class="schedule-page-toolbar">' +
      this.renderScheduleOpsActions(anchorDate) +
      this.renderScheduleViewToggle("range", anchorDate) +
      this.renderBulkAssignButton(anchorDate) +
      "</div>";
    this._pageMode = null;
    return html;
  },

  refreshPageToolbar(anchorDate) {
    var statsEl = document.getElementById("schedule-navbar-stats");
    if (statsEl) {
      statsEl.innerHTML = this.renderNavbarStatsContent(this.computeDayStats(anchorDate));
    }
    this.refreshBulkAssignButton(anchorDate);
  },

  renderDayView(anchorDate, options) {
    options = options || {};
    var loading = Boolean(options.queueSkeleton || options.boardSkeleton);
    this._pageMode = "day";
    var html =
      '<div class="schedule-page schedule-beds-page' +
      (loading ? " schedule-page--loading" : "") +
      '" data-beds-date="' +
      anchorDate +
      '" data-beds-mode="day">' +
      '<div class="schedule-day-workspace">' +
      '<div class="card schedule-patients-card">' +
      (loading ? this.renderQueueSkeletonPanel() : this.renderQueuePanel(anchorDate)) +
      "</div>" +
      '<div class="card schedule-timeline-card">' +
      '<div id="timeline-container">' +
      (loading ? this.renderHourlyTimelineSkeleton() : this.renderHourlyTimeline(anchorDate)) +
      "</div></div></div></div>";
    this._pageMode = null;
    return html;
  },

  allotmentsOccupyingDate(date, severity) {
    var allotments = globalThis.Store.getConfirmedAllotments().filter(function (allotment) {
      if (allotment.status === "Cancelled") {
        return false;
      }
      return allotment.admitDate <= date && allotment.dischargeDate > date;
    });
    return this.filterAllotmentsBySeverity(allotments, severity);
  },

  renderRangeTypeStats(counts) {
    var self = this;
    return ["ICU", "Private", "General"]
      .filter(function (type) {
        return counts[type] > 0;
      })
      .map(function (type) {
        return (
          '<span class="timeline-range-mod-chip timeline-range-mod-chip--' +
          self.wardTypeChipClass(type) +
          '" title="' +
          type +
          ": " +
          counts[type] +
          '">' +
          '<span class="timeline-range-mod-name">' +
          type +
          "</span>" +
          '<span class="timeline-range-mod-sep">:</span>' +
          '<span class="timeline-range-mod-value">' +
          counts[type] +
          "</span></span>"
        );
      })
      .join("");
  },

  renderRangeDayTrack(date, severity) {
    var allotments = this.allotmentsOccupyingDate(date, severity);
    var counts = this.countAllotmentsByWardType(allotments);
    var chips = this.renderRangeTypeStats(counts);
    var total = allotments.length;
    var href = "beds-day.html?date=" + encodeURIComponent(date);

    return (
      '<a href="' +
      href +
      '" class="timeline-range-hour-cell timeline-range-day-cell' +
      (total ? " timeline-range-hour-cell--busy" : "") +
      '" title="' +
      total +
      " occupied · " +
      globalThis.BedSlots.dayLabel(date) +
      '">' +
      (chips || '<span class="timeline-range-empty">—</span>') +
      "</a>"
    );
  },

  renderRangeDayRow(date, severity) {
    var allotments = this.allotmentsOccupyingDate(date, severity);
    var counts = this.countAllotmentsByWardType(allotments);
    var occupiedBeds = {};
    allotments.forEach(function (allotment) {
      occupiedBeds[allotment.bedId] = true;
    });
    var occupied = Object.keys(occupiedBeds).length;
    var totalBeds = this.getActiveBeds().filter(function (bed) {
      return bed.status === "Active";
    }).length;

    return (
      '<div class="timeline-row timeline-row--range-day">' +
      '<div class="timeline-setup timeline-day-label-col">' +
      '<div class="timeline-setup-head">' +
      '<a class="timeline-day-label-link" href="beds-day.html?date=' +
      encodeURIComponent(date) +
      '">' +
      globalThis.BedSlots.dayLabel(date) +
      "</a>" +
      '<span class="timeline-setup-count">' +
      occupied +
      " / " +
      totalBeds +
      " beds</span>" +
      "</div>" +
      '<div class="timeline-day-detail-stats">' +
      '<div class="timeline-day-detail-metrics">' +
      this.renderRangeTypeStats(counts) +
      "</div></div></div>" +
      '<div class="timeline-track timeline-range-day-track timeline-range-day-track--beds">' +
      this.renderRangeDayTrack(date, severity) +
      "</div></div>"
    );
  },

  renderRangeTimeline(severity) {
    var self = this;
    severity = severity || "";
    var dates = globalThis.UI.scheduleRangeDates();
    var rows = dates
      .map(function (date) {
        return self.renderRangeDayRow(date, severity);
      })
      .join("");

    return (
      '<div class="timeline-wrap timeline-wrap--range timeline-wrap--beds-range">' +
      '<div class="timeline-table-head">' +
      '<div class="timeline-hours">' +
      '<span class="timeline-corner">Days</span>' +
      '<div class="timeline-hours-track">' +
      '<span class="timeline-hour timeline-hour--start" style="left:0%;">Occupancy</span>' +
      "</div></div></div>" +
      rows +
      "</div>"
    );
  },

  renderRangeView(options) {
    options = options || {};
    var loading = Boolean(options.queueSkeleton || options.boardSkeleton);
    var anchorDate =
      typeof globalThis.UI.todayISO === "function"
        ? globalThis.UI.todayISO()
        : globalThis.UI.SCHEDULE_START;
    this._pageMode = "range";
    var html =
      '<div class="schedule-page schedule-beds-page schedule-beds-range-page' +
      (loading ? " schedule-page--loading" : "") +
      '" data-beds-date="' +
      anchorDate +
      '" data-beds-mode="range">' +
      '<div class="schedule-day-workspace">' +
      '<div class="card schedule-patients-card">' +
      (loading ? this.renderQueueSkeletonPanel() : this.renderQueuePanel(anchorDate)) +
      "</div>" +
      '<div class="card schedule-timeline-card">' +
      '<div id="timeline-container">' +
      (loading
        ? this.renderMultiDayTimelineSkeleton()
        : this.renderMultiDayTimeline(anchorDate)) +
      "</div></div></div></div>";
    this._pageMode = null;
    return html;
  },

  initQueueSuggestions(anchorDate) {
    var self = this;
    var page = document.querySelector('.schedule-page[data-beds-date="' + anchorDate + '"]');

    if (!page || page.getAttribute("data-queue-init") === "1") {
      return;
    }

    page.setAttribute("data-queue-init", "1");

    page.addEventListener("click", function (event) {
      var slotBadge = event.target.closest(".timeline-queue-slot");
      if (!slotBadge || !page.contains(slotBadge)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      var item = slotBadge.closest(".timeline-queue-item");
      var requestId = item && item.getAttribute("data-bed-request-id");
      if (!requestId) {
        return;
      }

      self.spotlightSuggestionForRequest(requestId);
    });

    page.addEventListener("change", function (event) {
      var target = event.target;
      if (!target || !target.classList || !target.classList.contains("timeline-queue-check")) {
        return;
      }

      if (target.id === "queue-select-all") {
        var checked = target.checked;
        page
          .querySelectorAll(".timeline-queue-panel .timeline-queue-item:not([hidden]) .timeline-queue-check")
          .forEach(function (input) {
            input.checked = checked;
          });
      }

      self.refreshBulkAssignButton(anchorDate);
    });

    self.refreshBulkAssignButton(anchorDate);
  },

  initSuggestionActions(anchorDate) {
    var self = this;
    var page = document.querySelector('.schedule-page[data-beds-date="' + anchorDate + '"]');

    if (!page || page.getAttribute("data-suggestion-init") === "1") {
      return;
    }

    page.setAttribute("data-suggestion-init", "1");

    page.addEventListener("click", function (event) {
      var acceptBtn = event.target.closest(".timeline-suggestion-btn--accept");
      var rejectBtn = event.target.closest(".timeline-suggestion-btn--reject");
      if (!acceptBtn && !rejectBtn) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      var suggestion = event.target.closest(".timeline-suggestion");
      if (!suggestion || !page.contains(suggestion)) {
        return;
      }

      var requestId = suggestion.getAttribute("data-bed-request-id");
      if (!requestId) {
        return;
      }

      if (acceptBtn) {
        self.acceptSuggestion(requestId, anchorDate, suggestion);
      } else {
        self.rejectSuggestion(requestId, anchorDate);
      }
    });
  },

  initQueueSearch(anchorDate) {
    var self = this;
    var page = document.querySelector('.schedule-page[data-beds-date="' + anchorDate + '"]');
    var input = document.getElementById("queue-search");
    if (!page || !input || page.getAttribute("data-search-init") === "1") {
      return;
    }

    page.setAttribute("data-search-init", "1");

    function applyFilter() {
      var query = (input.value || "").trim().toLowerCase();
      self.setQueueSearchQuery(anchorDate, query);
      self.applyQueueVisibilityFilters(page);
    }

    input.addEventListener("input", applyFilter);
    applyFilter();
  },

  initTimelineFilters(filterScope) {
    var self = this;
    var select = document.getElementById("timeline-severity");
    if (!select) {
      return;
    }

    self.refreshTimelineSeverityFilter(filterScope);

    if (select.getAttribute("data-filter-init") === "1") {
      return;
    }

    select.setAttribute("data-filter-init", "1");
    select.addEventListener("change", function () {
      var scope = select.getAttribute("data-filter-scope") || filterScope;
      self.setTimelineSeverityFilter(scope, select.value || "");

      var container = document.getElementById("timeline-container");
      if (container) {
        container.innerHTML = self.renderTimeline(scope);
      }
      self.refreshTimelineSeverityFilter(scope);
    });
  },

  initBulkAssign(anchorDate) {
    var self = this;
    var page = document.querySelector('.schedule-page[data-beds-date="' + anchorDate + '"]');
    if (!page || page.getAttribute("data-bulk-init") === "1") {
      return;
    }

    page.setAttribute("data-bulk-init", "1");

    document.addEventListener("click", function onBulkClick(event) {
      if (!document.querySelector('.schedule-page[data-beds-date="' + anchorDate + '"]')) {
        document.removeEventListener("click", onBulkClick);
        return;
      }

      if (event.target.closest("#bulk-assign-btn")) {
        event.preventDefault();
        var selectedIds = self.getSelectedQueueRequestIds(page);
        if (!selectedIds.length) {
          if (globalThis.UI && globalThis.UI.showToast) {
            UI.showToast("Select one or more patients in the queue first.");
          }
          return;
        }
        var plan = self.planBulkAssignments(anchorDate, selectedIds);
        self.clearSlotSuggestions();
        self._bulkPreviewPlacements = plan.placements;
        self.renderBulkPreviewOverlays(anchorDate);
        if (plan.placements.length) {
          self.showBulkPreviewToolbar(anchorDate, plan.placements.length, plan.skipped);
        }
        if (!plan.placements.length && globalThis.UI && globalThis.UI.showToast) {
          UI.showToast("No beds available for allocation.");
        }
        self.refreshBulkAssignButton(anchorDate);
        return;
      }

      if (event.target.closest("#bulk-preview-confirm")) {
        event.preventDefault();
        self.applyBulkPreviewFromToolbar(anchorDate);
        return;
      }

      if (event.target.closest("#bulk-preview-cancel") || event.target.closest("#bulk-preview-clear")) {
        event.preventDefault();
        self.clearSlotSuggestions();
      }
    });
  },

  initDayPage(anchorDate) {
    this.initQueueSuggestions(anchorDate);
    this.initQueueSearch(anchorDate);
    this.initTimelineFilters(anchorDate);
    this.initSuggestionActions(anchorDate);
    this.initBulkAssign(anchorDate);
  },

  initRangePage() {
    this.initDayPage(
      typeof globalThis.UI.todayISO === "function"
        ? globalThis.UI.todayISO()
        : globalThis.UI.SCHEDULE_START,
    );
  },
};

globalThis.BedTimeline = BedTimeline;
export { BedTimeline };
