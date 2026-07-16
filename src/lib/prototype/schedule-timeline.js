const ScheduleTimeline = {
  RANGE_FILTER_SCOPE: "__range__",
  _bulkPreviewPlacements: null,

  getBoardSetups() {
    return globalThis.Store.getSetups().filter(function (setup) {
      return (
        setup.status === "Active" ||
        setup.status === "Under Maintenance" ||
        setup.status === "Inactive"
      );
    });
  },

  getActiveSetups() {
    return globalThis.Store.getSetups().filter(function (setup) {
      return setup.status === "Active" || setup.status === "Under Maintenance";
    });
  },

  dayBookings(scheduleDate) {
    return globalThis.Store.getBookingsForDate(scheduleDate);
  },

  _queueSearchQuery: {},
  _timelineSeverityFilter: {},
  _timelineServiceFilter: {},

  isAwaitingQueueStatus(status) {
    return status === "Pending" || status === "Re-Scheduled";
  },

  queueRequestsForDay(scheduleDate) {
    var patientMap = globalThis.Store.getPatientMap();
    var scheduledPatientIds = {};
    var scheduledRequestIds = {};

    this.dayBookings(scheduleDate).forEach(function (booking) {
      if (booking.status === "Cancelled") {
        return;
      }
      if (booking.patientId) {
        scheduledPatientIds[booking.patientId] = true;
      }
      if (booking.requestId) {
        scheduledRequestIds[booking.requestId] = true;
      }
    });

    return globalThis.Store.getActiveRequests()
      .filter(function (request) {
        return (
          ScheduleTimeline.isAwaitingQueueStatus(request.status) &&
          request.requestedDate === scheduleDate &&
          !scheduledPatientIds[request.patientId] &&
          !scheduledRequestIds[request.id]
        );
      })
      .sort(function (a, b) {
        var scoreDiff =
          ScheduleTimeline.queuePriorityScoreForPatient(patientMap[b.patientId]) -
          ScheduleTimeline.queuePriorityScoreForPatient(patientMap[a.patientId]);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }
        return a.id.localeCompare(b.id);
      });
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

  queuePriorityScore(request) {
    return this.queuePriorityScoreForPatient(globalThis.Store.getPatient(request.patientId));
  },

  scoreSuggestedSlot(slot, preferredWindow) {
    var score = 0;
    if (preferredWindow === "Morning") {
      if (globalThis.SchedulerSlots.isMorningStart(slot.startMinutes)) {
        score += 200;
        score += globalThis.SchedulerSlots.AFTERNOON_START - slot.startMinutes;
      }
    } else if (preferredWindow === "Afternoon") {
      if (globalThis.SchedulerSlots.isAfternoonStart(slot.startMinutes)) {
        score += 200;
        score += globalThis.SchedulerSlots.DAY_END - slot.startMinutes;
      }
    } else {
      score += 100;
      score -= slot.startMinutes;
    }
    return score;
  },

  suggestSlotForRequest(request, scheduleDate) {
    return this.pickSlotForRequest(request, scheduleDate, this.dayBookings(scheduleDate));
  },

  pickSlotForRequest(request, scheduleDate, bookings) {
    var service = globalThis.Store.getService(request.serviceId);
    if (!service) {
      return null;
    }
    var slots = globalThis.SchedulerSlots.availableSlots(
      this.getActiveSetups(),
      scheduleDate,
      service,
      bookings,
      request.id
    );
    if (!slots.length) {
      return null;
    }

    var preferred = request.preferredWindow;
    var matching = slots.filter(function (slot) {
      return globalThis.SchedulerSlots.matchesPreferredWindow(slot.startMinutes, preferred);
    });
    var pool = matching.length ? matching : slots;

    return pool
      .map(function (slot) {
        return {
          slot: slot,
          score: ScheduleTimeline.scoreSuggestedSlot(slot, preferred),
        };
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })[0].slot;
  },

  planBulkAssignments(scheduleDate, requestIds) {
    var self = this;
    var requests = this.queueRequestsForDay(scheduleDate);
    if (requestIds && requestIds.length) {
      var selected = {};
      requestIds.forEach(function (id) {
        selected[id] = true;
      });
      requests = requests.filter(function (request) {
        return selected[request.id];
      });
    }
    var bookings = this.dayBookings(scheduleDate).slice();
    var placements = [];
    var skipped = 0;

    requests.forEach(function (request) {
      var slot = self.pickSlotForRequest(request, scheduleDate, bookings);
      if (!slot) {
        skipped += 1;
        return;
      }

      placements.push({
        request: request,
        patient: globalThis.Store.getPatient(request.patientId),
        service: globalThis.Store.getService(request.serviceId),
        slot: slot,
      });
      bookings.push({
        id: "preview-" + request.id,
        requestId: request.id,
        patientId: request.patientId,
        serviceId: request.serviceId,
        setupId: slot.setupId,
        date: scheduleDate,
        startTime: slot.startTime,
        status: "Scheduled",
      });
    });

    return {
      placements: placements,
      skipped: skipped,
      total: requests.length,
    };
  },

  applyBulkPreview(scheduleDate) {
    var placements = this._bulkPreviewPlacements || [];
    placements.forEach(function (placement) {
      Store.assignRequest(
        placement.request.id,
        placement.slot.setupId,
        scheduleDate,
        placement.slot.startTime
      );
    });

    return {
      assigned: placements.length,
      skipped: 0,
      total: placements.length,
    };
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

  buildQueueSearchHaystack(request, patient, service) {
    return [
      request.id,
      patient && patient.name,
      patient && patient.mrn,
      patient && patient.patientType,
      patient && patient.severity,
      patient && patient.disease,
      service && service.name,
      service && service.type,
      request.preferredWindow,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  },

  getQueueSearchQuery(scheduleDate) {
    return this._queueSearchQuery[scheduleDate] || "";
  },

  setQueueSearchQuery(scheduleDate, query) {
    this._queueSearchQuery[scheduleDate] = query;
  },

  getTimelineSeverityFilter(filterScope) {
    return this._timelineSeverityFilter[filterScope] || "";
  },

  setTimelineSeverityFilter(filterScope, severity) {
    this._timelineSeverityFilter[filterScope] = severity;
  },

  getTimelineServiceFilter(filterScope) {
    return this._timelineServiceFilter[filterScope] || "";
  },

  setTimelineServiceFilter(filterScope, serviceType) {
    this._timelineServiceFilter[filterScope] = serviceType || "";
  },

  getServiceTypeOptions() {
    var seen = {};
    var types = [];
    globalThis.Store.getServices().forEach(function (service) {
      var type = service && service.type ? String(service.type) : "";
      if (!type || seen[type]) {
        return;
      }
      seen[type] = true;
      types.push(type);
    });
    types.sort(function (a, b) {
      return a.localeCompare(b);
    });
    return types;
  },

  bookingMatchesSeverity(booking, severity) {
    if (!severity) {
      return true;
    }
    var patient = globalThis.Store.getPatient(booking.patientId);
    return Boolean(patient && patient.severity === severity);
  },

  bookingMatchesServiceType(booking, serviceType) {
    if (!serviceType) {
      return true;
    }
    var service = globalThis.Store.getService(booking.serviceId);
    return Boolean(service && service.type === serviceType);
  },

  filterBookingsBySeverity(bookings, severity) {
    var self = this;
    if (!severity) {
      return bookings;
    }
    return bookings.filter(function (booking) {
      return self.bookingMatchesSeverity(booking, severity);
    });
  },

  filterBookingsByServiceType(bookings, serviceType) {
    var self = this;
    if (!serviceType) {
      return bookings;
    }
    return bookings.filter(function (booking) {
      return self.bookingMatchesServiceType(booking, serviceType);
    });
  },

  filterBookingsByTimelineFilters(bookings, filterScope) {
    var severity = this.getTimelineSeverityFilter(filterScope);
    var serviceType = this.getTimelineServiceFilter(filterScope);
    return this.filterBookingsByServiceType(
      this.filterBookingsBySeverity(bookings, severity),
      serviceType
    );
  },

  renderQueueSearchBox(scheduleDate) {
    var query = this.getQueueSearchQuery(scheduleDate);
    return (
      '<div class="timeline-queue-search">' +
      '<label class="visually-hidden" for="queue-search">Search awaiting patients queue</label>' +
      '<div class="timeline-queue-search-box">' +
      globalThis.UI.icons.search() +
      '<input type="search" id="queue-search" placeholder="Search name, MRN, service" autocomplete="off" value="' +
      query.replace(/&/g, "&amp;").replace(/"/g, "&quot;") +
      '" />' +
      "</div></div>"
    );
  },

  renderBulkPreviewBar() {
    return (
      '<div class="schedule-ops-preview" id="schedule-ops-preview" hidden>' +
      '<span class="bulk-preview-inline"><strong>Preview only</strong> · ' +
      '<span id="bulk-preview-count">0</span> slots<span id="bulk-preview-skipped" hidden></span></span>' +
      '<button type="button" class="table-action-btn table-action-btn--neutral" id="bulk-preview-cancel">Clear</button>' +
      '<button type="button" class="table-action-btn table-action-btn--primary" id="bulk-preview-confirm">Confirm assignments</button>' +
      "</div>"
    );
  },

  renderTimelineSeverityFilter(filterScope) {
    var severity = this.getTimelineSeverityFilter(filterScope);
    var serviceType = this.getTimelineServiceFilter(filterScope);
    var serviceOptions = this.getServiceTypeOptions()
      .map(function (type) {
        return (
          '<option value="' +
          type.replace(/"/g, "&quot;") +
          '"' +
          (serviceType === type ? " selected" : "") +
          ">" +
          type +
          "</option>"
        );
      })
      .join("");

    return (
      '<div class="schedule-ops-filters">' +
      '<label class="schedule-ops-filter-label" for="timeline-severity">Severity</label>' +
      '<select id="timeline-severity" class="schedule-ops-filter-select schedule-ops-severity-select">' +
      '<option value=""' +
      (severity === "" ? " selected" : "") +
      '>All severities</option>' +
      '<option value="High"' +
      (severity === "High" ? " selected" : "") +
      '>High</option>' +
      '<option value="Moderate"' +
      (severity === "Moderate" ? " selected" : "") +
      '>Moderate</option>' +
      '<option value="Low"' +
      (severity === "Low" ? " selected" : "") +
      '>Low</option>' +
      "</select>" +
      '<label class="schedule-ops-filter-label" for="timeline-service">Service</label>' +
      '<select id="timeline-service" class="schedule-ops-filter-select schedule-ops-service-select">' +
      '<option value=""' +
      (serviceType === "" ? " selected" : "") +
      '>All services</option>' +
      serviceOptions +
      "</select>" +
      "</div>"
    );
  },

  applyQueueSearch(panel, query) {
    if (!panel) {
      return;
    }
    var page = panel.closest(".schedule-page");
    if (page) {
      this.applyQueueVisibilityFilters(page);
      return;
    }

    var items = panel.querySelectorAll(".timeline-queue-item");
    var normalized = (query || "").trim().toLowerCase();
    var visible = 0;
    items.forEach(function (item) {
      var haystack = item.getAttribute("data-search") || "";
      var match = !normalized || haystack.indexOf(normalized) >= 0;
      item.hidden = !match;
      if (match) {
        visible += 1;
      }
    });
    var countEl = panel.querySelector(".timeline-patients-count");
    if (countEl) {
      countEl.textContent = normalized ? visible + " / " + items.length : String(items.length);
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

    var filterScope =
      page.getAttribute("data-schedule-date") || page.getAttribute("data-beds-date") || "";
    var severitySelect = document.getElementById("timeline-severity");
    var severity = severitySelect
      ? severitySelect.value || ""
      : this.getTimelineSeverityFilter(filterScope) || "";
    var serviceSelect = document.getElementById("timeline-service");
    var serviceType = serviceSelect
      ? serviceSelect.value || ""
      : this.getTimelineServiceFilter(filterScope) || "";

    var input = panel.querySelector("#queue-search");
    var query = input ? (input.value || "").trim().toLowerCase() : "";
    if (!query && filterScope && this.getQueueSearchQuery) {
      query = (this.getQueueSearchQuery(filterScope) || "").trim().toLowerCase();
    }

    var items = panel.querySelectorAll(".timeline-queue-item");
    var visible = 0;
    items.forEach(function (item) {
      var itemSeverity = item.getAttribute("data-severity") || "";
      var itemService = item.getAttribute("data-service-type") || "";
      var haystack = item.getAttribute("data-search") || "";
      var matchSeverity = !severity || itemSeverity === severity;
      var matchService = !serviceType || itemService === serviceType;
      var matchSearch = !query || haystack.indexOf(query) >= 0;
      var match = matchSeverity && matchService && matchSearch;
      item.hidden = !match;
      if (match) {
        visible += 1;
      }
    });

    var filtered = Boolean(severity || serviceType || query);
    var countEl = panel.querySelector(".timeline-patients-count");
    if (countEl) {
      countEl.textContent = filtered ? visible + " / " + items.length : String(items.length);
    }

    var emptyEl = panel.querySelector(".timeline-queue-search-empty");
    if (emptyEl) {
      if (filtered && visible === 0) {
        emptyEl.hidden = false;
        if (severity && !serviceType && !query) {
          emptyEl.textContent = "No " + severity.toLowerCase() + " severity patients in the queue.";
        } else if (serviceType && !severity && !query) {
          emptyEl.textContent = "No " + serviceType + " patients in the queue.";
        } else {
          emptyEl.textContent = "No matching patients in the queue.";
        }
      } else {
        emptyEl.hidden = true;
      }
    }

    if (filterScope) {
      this.refreshBulkAssignButton(filterScope);
    }
  },

  applyTimelineSeverityFilter(container, severity, serviceType) {
    if (!container) {
      return;
    }

    if (serviceType === undefined) {
      var serviceSelect = document.getElementById("timeline-service");
      serviceType = serviceSelect ? serviceSelect.value || "" : "";
    }

    var blocks = container.querySelectorAll(".timeline-block[data-severity], .timeline-suggestion[data-severity]");

    blocks.forEach(function (block) {
      var blockSeverity = block.getAttribute("data-severity") || "";
      var blockService = block.getAttribute("data-service-type") || "";
      var matchSeverity = !severity || blockSeverity === severity;
      var matchService = !serviceType || blockService === serviceType;
      block.hidden = !(matchSeverity && matchService);
    });

    var page = container.closest(".schedule-page");
    if (page) {
      this.applyQueueVisibilityFilters(page);
    }
  },

  refreshTimelineSeverityFilter(filterScope) {
    var severitySelect = document.getElementById("timeline-severity");
    var serviceSelect = document.getElementById("timeline-service");
    if (!severitySelect && !serviceSelect) {
      return;
    }

    var severity = severitySelect ? severitySelect.value : this.getTimelineSeverityFilter(filterScope);
    var serviceType = serviceSelect
      ? serviceSelect.value
      : this.getTimelineServiceFilter(filterScope);

    if (severitySelect) {
      severitySelect.value = severity || "";
    }
    if (serviceSelect) {
      serviceSelect.value = serviceType || "";
    }

    if (filterScope === this.RANGE_FILTER_SCOPE) {
      var rangeContainer = document.querySelector(".schedule-range-page #timeline-container");
      if (rangeContainer) {
        rangeContainer.innerHTML = this.renderRangeTimeline(severity, serviceType);
      }
      var rangePage = document.querySelector(".schedule-range-page");
      if (rangePage) {
        this.applyQueueVisibilityFilters(rangePage);
      }
      return;
    }

    var page = document.querySelector('.schedule-page[data-schedule-date="' + filterScope + '"]');
    if (!page) {
      return;
    }

    var container = page.querySelector("#timeline-container");
    if (container) {
      this.applyTimelineSeverityFilter(container, severity, serviceType);
    } else {
      this.applyQueueVisibilityFilters(page);
    }
  },

  initTimelineFilters(filterScope) {
    var self = this;

    self.refreshTimelineSeverityFilter(filterScope);

    if (document.body.getAttribute("data-timeline-filter-init") === "1") {
      return;
    }

    document.body.setAttribute("data-timeline-filter-init", "1");

    document.addEventListener("change", function (event) {
      var targetId = event.target && event.target.id;
      if (targetId !== "timeline-severity" && targetId !== "timeline-service") {
        return;
      }

      var rangePage = document.querySelector(".schedule-range-page");
      if (rangePage) {
        if (targetId === "timeline-severity") {
          self.setTimelineSeverityFilter(self.RANGE_FILTER_SCOPE, event.target.value);
        } else {
          self.setTimelineServiceFilter(self.RANGE_FILTER_SCOPE, event.target.value);
        }
        self.refreshTimelineSeverityFilter(self.RANGE_FILTER_SCOPE);
        return;
      }

      var dayPage = document.querySelector(".schedule-page[data-schedule-date]");
      if (!dayPage) {
        return;
      }

      var scheduleDate = dayPage.getAttribute("data-schedule-date");
      if (targetId === "timeline-severity") {
        self.setTimelineSeverityFilter(scheduleDate, event.target.value);
      } else {
        self.setTimelineServiceFilter(scheduleDate, event.target.value);
      }
      self.refreshTimelineSeverityFilter(scheduleDate);
    });
  },

  initQueueSearch(scheduleDate) {
    var self = this;
    var page = document.querySelector('.schedule-page[data-schedule-date="' + scheduleDate + '"]');
    if (!page) {
      return;
    }

    var panel = page.querySelector(".timeline-queue-panel");
    if (!panel) {
      return;
    }

    var input = panel.querySelector("#queue-search");
    if (input) {
      self.applyQueueSearch(panel, input.value);
    }

    if (page.getAttribute("data-queue-search-init") === "1") {
      return;
    }

    page.setAttribute("data-queue-search-init", "1");

    page.addEventListener("input", function (event) {
      if (event.target.id !== "queue-search" || !page.contains(event.target)) {
        return;
      }

      var activePanel = page.querySelector(".timeline-queue-panel");
      if (!activePanel) {
        return;
      }

      self.setQueueSearchQuery(scheduleDate, event.target.value);
      self.applyQueueSearch(activePanel, event.target.value);
    });
  },

  renderQueueItem(request, patientMap, serviceMap) {
    var self = this;
    var patient = patientMap[request.patientId];
    var service = serviceMap[request.serviceId];
    var name = patient ? patient.name : request.id;
    var borderClass = patient ? self.patientBorderClass(patient) : "";
    var searchHaystack = self.buildQueueSearchHaystack(request, patient, service);

    return (
      '<label class="timeline-queue-item ' +
      borderClass +
      '" data-request-id="' +
      request.id +
      '" data-search="' +
      searchHaystack.replace(/&/g, "&amp;").replace(/"/g, "&quot;") +
      '" data-severity="' +
      (patient && patient.severity ? patient.severity : "") +
      '" data-service-type="' +
      (service && service.type ? service.type : "") +
      '">' +
      '<span class="timeline-queue-lead">' +
      '<span class="timeline-patient-avatar" aria-hidden="true">' +
      self.patientInitials(patient) +
      "</span>" +
      '<input type="checkbox" class="timeline-queue-check" data-request-id="' +
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
      (patient && service ? '<span class="timeline-queue-sep">·</span>' : "") +
      (service ? '<span class="timeline-queue-service">' + service.name + "</span>" : "") +
      "</span>" +
      (patient
        ? '<span class="timeline-patient-tags">' +
          '<span class="timeline-queue-pref">' +
          request.preferredWindow +
          " preferred</span>" +
          globalThis.UI.badge(patient.patientType) +
          globalThis.UI.badge(patient.severity) +
          globalThis.UI.badge(request.status || "Pending") +
          (service ? globalThis.UI.badge(service.type) : "") +
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

  renderQueueSkeletonItem() {
    return (
      '<div class="timeline-queue-item timeline-queue-item--skeleton" aria-hidden="true">' +
      '<span class="timeline-skeleton-block timeline-skeleton-avatar"></span>' +
      '<div class="timeline-queue-skeleton-body">' +
      '<span class="timeline-skeleton-block timeline-skeleton-line timeline-skeleton-line--name"></span>' +
      '<span class="timeline-skeleton-block timeline-skeleton-line timeline-skeleton-line--meta"></span>' +
      '<div class="timeline-skeleton-tags">' +
      '<span class="timeline-skeleton-block timeline-skeleton-chip"></span>' +
      '<span class="timeline-skeleton-block timeline-skeleton-chip"></span>' +
      '<span class="timeline-skeleton-block timeline-skeleton-chip"></span>' +
      "</div></div></div>"
    );
  },

  renderQueueSkeletonPanel() {
    var items = [0, 1, 2, 3, 4]
      .map(this.renderQueueSkeletonItem, this)
      .join("");
    return (
      '<aside class="timeline-patients-panel timeline-queue-panel timeline-queue-panel--loading" aria-busy="true" aria-label="Loading awaiting patients queue">' +
      '<div class="timeline-patients-head">' +
      '<span class="timeline-patients-title">Awaiting Patients Queue</span>' +
      '<span class="timeline-skeleton-block timeline-skeleton-count" aria-hidden="true"></span>' +
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

  renderTimelineSkeleton() {
    var rows = [0, 1, 2, 3]
      .map(this.renderTimelineSkeletonRow, this)
      .join("");
    return (
      '<div class="timeline-wrap timeline-wrap--loading" aria-busy="true" aria-label="Loading schedule timeline">' +
      this.renderTimelineHourHeader("Setup / Time") +
      rows +
      "</div>"
    );
  },

  renderRangeTimelineSkeleton() {
    var self = this;
    var dates =
      typeof globalThis.UI.scheduleRangeDates === "function"
        ? globalThis.UI.scheduleRangeDates()
        : [];
    var rows = dates
      .map(function () {
        return (
          '<div class="timeline-row timeline-row--range-day timeline-row--skeleton" aria-hidden="true">' +
          '<div class="timeline-setup timeline-day-label-col">' +
          '<span class="timeline-skeleton-block timeline-skeleton-line timeline-skeleton-line--setup"></span>' +
          '<span class="timeline-skeleton-block timeline-skeleton-line timeline-skeleton-line--meta"></span>' +
          "</div>" +
          '<div class="timeline-track timeline-track--skeleton timeline-range-day-track">' +
          '<span class="timeline-skeleton-block timeline-skeleton-track" aria-hidden="true"></span>' +
          "</div></div>"
        );
      })
      .join("");
    return (
      '<div class="timeline-wrap timeline-wrap--range timeline-wrap--loading" aria-busy="true" aria-label="Loading schedule timeline">' +
      self.renderTimelineHourHeader("Days") +
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

  renderQueuePanel(scheduleDate) {
    var self = this;
    var requests = this.queueRequestsForDay(scheduleDate);

    if (!requests.length) {
      return (
        '<aside class="timeline-patients-panel timeline-queue-panel" aria-label="Awaiting patients queue for this day">' +
        '<div class="timeline-patients-head">' +
        '<span class="timeline-patients-title">Awaiting Patients Queue</span>' +
        '<span class="timeline-patients-count">0</span>' +
        "</div>" +
        '<p class="timeline-patients-empty">No pending requests for ' +
        globalThis.SchedulerSlots.dayLabel(scheduleDate) +
        ".</p>" +
        "</aside>"
      );
    }

    var patientMap = globalThis.Store.getPatientMap();
    var serviceMap = globalThis.Store.getServiceMap();
    var items = requests
      .map(function (request) {
        return self.renderQueueItem(request, patientMap, serviceMap);
      })
      .join("");

    return (
      '<aside class="timeline-patients-panel timeline-queue-panel" aria-label="Awaiting patients queue for this day">' +
      '<div class="timeline-patients-head">' +
      this.renderQueueSelectAll() +
      '<span class="timeline-patients-title">Awaiting Patients Queue</span>' +
      '<span class="timeline-patients-count">' +
      requests.length +
      "</span>" +
      "</div>" +
      this.renderQueueSearchBox(scheduleDate) +
      '<div class="timeline-patients-list timeline-queue-list">' +
      items +
      "</div>" +
      '<p class="timeline-queue-search-empty" hidden>No matching patients in the queue.</p>' +
      "</aside>"
    );
  },

  buildSuggestionElement(request, patient, service, slot, options) {
    options = options || {};
    var span = {
      start: slot.startMinutes,
      end: slot.startMinutes + globalThis.SchedulerSlots.blockMinutes(service),
    };
    var pos = globalThis.SchedulerSlots.percentPosition(span.start, span.end - span.start);
    var endTime = globalThis.SchedulerSlots.fromMinutes(span.end);
    var label = patient ? patient.name : request.id;
    var title = label + " · " + slot.startTime + "–" + endTime;
    var isCompact = pos.width < 12;

    return (
      '<div class="timeline-suggestion' +
      (isCompact ? " timeline-suggestion--compact" : "") +
      '" data-request-id="' +
      request.id +
      '" data-setup-id="' +
      slot.setupId +
      '" data-start-time="' +
      slot.startTime +
      '" data-severity="' +
      (patient && patient.severity ? patient.severity : "") +
      '" data-service-type="' +
      (service && service.type ? service.type : "") +
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

  getSelectedQueueRequestIds(page) {
    page = page || document.querySelector(".schedule-page[data-schedule-date]");
    if (!page) {
      return [];
    }
    var ids = [];
    page.querySelectorAll(".timeline-queue-panel .timeline-queue-item:not([hidden]) .timeline-queue-check:checked").forEach(
      function (input) {
        var id = input.getAttribute("data-request-id");
        if (id) {
          ids.push(id);
        }
      }
    );
    return ids;
  },

  syncQueueSelectAll(page) {
    page = page || document.querySelector(".schedule-page[data-schedule-date]");
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

  refreshBulkAssignButton(scheduleDate) {
    var btn = document.getElementById("bulk-assign-btn");
    if (!btn) {
      return;
    }

    var page = document.querySelector('.schedule-page[data-schedule-date="' + scheduleDate + '"]');
    var selectedCount = this.getSelectedQueueRequestIds(page).length;
    btn.disabled = selectedCount === 0;
    btn.textContent = "Allocate" + (selectedCount ? " (" + selectedCount + ")" : "");
    this.syncQueueSelectAll(page);
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

    var banner = document.getElementById("bulk-preview-banner");
    if (banner) {
      banner.remove();
    }

    this._bulkPreviewPlacements = null;

    var page = document.querySelector(".schedule-page[data-schedule-date]");
    if (page) {
      this.hideBulkPreviewToolbar(page.getAttribute("data-schedule-date"));
    }
  },

  formatAllocationSlotLabel(slot, service) {
    if (!slot || !slot.startTime) {
      return "";
    }
    var startMin = globalThis.SchedulerSlots.toMinutes(slot.startTime);
    var duration = service ? globalThis.SchedulerSlots.blockMinutes(service) : 0;
    var endTime =
      slot.startMinutes != null && service
        ? globalThis.SchedulerSlots.fromMinutes(slot.startMinutes + duration)
        : duration
          ? globalThis.SchedulerSlots.fromMinutes(startMin + duration)
          : slot.startTime;
    return slot.startTime + "–" + endTime;
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
      '.timeline-suggestion[data-request-id="' + requestId + '"]'
    );
    var item = document.querySelector('.timeline-queue-item[data-request-id="' + requestId + '"]');

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

  showBulkPreviewToolbar(scheduleDate, count, skipped) {
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

  hideBulkPreviewToolbar(scheduleDate) {
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

    if (scheduleDate) {
      this.refreshBulkAssignButton(scheduleDate);
    }
  },

  updateBulkPreviewToolbarCount(count) {
    var countEl = document.getElementById("bulk-preview-count");
    if (countEl) {
      countEl.textContent = String(count);
    }
  },

  refreshDayWorkspace(scheduleDate) {
    var page = document.querySelector('.schedule-page[data-schedule-date="' + scheduleDate + '"]');
    if (!page) {
      return;
    }

    var workspace = page.querySelector(".schedule-day-workspace");
    if (!workspace) {
      return;
    }

    workspace.innerHTML =
      '<div class="card schedule-patients-card">' +
      this.renderQueuePanel(scheduleDate) +
      "</div>" +
      '<div class="card schedule-timeline-card">' +
      '<div id="timeline-container">' +
      this.renderTimeline(scheduleDate) +
      "</div></div>";

    this.initQueueSuggestions(scheduleDate);
    this.initQueueSearch(scheduleDate);
    this.initTimelineFilters(scheduleDate);
    this.refreshPageToolbar(scheduleDate, { showDraft: false });
  },

  renderBulkPreviewOverlays(scheduleDate) {
    var self = this;
    var placements = this._bulkPreviewPlacements || [];

    placements.forEach(function (placement) {
      var track = document.querySelector(
        '.timeline-track[data-setup-id="' + placement.slot.setupId + '"]'
      );
      if (!track || !placement.service) {
        return;
      }

      track.classList.add("timeline-track--suggested");
      track.insertAdjacentHTML(
        "beforeend",
        self.buildSuggestionElement(
          placement.request,
          placement.patient,
          placement.service,
          placement.slot
        )
      );

      var item = document.querySelector(
        '.timeline-queue-item[data-request-id="' + placement.request.id + '"]'
      );
      if (item) {
        self.markQueueItemPreview(
          item,
          self.formatAllocationSlotLabel(placement.slot, placement.service)
        );
      }
    });

    if (placements.length) {
      this.showBulkPreviewToolbar(scheduleDate, placements.length, 0);
    }

    this.refreshTimelineSeverityFilter(scheduleDate);
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
      var node = document.querySelector('.timeline-suggestion[data-request-id="' + requestId + '"]');
      if (node) {
        node.remove();
      }
    }

    var item = document.querySelector('.timeline-queue-item[data-request-id="' + requestId + '"]');
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

  acceptSuggestion(requestId, scheduleDate, suggestionEl) {
    var setupId = suggestionEl.getAttribute("data-setup-id");
    var startTime = suggestionEl.getAttribute("data-start-time");
    if (!setupId || !startTime) {
      return;
    }

    globalThis.Store.assignRequest(requestId, setupId, scheduleDate, startTime);

    if (this._bulkPreviewPlacements) {
      this._bulkPreviewPlacements = this._bulkPreviewPlacements.filter(function (placement) {
        return placement.request.id !== requestId;
      });
    }

    this.refreshDayWorkspace(scheduleDate);

    if (this._bulkPreviewPlacements && this._bulkPreviewPlacements.length) {
      this.renderBulkPreviewOverlays(scheduleDate);
    } else {
      this._bulkPreviewPlacements = null;
      this.hideBulkPreviewToolbar(scheduleDate);
    }

    if (globalThis.UI && globalThis.UI.showToast) {
      UI.showToast("Slot assigned.");
    }
  },

  rejectSuggestion(requestId, scheduleDate) {
    if (this._bulkPreviewPlacements) {
      this._bulkPreviewPlacements = this._bulkPreviewPlacements.filter(function (placement) {
        return placement.request.id !== requestId;
      });
    }

    this.removeSuggestionPreview(
      requestId,
      document.querySelector('.timeline-suggestion[data-request-id="' + requestId + '"]')
    );

    if (this._bulkPreviewPlacements && this._bulkPreviewPlacements.length) {
      this.updateBulkPreviewToolbarCount(this._bulkPreviewPlacements.length);
    } else if (!document.querySelector(".timeline-suggestion")) {
      this.clearSlotSuggestions();
    }
  },

  async applyBulkPreviewFromToolbar(scheduleDate) {
    var confirmBtn = document.getElementById("bulk-preview-confirm");
    var page = document.querySelector('.schedule-page[data-schedule-date="' + scheduleDate + '"]');
    var placements = this._bulkPreviewPlacements || [];
    var requestIds = placements
      .map(function (placement) {
        return placement.request && placement.request.id;
      })
      .filter(Boolean);

    if (confirmBtn) {
      confirmBtn.disabled = true;
    }

    var allocate = globalThis.__ignisAllocatePatients;
    if (typeof allocate === "function" && requestIds.length) {
      try {
        var ok = await allocate(requestIds);
        if (!ok) {
          if (confirmBtn) {
            confirmBtn.disabled = false;
          }
          if (globalThis.UI && globalThis.UI.showToast) {
            globalThis.UI.showToast("Allocation failed — could not update requests on the server.");
          }
          return false;
        }
      } catch (err) {
        if (confirmBtn) {
          confirmBtn.disabled = false;
        }
        if (globalThis.UI && globalThis.UI.showToast) {
          globalThis.UI.showToast("Allocation failed — could not update requests on the server.");
        }
        return false;
      }
    }

    var result = this.applyBulkPreview(scheduleDate);
    if (
      globalThis.Store &&
      typeof globalThis.Store.markLiveRequestsAssigned === "function"
    ) {
      globalThis.Store.markLiveRequestsAssigned(requestIds);
    }
    this.clearSlotSuggestions();

    if (page) {
      page.outerHTML = this.renderDayView(scheduleDate, { showDraft: false });
      this.initQueueSuggestions(scheduleDate);
      this.initSuggestionActions(scheduleDate);
      this.refreshPageToolbar(scheduleDate, { showDraft: false });
    }

    if (globalThis.UI && globalThis.UI.showToast) {
      globalThis.UI.showToast(
        "Assigned " +
          result.assigned +
          " request" +
          (result.assigned === 1 ? "" : "s") +
          " (High severity first)."
      );
    }
    return true;
  },

  showBulkPreview(scheduleDate) {
    this.clearSlotSuggestions();

    var page = document.querySelector('.schedule-page[data-schedule-date="' + scheduleDate + '"]');
    var selectedIds = this.getSelectedQueueRequestIds(page);
    if (!selectedIds.length) {
      if (globalThis.UI && globalThis.UI.showToast) {
        UI.showToast("Select one or more patients in the queue first.");
      }
      return { placements: [], skipped: 0, total: 0 };
    }

    var planned = this.planBulkAssignments(scheduleDate, selectedIds);
    var self = this;

    this._bulkPreviewPlacements = planned.placements;

    planned.placements.forEach(function (placement) {
      var track = document.querySelector(
        '.timeline-track[data-setup-id="' + placement.slot.setupId + '"]'
      );
      if (!track || !placement.service) {
        return;
      }

      track.classList.add("timeline-track--suggested");
      track.insertAdjacentHTML(
        "beforeend",
        self.buildSuggestionElement(
          placement.request,
          placement.patient,
          placement.service,
          placement.slot
        )
      );

      var item = document.querySelector(
        '.timeline-queue-item[data-request-id="' + placement.request.id + '"]'
      );
      if (item) {
        self.markQueueItemPreview(
          item,
          self.formatAllocationSlotLabel(placement.slot, placement.service)
        );
      }
    });

    if (planned.placements.length) {
      this.showBulkPreviewToolbar(scheduleDate, planned.placements.length, planned.skipped);
    }

    return planned;
  },

  showSlotSuggestion(requestId, scheduleDate) {
    this.clearSlotSuggestions();

    var request = globalThis.Store.getRequest(requestId);
    if (!request || !ScheduleTimeline.isAwaitingQueueStatus(request.status)) {
      return;
    }

    var item = document.querySelector('.timeline-queue-item[data-request-id="' + requestId + '"]');
    if (item) {
      item.classList.add("timeline-queue-item--selected");
      item.setAttribute("aria-pressed", "true");
    }

    var slot = this.suggestSlotForRequest(request, scheduleDate);
    if (!slot) {
      if (item) {
        item.classList.remove("timeline-queue-item--selected");
        item.setAttribute("aria-pressed", "false");
        item.classList.add("timeline-queue-item--unavailable");
      }
      if (globalThis.UI && globalThis.UI.showToast) {
        UI.showToast("No open slot for this service on " + globalThis.SchedulerSlots.dayLabel(scheduleDate) + ".");
      }
      return;
    }

    var patient = globalThis.Store.getPatient(request.patientId);
    var service = globalThis.Store.getService(request.serviceId);
    var track = document.querySelector('.timeline-track[data-setup-id="' + slot.setupId + '"]');
    if (!track || !service) {
      if (globalThis.UI && globalThis.UI.showToast) {
        UI.showToast("Could not place suggestion on the timeline.");
      }
      return;
    }

    if (item) {
      item.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    var row = track.closest(".timeline-row");
    if (row) {
      row.classList.add("timeline-row--suggested");
    }

    track.classList.add("timeline-track--suggested");
    track.insertAdjacentHTML(
      "beforeend",
      this.buildSuggestionElement(request, patient, service, slot)
    );

    var suggestion = track.querySelector(".timeline-suggestion");
    if (suggestion) {
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      suggestion.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }

    this.refreshTimelineSeverityFilter(scheduleDate);
  },

  initQueueSuggestions(scheduleDate) {
    var self = this;
    var page = document.querySelector('.schedule-page[data-schedule-date="' + scheduleDate + '"]');

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
      var requestId = item && item.getAttribute("data-request-id");
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

      self.refreshBulkAssignButton(scheduleDate);
    });

    self.refreshBulkAssignButton(scheduleDate);
  },

  computeDayStats(scheduleDate, options) {
    options = options || {};
    var activeSetups = this.getActiveSetups();
    var bookings = this.dayBookings(scheduleDate).filter(function (booking) {
      return booking.status !== "Cancelled";
    });
    if (options.severity) {
      bookings = this.filterBookingsBySeverity(bookings, options.severity);
    }
    if (options.serviceType) {
      bookings = this.filterBookingsByServiceType(bookings, options.serviceType);
    }
    var active = activeSetups.filter(function (s) {
      return s.status === "Active";
    }).length;
    var maintenance = activeSetups.filter(function (s) {
      return s.status === "Under Maintenance";
    }).length;
    var machinesDownList = globalThis.Store.getSetupsDownOnDate(scheduleDate);
    var operatorsUnavailableList = globalThis.Store.getOperatorsUnavailableOnDate(scheduleDate);
    return {
      bookings: bookings.length,
      active: active,
      maintenance: maintenance,
      setups: activeSetups.length,
      machinesDown: machinesDownList.length,
      machinesDownList: machinesDownList,
      operatorsUnavailable: operatorsUnavailableList.length,
      operatorsUnavailableList: operatorsUnavailableList,
      byType: this.countBookingsByType(bookings),
    };
  },

  escapeStatTitle(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  },

  renderAvailabilityStatsLine(stats, options) {
    options = options || {};
    var parts = [];
    var hoursLabel = this.formatWorkingHoursLabel();

    if (stats.machinesDown) {
      var machineNames = stats.machinesDownList
        .map(function (setup) {
          return setup.name + " (" + hoursLabel + ")";
        })
        .join(", ");
      parts.push(
        '<span class="schedule-stat schedule-stat--warn" title="' +
          this.escapeStatTitle(machineNames) +
          '"><strong>' +
          stats.machinesDown +
          "</strong> machine" +
          (stats.machinesDown === 1 ? "" : "s") +
          " down</span>"
      );
    }

    if (stats.operatorsUnavailable) {
      var operatorNames = stats.operatorsUnavailableList
        .map(function (operator) {
          return globalThis.Store.getOperatorDisplayName(operator) + " (" + hoursLabel + ")";
        })
        .join(", ");
      parts.push(
        '<span class="schedule-stat schedule-stat--warn" title="' +
          this.escapeStatTitle(operatorNames) +
          '"><strong>' +
          stats.operatorsUnavailable +
          "</strong> operator" +
          (stats.operatorsUnavailable === 1 ? "" : "s") +
          " unavailable</span>"
      );
    }

    if (!parts.length && options.showOk) {
      parts.push('<span class="schedule-stat schedule-stat--ok">All machines &amp; operators available</span>');
    }

    return parts.join('<span class="schedule-stat-divider">·</span>');
  },

  renderRangeDayDetailStats(stats) {
    var html =
      '<div class="timeline-day-detail-stats">' +
      '<div class="timeline-day-detail-metrics">' +
      this.renderRangeDayTypeStats(stats.byType) +
      "</div>";

    if (stats.machinesDown) {
      var hoursLabel = this.formatWorkingHoursLabel();
      var machineNames = stats.machinesDownList
        .map(function (setup) {
          return setup.name;
        })
        .join(", ");
      html +=
        '<div class="timeline-day-detail-group timeline-day-detail-group--machines" title="' +
        this.escapeStatTitle(machineNames + " · " + hoursLabel) +
        '">' +
        '<span class="timeline-day-detail-group-label">' +
        stats.machinesDown +
        " down</span>" +
        '<span class="timeline-day-detail-group-items">' +
        machineNames +
        " · " +
        hoursLabel +
        "</span></div>";
    }

    if (stats.operatorsUnavailable) {
      var awayHoursLabel = this.formatWorkingHoursLabel();
      var operatorNames = stats.operatorsUnavailableList
        .map(function (operator) {
          return globalThis.Store.getOperatorDisplayName(operator);
        })
        .join(", ");
      html +=
        '<div class="timeline-day-detail-group timeline-day-detail-group--operators" title="' +
        this.escapeStatTitle(operatorNames + " · " + awayHoursLabel) +
        '">' +
        '<span class="timeline-day-detail-group-label">' +
        stats.operatorsUnavailable +
        " away</span>" +
        '<span class="timeline-day-detail-group-items">' +
        operatorNames +
        " · " +
        awayHoursLabel +
        "</span></div>";
    }

    html += "</div>";
    return html;
  },

  setupService(setup) {
    return globalThis.Store.getService(setup.serviceId);
  },

  setupServiceType(setup) {
    var service = this.setupService(setup);
    if (service && service.type) {
      return service.type;
    }
    // Infer modality from service id when catalog row is missing (live Setup List).
    var id = String((setup && setup.serviceId) || "").toLowerCase();
    if (id.indexOf("xray") >= 0 || id.indexOf("x-ray") >= 0) return "X-Ray";
    if (id.indexOf("ct") >= 0) return "CT";
    if (id.indexOf("mri") >= 0) return "MRI";
    return "Other";
  },

  groupActiveSetups(setups) {
    var self = this;
    var typeOrder = ["MRI", "CT", "X-Ray", "Other"];
    var grouped = {};

    typeOrder.forEach(function (type) {
      grouped[type] = [];
    });

    setups.forEach(function (setup) {
      var type = self.setupServiceType(setup);
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(setup);
    });

    return typeOrder
      .map(function (type) {
        return {
          type: type,
          setups: grouped[type]
            .slice()
            .sort(function (a, b) {
              return a.name.localeCompare(b.name);
            }),
        };
      })
      .filter(function (group) {
        return group.setups.length > 0;
      });
  },

  setupTypeClass(setup) {
    var service = this.setupService(setup);
    if (!service) return "";
    if (service.type === "MRI") return "timeline-row--mri";
    if (service.type === "CT") return "timeline-row--ct";
    return "timeline-row--xray";
  },

  blockTypeClass(service) {
    if (!service) return "";
    if (service.type === "MRI") return "timeline-block--mri";
    if (service.type === "CT") return "timeline-block--ct";
    return "timeline-block--xray";
  },

  patientBorderClass(patient, prefix) {
    prefix = prefix || "timeline-queue-item";
    if (!patient || !patient.severity) return "";
    if (patient.severity === "High") return prefix + "--sev-high";
    if (patient.severity === "Moderate") return prefix + "--sev-moderate";
    return prefix + "--sev-low";
  },

  renderOperatorAvatar(operator) {
    if (!operator) {
      return "";
    }
    var displayName = globalThis.Store.getOperatorDisplayName(operator);
    return (
      '<span class="timeline-block-avatar" style="background:' +
      (operator.avatarColor || "#868e96") +
      '" title="' +
      displayName +
      '">' +
      (operator.initials || globalThis.Store.operatorInitials(operator.name)) +
      "</span>"
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

  renderBookingBlock(booking) {
    var self = this;
    var patient = globalThis.Store.getPatient(booking.patientId);
    var service = globalThis.Store.getService(booking.serviceId);
    if (!service) return "";
    var operator = globalThis.Store.resolveBookingOperator(booking);
    var span = globalThis.SchedulerSlots.bookingSpan(booking, service);
    var pos = globalThis.SchedulerSlots.percentPosition(span.start, span.end - span.start);
    var endTime = globalThis.SchedulerSlots.fromMinutes(span.end);
    var label = patient ? patient.name : booking.id;
    var isNarrow = pos.width < 12;
    var isCompact = pos.width < 20;
    var sizeClass = isNarrow ? " timeline-block--narrow" : isCompact ? " timeline-block--compact" : "";
    var title = label + " · " + booking.startTime + "–" + endTime + " · " + service.name;
    if (operator) {
      title += " · " + globalThis.Store.getOperatorDisplayName(operator);
    }

    var metaHtml = isNarrow ? "" : self.renderPatientMeta(patient);
    var serviceHtml = isNarrow
      ? ""
      : '<div class="timeline-block-service-row">' +
        '<span class="timeline-block-service">' +
        service.name +
        "</span>" +
        globalThis.UI.badge(service.type) +
        "</div>";
    var operatorDesignationHtml =
      operator && globalThis.Store.getOperatorDesignation(operator)
        ? '<span class="timeline-block-operator-designation">' +
          globalThis.Store.getOperatorDesignation(operator) +
          "</span>"
        : "";

    return (
      '<a href="booking-detail.html?bookingId=' +
      encodeURIComponent(booking.id) +
      "&amp;date=" +
      encodeURIComponent(booking.date) +
      '" class="timeline-block timeline-block--rich' +
      sizeClass +
      '" data-booking-id="' +
      booking.id +
      '" data-booking-date="' +
      booking.date +
      '" data-severity="' +
      (patient && patient.severity ? patient.severity : "") +
      '" data-service-type="' +
      (service && service.type ? service.type : "") +
      '" style="left:' +
      pos.left +
      "%;width:" +
      pos.width +
      '%;" title="' +
      title +
      '">' +
      '<div class="timeline-block-segments" aria-hidden="true">' +
      '<span class="slot-segment slot-lead" style="width:' +
      (service.lead / (service.lead + service.procedure + service.lag)) * 100 +
      '%"></span>' +
      '<span class="slot-segment slot-procedure" style="width:' +
      (service.procedure / (service.lead + service.procedure + service.lag)) * 100 +
      '%"></span>' +
      '<span class="slot-segment slot-lag" style="width:' +
      (service.lag / (service.lead + service.procedure + service.lag)) * 100 +
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
      (operator
        ? '<div class="timeline-block-operator-row">' +
          self.renderOperatorAvatar(operator) +
          '<div class="timeline-block-operator-info">' +
          '<span class="timeline-block-operator-name">' +
          globalThis.Store.getOperatorDisplayName(operator) +
          "</span>" +
          operatorDesignationHtml +
          "</div></div>"
        : "") +
      "</div></a>"
    );
  },

  isSetupDownOnDay(setup, scheduleDate) {
    return this.summarizeSetupAvailability(setup, scheduleDate).downSpans.length > 0;
  },

  isSetupOperatorOnLeave(setup, scheduleDate) {
    if (!setup.defaultOperatorId) {
      return false;
    }
    return this.summarizeSetupAvailability(setup, scheduleDate).operatorSpans.length > 0;
  },

  totalOperatingMinutes() {
    return (
      globalThis.SchedulerSlots.BREAK_START -
      globalThis.SchedulerSlots.DAY_START +
      (globalThis.SchedulerSlots.DAY_END - globalThis.SchedulerSlots.BREAK_END)
    );
  },

  operatingWindows() {
    return [
      { start: globalThis.SchedulerSlots.DAY_START, end: globalThis.SchedulerSlots.BREAK_START },
      { start: globalThis.SchedulerSlots.BREAK_END, end: globalThis.SchedulerSlots.DAY_END },
    ];
  },

  formatWorkingHoursLabel() {
    return (
      globalThis.SchedulerSlots.fromMinutes(globalThis.SchedulerSlots.DAY_START) +
      "–" +
      globalThis.SchedulerSlots.fromMinutes(globalThis.SchedulerSlots.BREAK_START) +
      ", " +
      globalThis.SchedulerSlots.fromMinutes(globalThis.SchedulerSlots.BREAK_END) +
      "–" +
      globalThis.SchedulerSlots.fromMinutes(globalThis.SchedulerSlots.DAY_END)
    );
  },

  formatDurationLabel(minutes) {
    if (!minutes) {
      return "0h";
    }
    var hours = Math.floor(minutes / 60);
    var mins = minutes % 60;
    if (!mins) {
      return hours + "h";
    }
    if (!hours) {
      return mins + "m";
    }
    return hours + "h " + mins + "m";
  },

  formatSpanLabel(span) {
    return (
      globalThis.SchedulerSlots.fromMinutes(span.start) + "–" + globalThis.SchedulerSlots.fromMinutes(span.end)
    );
  },

  formatSpanLabels(spans) {
    var self = this;
    return spans
      .map(function (span) {
        return self.formatSpanLabel(span);
      })
      .join(", ");
  },

  mergeClosedSpans(spans) {
    if (!spans.length) {
      return [];
    }

    var sorted = spans
      .slice()
      .sort(function (a, b) {
        if (a.start !== b.start) {
          return a.start - b.start;
        }
        return a.end - b.end;
      });
    var merged = [
      {
        start: sorted[0].start,
        end: sorted[0].end,
        type: sorted[0].type,
      },
    ];

    for (var i = 1; i < sorted.length; i++) {
      var last = merged[merged.length - 1];
      var current = sorted[i];
      if (current.start <= last.end && current.type === last.type) {
        last.end = Math.max(last.end, current.end);
        continue;
      }
      merged.push({
        start: current.start,
        end: current.end,
        type: current.type,
      });
    }

    return merged;
  },

  clipSpansToOperating(spans) {
    var self = this;
    var clipped = [];

    spans.forEach(function (span) {
      self.operatingWindows().forEach(function (window) {
        var start = Math.max(span.start, window.start);
        var end = Math.min(span.end, window.end);
        if (start < end) {
          clipped.push({
            start: start,
            end: end,
            type: span.type,
          });
        }
      });
    });

    return this.mergeClosedSpans(clipped);
  },

  subtractDownSpans(spans, downSpans) {
    if (!downSpans.length) {
      return spans;
    }

    var open = spans.slice();
    downSpans.forEach(function (down) {
      var next = [];
      open.forEach(function (span) {
        if (span.end <= down.start || span.start >= down.end) {
          next.push(span);
          return;
        }
        if (span.start < down.start) {
          next.push({
            start: span.start,
            end: down.start,
            type: span.type,
          });
        }
        if (span.end > down.end) {
          next.push({
            start: down.end,
            end: span.end,
            type: span.type,
          });
        }
      });
      open = next;
    });

    return this.mergeClosedSpans(open);
  },

  getSetupClosedSpans(setup, scheduleDate) {
    var self = this;

    if (setup.status === "Inactive") {
      var inactiveSpans = [];
      this.operatingWindows().forEach(function (window) {
        inactiveSpans.push({
          start: window.start,
          end: window.end,
          type: "down",
        });
      });
      return inactiveSpans;
    }

    var operatorSpans = [];

    if (setup.defaultOperatorId) {
      Store.getOperatorLeavesForDate(scheduleDate).forEach(function (leave) {
        if (leave.operatorId !== setup.defaultOperatorId) {
          return;
        }
        if (leave.startTime && leave.endTime) {
          operatorSpans.push({
            start: globalThis.SchedulerSlots.toMinutes(leave.startTime),
            end: globalThis.SchedulerSlots.toMinutes(leave.endTime),
            type: "operator",
          });
          return;
        }
        self.operatingWindows().forEach(function (window) {
          operatorSpans.push({
            start: window.start,
            end: window.end,
            type: "operator",
          });
        });
      });
    }

    return this.clipSpansToOperating(operatorSpans);
  },

  summarizeSetupAvailability(setup, scheduleDate) {
    var closedSpans = this.getSetupClosedSpans(setup, scheduleDate);
    var downSpans = closedSpans.filter(function (span) {
      return span.type === "down";
    });
    var operatorSpans = closedSpans.filter(function (span) {
      return span.type === "operator";
    });
    var closedMinutes = closedSpans.reduce(function (sum, span) {
      return sum + (span.end - span.start);
    }, 0);
    var total = this.totalOperatingMinutes();
    var operator = setup.defaultOperatorId
      ? globalThis.Store.getOperator(setup.defaultOperatorId)
      : null;

    return {
      workingMinutes: Math.max(0, total - closedMinutes),
      closedMinutes: closedMinutes,
      totalMinutes: total,
      closedSpans: closedSpans,
      downSpans: downSpans,
      operatorSpans: operatorSpans,
      operatorName: operator ? globalThis.Store.getOperatorDisplayName(operator) : "",
      fullyDown: downSpans.reduce(function (sum, span) {
        return sum + (span.end - span.start);
      }, 0) >= total,
    };
  },

  isSlotOperationallyOpen(setupId, scheduleDate, startMinutes, endMinutes) {
    var setup = globalThis.Store.getSetup(setupId);
    if (!setup) {
      return false;
    }
    if (setup.status === "Inactive" || setup.status === "Under Maintenance") {
      return false;
    }

    var candidate = { start: startMinutes, end: endMinutes };
    var closedSpans = this.getSetupClosedSpans(setup, scheduleDate);
    return !closedSpans.some(function (span) {
      return globalThis.SchedulerSlots.overlaps(candidate, span);
    });
  },

  renderClosedSpanBands(spans, bandClass, titlePrefix) {
    var self = this;
    return spans
      .map(function (span) {
        var pos = globalThis.SchedulerSlots.percentPosition(span.start, span.end - span.start);
        return (
          '<div class="' +
          bandClass +
          '" style="left:' +
          pos.left +
          "%;width:" +
          pos.width +
          '%;" aria-hidden="true" title="' +
          self.escapeStatTitle(titlePrefix + " · " + self.formatSpanLabel(span)) +
          '"></div>'
        );
      })
      .join("");
  },

  renderSetupAvailabilityBands(setup, scheduleDate) {
    var summary = this.summarizeSetupAvailability(setup, scheduleDate);
    var html = "";

    if (setup.status === "Inactive" && summary.downSpans.length) {
      html += this.renderClosedSpanBands(
        summary.downSpans,
        "timeline-machine-down-band",
        "Inactive"
      );
    }

    if (summary.operatorSpans.length) {
      html += this.renderClosedSpanBands(
        summary.operatorSpans,
        "timeline-operator-away-band",
        "No operator · " + summary.operatorName
      );
    }
    return html;
  },

  renderSetupAvailabilityMeta(setup, scheduleDate) {
    var summary = this.summarizeSetupAvailability(setup, scheduleDate);
    if (!summary.closedSpans.length) {
      return "";
    }

    var lines = [];

    if (setup.status !== "Inactive" && summary.closedMinutes) {
      lines.push(
        '<span class="timeline-setup-avail timeline-setup-avail--summary">' +
          this.formatDurationLabel(summary.workingMinutes) +
          " working · " +
          this.formatDurationLabel(summary.closedMinutes) +
          " closed</span>"
      );
    }

    if (setup.status === "Inactive") {
      lines.push(
        '<span class="timeline-setup-avail timeline-setup-avail--down">Inactive · full day</span>'
      );
    }

    if (summary.operatorSpans.length) {
      lines.push(
        '<span class="timeline-setup-avail timeline-setup-avail--away">No operator · ' +
          summary.operatorName +
          " · " +
          this.formatSpanLabels(summary.operatorSpans) +
          "</span>"
      );
    }

    if (!lines.length) {
      return "";
    }

    return '<div class="timeline-setup-availability">' + lines.join("") + "</div>";
  },

  renderSetupActions(setup, scheduleDate) {
    if (setup.status !== "Active") {
      return globalThis.UI.setupStatusBadge(setup.status);
    }
    return (
      '<div class="timeline-setup-actions">' +
      '<a href="declare-event.html?type=emergency&amp;setupId=' +
      setup.id +
      "&amp;date=" +
      scheduleDate +
      '" class="timeline-setup-link">Emergency</a>' +
      '<a href="declare-event.html?type=setup_down&amp;setupId=' +
      setup.id +
      "&amp;date=" +
      scheduleDate +
      '" class="timeline-setup-link timeline-setup-link--danger">Mark shut down</a>' +
      "</div>"
    );
  },

  renderSetupRow(setup, scheduleDate, dayBookings, options) {
    var self = this;
    options = options || {};
    var service = this.setupService(setup);
    var bookings = dayBookings.filter(function (booking) {
      return booking.setupId === setup.id;
    });
    var blocks = bookings
      .map(function (booking) {
        return self.renderBookingBlock(booking);
      })
      .join("");
    var trackClass =
      setup.status === "Inactive" ? " timeline-track--maintenance" : "";

    return (
      '<div class="timeline-row ' +
      this.setupTypeClass(setup) +
      '">' +
      '<div class="timeline-setup">' +
      '<div class="timeline-setup-head">' +
      '<span class="timeline-setup-name">' +
      setup.name +
      "</span>" +
      (service ? globalThis.UI.badge(service.type) : "") +
      '<span class="timeline-setup-count">' +
      bookings.length +
      " booked</span>" +
      "</div>" +
      (options.range ? "" : this.renderSetupAvailabilityMeta(setup, scheduleDate)) +
      (options.range ? "" : this.renderSetupActions(setup, scheduleDate)) +
      "</div>" +
      '<div class="timeline-track' +
      trackClass +
      '" data-setup-id="' +
      setup.id +
      '">' +
      globalThis.SchedulerSlots.renderBreakBand() +
      (options.range ? "" : this.renderSetupAvailabilityBands(setup, scheduleDate)) +
      blocks +
      "</div></div>"
    );
  },

  renderTimeline(scheduleDate, options) {
    var self = this;
    options = options || {};
    var boardSetups = this.getBoardSetups();
    var dayBookings = this.dayBookings(scheduleDate);

    if (boardSetups.length === 0) {
      return (
        '<div class="schedule-empty">' +
        "<p>No active setups to display. Add or activate setups in admin.</p>" +
        '<a href="../admin/setups.html" class="table-action-btn table-action-btn--neutral">Manage setups</a>' +
        "</div>"
      );
    }

    var tableHead = this.renderTimelineHourHeader("Setup / Time");

    return (
      '<div class="timeline-wrap' +
      (options.range ? " timeline-wrap--range" : "") +
      '">' +
      tableHead +
      this.groupActiveSetups(boardSetups)
        .map(function (group) {
          return group.setups
            .map(function (setup) {
              return self.renderSetupRow(setup, scheduleDate, dayBookings, options);
            })
            .join("");
        })
        .join("") +
      "</div>"
    );
  },

  renderScheduleViewToggle(activeView, scheduleDate) {
    scheduleDate = scheduleDate || globalThis.UI.SCHEDULE_START;
    var dayHref = "schedule-day.html?date=" + encodeURIComponent(scheduleDate);
    var rangeHref = "schedule-range.html";
    var isDay = activeView === "day";

    return (
      '<div class="schedule-view-toggle" role="tablist" aria-label="Schedule view">' +
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

  renderTimelineHourHeader(cornerLabel, options) {
    options = options || {};
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
      '<span class="timeline-corner">' +
      cornerLabel +
      "</span>" +
      '<div class="timeline-hours-track">' +
      hourCells +
      globalThis.SchedulerSlots.renderBreakBand({ compact: true, label: globalThis.SchedulerSlots.breakLabel() + " Break" }) +
      "</div></div>" +
      "</div>"
    );
  },

  rangeHourSlots() {
    return [8, 9, 10, 11, 12, "break", 14, 15, 16, 17];
  },

  bookingsForDayHour(scheduleDate, hourStart, severity, serviceType) {
    var bookings = this.dayBookings(scheduleDate).filter(function (booking) {
      if (booking.status === "Cancelled") {
        return false;
      }
      var hour = parseInt(booking.startTime.split(":")[0], 10);
      return hour === hourStart;
    });
    return this.filterBookingsByServiceType(
      this.filterBookingsBySeverity(bookings, severity),
      serviceType
    );
  },

  countBookingsByType(bookings) {
    var counts = { MRI: 0, CT: 0, "X-Ray": 0 };
    bookings.forEach(function (booking) {
      var service = globalThis.Store.getService(booking.serviceId);
      if (service && Object.prototype.hasOwnProperty.call(counts, service.type)) {
        counts[service.type] += 1;
      }
    });
    return counts;
  },

  renderRangeTypeStats(counts) {
    return ["MRI", "CT", "X-Ray"]
      .filter(function (type) {
        return counts[type] > 0;
      })
      .map(function (type) {
        var typeClass =
          type === "MRI" ? "mri" : type === "CT" ? "ct" : "xray";
        var shortLabel = type === "X-Ray" ? "X-Ray" : type;
        return (
          '<span class="timeline-range-mod-chip timeline-range-mod-chip--' +
          typeClass +
          '" title="' +
          type +
          ": " +
          counts[type] +
          '">' +
          '<span class="timeline-range-mod-name">' +
          shortLabel +
          "</span>" +
          '<span class="timeline-range-mod-sep">:</span>' +
          '<span class="timeline-range-mod-value">' +
          counts[type] +
          "</span></span>"
        );
      })
      .join("");
  },

  renderRangeDayTypeStats(counts) {
    return ["MRI", "CT", "X-Ray"]
      .filter(function (type) {
        return counts[type] > 0;
      })
      .map(function (type) {
        var typeClass =
          type === "MRI" ? "mri" : type === "CT" ? "ct" : "xray";
        var shortLabel = type === "X-Ray" ? "XR" : type;
        return (
          '<span class="timeline-day-mod-item timeline-day-mod-item--' +
          typeClass +
          '" title="' +
          type +
          ": " +
          counts[type] +
          '">' +
          shortLabel +
          '<span class="timeline-day-mod-colon">:</span>' +
          '<span class="timeline-day-mod-count">' +
          counts[type] +
          "</span></span>"
        );
      })
      .join("");
  },

  renderRangeHourCell(scheduleDate, hourStart, severity, serviceType) {
    var bookings = this.bookingsForDayHour(scheduleDate, hourStart, severity, serviceType);
    var counts = this.countBookingsByType(bookings);
    var statsHtml = this.renderRangeTypeStats(counts);
    var href = "schedule-day.html?date=" + encodeURIComponent(scheduleDate);
    var title =
      globalThis.SchedulerSlots.dayLabel(scheduleDate) +
      " · " +
      String(hourStart).padStart(2, "0") +
      ":00";

    return (
      '<a href="' +
      href +
      '" class="timeline-range-hour-cell' +
      (statsHtml ? " timeline-range-hour-cell--busy" : "") +
      '" style="left:' +
      ((hourStart * 60 - globalThis.SchedulerSlots.DAY_START) / (globalThis.SchedulerSlots.DAY_END - globalThis.SchedulerSlots.DAY_START)) *
        100 +
      '%;width:10%;" title="' +
      title +
      '">' +
      (statsHtml ? '<span class="timeline-range-hour-cell-stats">' + statsHtml + "</span>" : "") +
      "</a>"
    );
  },

  renderRangeDayTrack(scheduleDate, severity, serviceType) {
    var self = this;
    return this.rangeHourSlots()
      .map(function (slot) {
        if (slot === "break") {
          return "";
        }
        return self.renderRangeHourCell(scheduleDate, slot, severity, serviceType);
      })
      .join("");
  },

  renderRangeDayRow(scheduleDate, severity, serviceType) {
    var parsed = globalThis.SchedulerSlots.parseDate(scheduleDate);
    var today =
      typeof globalThis.UI.todayISO === "function"
        ? globalThis.UI.todayISO()
        : globalThis.UI.SCHEDULE_START;
    var isToday = scheduleDate === today;
    var href = "schedule-day.html?date=" + encodeURIComponent(scheduleDate);
    var dow = parsed.toLocaleDateString("en-US", { weekday: "short" });
    var dayNum = parsed.getDate();
    var month = parsed.toLocaleDateString("en-US", { month: "short" });
    var stats = this.computeDayStats(scheduleDate, {
      severity: severity,
      serviceType: serviceType,
    });

    return (
      '<div class="timeline-row timeline-row--range-day' +
      (isToday ? " timeline-row--today" : "") +
      '">' +
      '<div class="timeline-setup timeline-day-label-col">' +
      '<div class="timeline-day-label-head">' +
      '<a href="' +
      href +
      '" class="timeline-day-label-link" title="Open ' +
      globalThis.SchedulerSlots.dayLabel(scheduleDate) +
      '">' +
      '<span class="timeline-day-label-dow">' +
      dow +
      "</span>" +
      '<span class="timeline-day-label-date">' +
      month +
      " " +
      dayNum +
      "</span>" +
      (isToday ? '<span class="timeline-day-label-today">Today</span>' : "") +
      "</a>" +
      '<span class="timeline-setup-count">' +
      stats.bookings +
      " booked</span>" +
      "</div>" +
      this.renderRangeDayDetailStats(stats) +
      "</div>" +
      '<div class="timeline-track timeline-range-day-track">' +
      globalThis.SchedulerSlots.renderBreakBand() +
      this.renderRangeDayTrack(scheduleDate, severity, serviceType) +
      "</div></div>"
    );
  },

  renderRangeTimeline(severity, serviceType) {
    severity = severity || "";
    serviceType = serviceType || "";
    var self = this;
    var dates = globalThis.UI.scheduleRangeDates();
    var rows = dates
      .map(function (date) {
        return self.renderRangeDayRow(date, severity, serviceType);
      })
      .join("");

    return (
      '<div class="timeline-wrap timeline-wrap--range">' +
      this.renderTimelineHourHeader("Days") +
      rows +
      "</div>"
    );
  },

  renderRangeView(options) {
    options = options || {};
    var timeline = options.boardSkeleton
      ? this.renderRangeTimelineSkeleton()
      : this.renderRangeTimeline(
          this.getTimelineSeverityFilter(this.RANGE_FILTER_SCOPE),
          this.getTimelineServiceFilter(this.RANGE_FILTER_SCOPE)
        );
    return (
      '<div class="schedule-page schedule-range-page">' +
      '<div class="schedule-day-workspace schedule-range-workspace">' +
      '<div class="card schedule-timeline-card">' +
      '<div id="timeline-container">' +
      timeline +
      "</div></div></div></div>"
    );
  },

  draftPlans() {
    return globalThis.Store.getReschedulePlans().filter(function (plan) {
      return plan.status === "Draft";
    });
  },

  renderDraftPlanBanner() {
    var drafts = this.draftPlans();
    if (!drafts.length) {
      return "";
    }
    var plan = drafts[0];
    var label = drafts.length === 1 ? "1 draft reschedule plan" : drafts.length + " draft reschedule plans";
    return (
      '<div class="notice-banner">' +
      "<span><strong>" +
      label +
      "</strong> waiting for review.</span>" +
      '<a href="reschedule-plan.html?planId=' +
      plan.id +
      '">Review plan →</a>' +
      "</div>"
    );
  },

  computeRangeStats() {
    var self = this;
    var dates = globalThis.UI.scheduleRangeDates();
    var bookings = 0;
    var machineDownDays = 0;
    var operatorIds = {};
    dates.forEach(function (date) {
      var dayStats = self.computeDayStats(date);
      bookings += dayStats.bookings;
      machineDownDays += dayStats.machinesDown;
      dayStats.operatorsUnavailableList.forEach(function (operator) {
        operatorIds[operator.id] = true;
      });
    });
    var dayStats = this.computeDayStats(globalThis.UI.SCHEDULE_START);
    return {
      bookings: bookings,
      active: dayStats.active,
      maintenance: dayStats.maintenance,
      days: dates.length,
      machineDownDays: machineDownDays,
      operatorsUnavailable: Object.keys(operatorIds).length,
    };
  },

  computeRangeNavbarStats() {
    var self = this;
    var dates = globalThis.UI.scheduleRangeDates();
    var machineIds = {};
    var operatorIds = {};
    var machinesDownList = [];
    var operatorsUnavailableList = [];

    dates.forEach(function (date) {
      Store.getSetupsDownOnDate(date).forEach(function (setup) {
        if (!machineIds[setup.id]) {
          machineIds[setup.id] = true;
          machinesDownList.push(setup);
        }
      });
      globalThis.Store.getOperatorsUnavailableOnDate(date).forEach(function (operator) {
        if (!operatorIds[operator.id]) {
          operatorIds[operator.id] = true;
          operatorsUnavailableList.push(operator);
        }
      });
    });

    var dayStats = this.computeDayStats(globalThis.UI.SCHEDULE_START);
    machinesDownList.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
    operatorsUnavailableList.sort(function (a, b) {
      return globalThis.Store.getOperatorDisplayName(a).localeCompare(globalThis.Store.getOperatorDisplayName(b));
    });

    return {
      active: dayStats.active,
      maintenance: dayStats.maintenance,
      machinesDown: machinesDownList.length,
      machinesDownList: machinesDownList,
      operatorsUnavailable: operatorsUnavailableList.length,
      operatorsUnavailableList: operatorsUnavailableList,
    };
  },

  renderNavbarStatsContent(stats) {
    stats = stats || this.computeDayStats(globalThis.UI.SCHEDULE_START);
    var availability = this.renderAvailabilityStatsLine(stats);
    return (
      "<span class=\"schedule-stat\"><strong>" +
      stats.active +
      "</strong> active setups</span>" +
      (stats.maintenance
        ? '<span class="schedule-stat-divider">·</span><span class="schedule-stat"><strong>' +
          stats.maintenance +
          "</strong> in maintenance</span>"
        : "") +
      (availability
        ? '<span class="schedule-stat-divider">·</span>' + availability
        : '<span class="schedule-stat-divider">·</span><span class="schedule-stat schedule-stat--ok">All machines &amp; operators available</span>') +
      '<span class="schedule-stat-divider">·</span>' +
      '<span class="schedule-stat">08:00–13:00 · <strong>Break 13:00–14:00</strong> · 14:00–18:00</span>'
    );
  },

  renderNavbarStats(scheduleDate) {
    return (
      '<div id="schedule-navbar-stats" class="schedule-stats schedule-navbar-stats">' +
      this.renderNavbarStatsContent(this.computeDayStats(scheduleDate)) +
      "</div>"
    );
  },

  renderNavbarRangeStats() {
    return (
      '<div id="schedule-navbar-stats" class="schedule-stats schedule-navbar-stats">' +
      this.renderNavbarStatsContent(this.computeRangeNavbarStats()) +
      "</div>"
    );
  },

  renderRangeStatsContent(stats) {
    stats = stats || this.computeRangeStats();
    var availabilityParts = [];
    if (stats.machineDownDays) {
      availabilityParts.push(
        '<span class="schedule-stat schedule-stat--warn"><strong>' +
          stats.machineDownDays +
          "</strong> machine-days down</span>"
      );
    }
    if (stats.operatorsUnavailable) {
      availabilityParts.push(
        '<span class="schedule-stat schedule-stat--warn"><strong>' +
          stats.operatorsUnavailable +
          "</strong> operators with leave</span>"
      );
    }
    var availability = availabilityParts.join('<span class="schedule-stat-divider">·</span>');
    return (
      "<span class=\"schedule-stat\"><strong>" +
      stats.bookings +
      "</strong> scheduled</span>" +
      '<span class="schedule-stat-divider">·</span>' +
      "<span class=\"schedule-stat\"><strong>" +
      stats.active +
      "</strong> active setups</span>" +
      (stats.maintenance
        ? '<span class="schedule-stat-divider">·</span><span class="schedule-stat"><strong>' +
          stats.maintenance +
          "</strong> in maintenance</span>"
        : "") +
      (availability
        ? '<span class="schedule-stat-divider">·</span>' + availability
        : "") +
      '<span class="schedule-stat-divider">·</span>' +
      '<span class="schedule-stat"><strong>' +
      stats.days +
      "</strong> days</span>" +
      '<span class="schedule-stat-divider">·</span>' +
      '<span class="schedule-stat">08:00–13:00 · <strong>Break 13:00–14:00</strong> · 14:00–18:00</span>'
    );
  },

  renderRangePageToolbar() {
    return (
      '<div class="schedule-page-toolbar">' +
      '<div class="schedule-ops-actions">' +
      this.renderTimelineSeverityFilter(this.RANGE_FILTER_SCOPE) +
      "</div>" +
      this.renderScheduleViewToggle("range") +
      "</div>"
    );
  },

  renderScheduleStats(scheduleDate) {
    var stats = this.computeDayStats(scheduleDate);
    return (
      '<div class="schedule-stats schedule-stats--toolbar">' +
      this.renderScheduleStatsContent(scheduleDate, stats) +
      "</div>"
    );
  },

  renderScheduleStatsContent(scheduleDate, stats) {
    return this.renderNavbarStatsContent(stats || this.computeDayStats(scheduleDate));
  },

  renderPageToolbar(scheduleDate, options) {
    options = options || {};
    return (
      '<div class="schedule-page-toolbar">' +
      this.renderScheduleOpsActions(scheduleDate, options) +
      this.renderScheduleViewToggle("day", scheduleDate) +
      this.renderBulkAssignButton(scheduleDate) +
      "</div>"
    );
  },

  refreshPageToolbar(scheduleDate, options) {
    options = options || { showDraft: false };
    var statsEl = document.getElementById("schedule-navbar-stats");
    if (statsEl) {
      statsEl.innerHTML = this.renderNavbarStatsContent(this.computeDayStats(scheduleDate));
    }
    this.refreshBulkAssignButton(scheduleDate);
  },

  renderBulkAssignButton(scheduleDate) {
    return (
      '<button type="button" class="table-action-btn table-action-btn--primary" id="bulk-assign-btn" disabled' +
      ' title="Allocate selected patients — High severity first">Allocation</button>'
    );
  },

  renderScheduleOpsActions(scheduleDate, options) {
    options = options || {};
    var drafts = options.showDraft === false ? [] : this.draftPlans();
    var planHref = drafts.length ? "reschedule-plan.html?planId=" + encodeURIComponent(drafts[0].id) : "";

    return (
      '<div class="schedule-ops-actions">' +
      this.renderBulkPreviewBar() +
      this.renderTimelineSeverityFilter(scheduleDate) +
      (planHref
        ? '<a href="' + planHref + '" class="table-action-btn table-action-btn--neutral">Review reschedule plan</a>'
        : "") +
      "</div>"
    );
  },

  renderDayView(scheduleDate, options) {
    options = options || {};
    var loading = Boolean(options.queueSkeleton || options.boardSkeleton);
    var draftBanner = options.showDraft === false ? "" : this.renderDraftPlanBanner();
    var queuePanel = loading ? this.renderQueueSkeletonPanel() : this.renderQueuePanel(scheduleDate);
    var timeline = loading ? this.renderTimelineSkeleton() : this.renderTimeline(scheduleDate);
    return (
      '<div class="schedule-page' +
      (loading ? " schedule-page--loading" : "") +
      '" data-schedule-date="' +
      scheduleDate +
      '">' +
      draftBanner +
      '<div class="schedule-day-workspace">' +
      '<div class="card schedule-patients-card">' +
      queuePanel +
      "</div>" +
      '<div class="card schedule-timeline-card">' +
      '<div id="timeline-container">' +
      timeline +
      "</div></div></div></div>"
    );
  },

  initSuggestionActions(scheduleDate) {
    var self = this;
    var page = document.querySelector('.schedule-page[data-schedule-date="' + scheduleDate + '"]');

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

      var requestId = suggestion.getAttribute("data-request-id");
      if (!requestId) {
        return;
      }

      if (acceptBtn) {
        self.acceptSuggestion(requestId, scheduleDate, suggestion);
        return;
      }

      self.rejectSuggestion(requestId, scheduleDate);
    });
  },

  initBulkAssign(scheduleDate) {
    var page = document.querySelector('.schedule-page[data-schedule-date="' + scheduleDate + '"]');
    if (!page || page.getAttribute("data-bulk-ops-init") === "1") {
      return;
    }

    page.setAttribute("data-bulk-ops-init", "1");
    var self = this;

    document.addEventListener("click", function (event) {
      if (!document.querySelector('.schedule-page[data-schedule-date="' + scheduleDate + '"]')) {
        return;
      }

      var bulkBtn = event.target.closest("#bulk-assign-btn");
      var confirmBtn = event.target.closest("#bulk-preview-confirm");
      var cancelBtn = event.target.closest("#bulk-preview-cancel");

      if (confirmBtn) {
        event.preventDefault();
        self.applyBulkPreviewFromToolbar(scheduleDate);
        return;
      }

      if (cancelBtn) {
        event.preventDefault();
        self.clearSlotSuggestions();
        return;
      }

      if (!bulkBtn || bulkBtn.disabled || bulkBtn.hidden) {
        return;
      }

      event.preventDefault();
      bulkBtn.disabled = true;
      var originalLabel = bulkBtn.textContent;
      bulkBtn.textContent = "Allocating…";

      var result = self.showBulkPreview(scheduleDate);

      if (!result.placements.length) {
        bulkBtn.disabled = false;
        bulkBtn.textContent = originalLabel;
        self.refreshBulkAssignButton(scheduleDate);
        if (result.total === 0) {
          return;
        }
        if (globalThis.UI && globalThis.UI.showToast) {
          UI.showToast("No requests could be placed — no open slots available.");
        }
        return;
      }

      bulkBtn.textContent = originalLabel;
      self.refreshBulkAssignButton(scheduleDate);
    });
  },

  initDayNav(scheduleDate, options) {
    options = options || {};
    var page = options.page || "schedule-day.html";
    var minDate = options.minDate || "";
    var maxDate = options.maxDate || "";

    function navigateDay(offset) {
      var nextDate = globalThis.SchedulerSlots.addDays(scheduleDate, offset);
      if (minDate && nextDate < minDate) return;
      if (maxDate && nextDate > maxDate) return;
      window.location.href = page + "?date=" + encodeURIComponent(nextDate);
    }

    var dateInput = document.getElementById("schedule-date");
    if (dateInput) {
      dateInput.addEventListener("change", function (event) {
        var value = event.target.value;
        if (minDate && value < minDate) return;
        if (maxDate && value > maxDate) return;
        window.location.href = page + "?date=" + encodeURIComponent(value);
      });
    }

    var prevBtn = document.getElementById("day-prev");
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        navigateDay(-1);
      });
      if (minDate && scheduleDate <= minDate) {
        prevBtn.disabled = true;
      }
    }

    var nextBtn = document.getElementById("day-next");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        navigateDay(1);
      });
      if (maxDate && scheduleDate >= maxDate) {
        nextBtn.disabled = true;
      }
    }
  },
};

globalThis.ScheduleTimeline = ScheduleTimeline;
export { ScheduleTimeline };
