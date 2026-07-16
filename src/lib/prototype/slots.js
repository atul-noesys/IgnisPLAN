globalThis.SchedulerSlots = {
  DAY_START: 8 * 60,
  DAY_END: 18 * 60,
  STEP: 15,
  PHASE_MINUTES: [15, 30, 60],
  AFTERNOON_START: 12 * 60,
  BREAK_START: 13 * 60,
  BREAK_END: 14 * 60,

  breakSpan() {
    return { start: this.BREAK_START, end: this.BREAK_END };
  },

  breakLabel() {
    return this.fromMinutes(this.BREAK_START) + "–" + this.fromMinutes(this.BREAK_END);
  },

  overlapsBreak(span) {
    return this.overlaps(span, this.breakSpan());
  },

  isAfternoonStart(startMinutes) {
    return startMinutes >= this.AFTERNOON_START;
  },

  isMorningStart(startMinutes) {
    return startMinutes < this.AFTERNOON_START;
  },

  windowLabelForStart(startMinutes) {
    return this.isAfternoonStart(startMinutes) ? "Afternoon" : "Morning";
  },

  matchesPreferredWindow(startMinutes, preferredWindow) {
    if (!preferredWindow || preferredWindow.indexOf("Custom") === 0) {
      return true;
    }
    if (preferredWindow === "Morning") {
      return this.isMorningStart(startMinutes);
    }
    if (preferredWindow === "Afternoon") {
      return this.isAfternoonStart(startMinutes);
    }
    return true;
  },

  isAllowedPhase(minutes) {
    return this.PHASE_MINUTES.indexOf(minutes) !== -1;
  },

  blockMinutes(service) {
    return service.lead + service.procedure + service.lag;
  },

  toMinutes(time) {
    var parts = time.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  },

  fromMinutes(mins) {
    var hours = Math.floor(mins / 60);
    var minutes = mins % 60;
    return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
  },

  bookingSpan(booking, service) {
    var start = this.toMinutes(booking.startTime);
    return { start: start, end: start + this.blockMinutes(service) };
  },

  overlaps(spanA, spanB) {
    return spanA.start < spanB.end && spanB.start < spanA.end;
  },

  isSlotFree(setupId, date, startMin, service, bookings, excludeRequestId) {
    var candidate = { start: startMin, end: startMin + this.blockMinutes(service) };
    if (startMin < this.DAY_START || candidate.end > this.DAY_END) {
      return false;
    }
    if (this.overlapsBreak(candidate)) {
      return false;
    }
    if (
      typeof globalThis.ScheduleTimeline !== "undefined" &&
      !globalThis.ScheduleTimeline.isSlotOperationallyOpen(setupId, date, candidate.start, candidate.end)
    ) {
      return false;
    }
    for (var i = 0; i < bookings.length; i++) {
      var booking = bookings[i];
      if (booking.setupId !== setupId || booking.date !== date || booking.status === "Cancelled") {
        continue;
      }
      if (excludeRequestId && booking.requestId === excludeRequestId) {
        continue;
      }
      var bookingService = globalThis.Store.getService(booking.serviceId);
      if (!bookingService) {
        continue;
      }
      if (this.overlaps(candidate, this.bookingSpan(booking, bookingService))) {
        return false;
      }
    }
    return true;
  },

  getBookingCovering(setupId, date, startMin, bookings, excludeRequestId) {
    for (var i = 0; i < bookings.length; i++) {
      var booking = bookings[i];
      if (booking.setupId !== setupId || booking.date !== date || booking.status === "Cancelled") {
        continue;
      }
      if (excludeRequestId && booking.requestId === excludeRequestId) {
        continue;
      }
      var bookingService = globalThis.Store.getService(booking.serviceId);
      if (!bookingService) {
        continue;
      }
      var span = this.bookingSpan(booking, bookingService);
      if (startMin >= span.start && startMin < span.end) {
        return {
          booking: booking,
          service: bookingService,
          span: span,
        };
      }
    }
    return null;
  },

  isBookingStart(booking, startMin) {
    return this.toMinutes(booking.startTime) === startMin;
  },

  compatibleSetups(setups, service) {
    return setups.filter(function (setup) {
      return setup.status === "Active" && setup.serviceId === service.id;
    });
  },

  availableSlots(setups, date, service, bookings, excludeRequestId) {
    var slots = [];
    var self = this;
    this.compatibleSetups(setups, service).forEach(function (setup) {
      for (var t = self.DAY_START; t <= self.DAY_END - self.blockMinutes(service); t += self.STEP) {
        if (self.isSlotFree(setup.id, date, t, service, bookings, excludeRequestId)) {
          slots.push({
            setupId: setup.id,
            setupName: setup.name,
            location: setup.location,
            startTime: self.fromMinutes(t),
            startMinutes: t,
          });
        }
      }
    });
    return slots;
  },

  countAvailableSlots(setups, date, service, bookings, excludeRequestId) {
    return this.availableSlots(setups, date, service, bookings, excludeRequestId).length;
  },

  countDayOpenSlots(date, bookings) {
    bookings = bookings || globalThis.Store.getBookingsForDate(date);
    var setups = globalThis.Store.getSetups();
    var total = 0;
    var self = this;
    setups.forEach(function (setup) {
      if (setup.status !== "Active") {
        return;
      }
      var service = globalThis.Store.getService(setup.serviceId);
      if (!service) {
        return;
      }
      total += self.countAvailableSlots([setup], date, service, bookings, null);
    });
    return total;
  },

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

  weekDates(anchorDate) {
    var date = this.parseDate(anchorDate);
    var mondayOffset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - mondayOffset);
    var dates = [];
    for (var i = 0; i < 7; i++) {
      dates.push(this.formatDate(date));
      date.setDate(date.getDate() + 1);
    }
    return dates;
  },

  dayLabel(dateStr) {
    var date = this.parseDate(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  },

  matrixTimes(service) {
    var times = [];
    var block = this.blockMinutes(service);
    for (var t = this.DAY_START; t <= this.DAY_END - block; t += this.STEP) {
      times.push({ label: this.fromMinutes(t), minutes: t });
    }
    return times;
  },

  renderSegmentBar(service, showLabels) {
    var total = service.lead + service.procedure + service.lag;
    var bar =
      '<div class="slot-bar" aria-hidden="true">' +
      '<span class="slot-segment slot-lead" style="width:' + (service.lead / total) * 100 + '%"></span>' +
      '<span class="slot-segment slot-procedure" style="width:' + (service.procedure / total) * 100 + '%"></span>' +
      '<span class="slot-segment slot-lag" style="width:' + (service.lag / total) * 100 + '%"></span>' +
      "</div>";
    if (!showLabels) {
      return bar;
    }
    return (
      bar +
      '<div class="slot-bar-labels">' +
      "<span>" + service.lead + "m lead</span>" +
      "<span>" + service.procedure + "m procedure</span>" +
      "<span>" + service.lag + "m lag</span>" +
      "</div>"
    );
  },

  percentPosition(startMinutes, durationMinutes) {
    var range = this.DAY_END - this.DAY_START;
    var left = ((startMinutes - this.DAY_START) / range) * 100;
    var width = (durationMinutes / range) * 100;
    return { left: left, width: width };
  },

  renderBreakBand(options) {
    options = options || {};
    var pos = this.percentPosition(this.BREAK_START, this.BREAK_END - this.BREAK_START);
    var label = options.label || "Break";
    var compactClass = options.compact ? " timeline-break-band--header" : "";

    return (
      '<div class="timeline-break-band' +
      compactClass +
      '" style="left:' +
      pos.left +
      "%;width:" +
      pos.width +
      '%;" aria-hidden="true" title="' +
      this.breakLabel() +
      ' — no operations">' +
      '<span class="timeline-break-label">' +
      label +
      "</span></div>"
    );
  },

  hourLabels() {
    var labels = [];
    for (var h = 8; h <= 18; h++) {
      labels.push(String(h).padStart(2, "0") + ":00");
    }
    return labels;
  },
};

export const SchedulerSlots = globalThis.SchedulerSlots;
