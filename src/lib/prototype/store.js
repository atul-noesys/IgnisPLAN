import "./mock-data.js";
const Store = {
  /** Mock seed calendar anchor in MOCK_DATA (shifted to today on load). */
  _SEED_ANCHOR: "2026-07-08",
  _cache: null,
  _patientMap: null,
  _serviceMap: null,
  /** @type {{ requests: any[], patients: any[], services: any[] } | null} */
  _liveQueue: null,
  /** @type {any[] | null} Live Assigned bookings overlay. */
  _liveBookings: null,
  /** @type {"replace" | "merge"} replace = 15-day live only; merge = mock + live (day). */
  _liveBookingsMode: "replace",
  /** @type {{ beds: any[], wards: any[], departments: any[] } | null} */
  _liveBedsInventory: null,
  /** @type {{ bedRequests: any[], patients: any[], departments: any[], allotments: any[] } | null} */
  _liveBedsQueue: null,

  _clearLookupMaps() {
    this._patientMap = null;
    this._serviceMap = null;
  },

  _dayDiff(fromDate, toDate) {
    var a = new Date(fromDate + "T12:00:00").getTime();
    var b = new Date(toDate + "T12:00:00").getTime();
    return Math.round((b - a) / 86400000);
  },

  _shiftDateString(value, deltaDays) {
    if (typeof value !== "string" || !deltaDays) {
      return value;
    }
    return value.replace(/\d{4}-\d{2}-\d{2}/g, function (dateStr) {
      return globalThis.UI.addDays(dateStr, deltaDays);
    });
  },

  _rebaseSeedDates(node, deltaDays) {
    if (!deltaDays) {
      return node;
    }
    if (typeof node === "string") {
      return this._shiftDateString(node, deltaDays);
    }
    if (Array.isArray(node)) {
      var self = this;
      return node.map(function (item) {
        return self._rebaseSeedDates(item, deltaDays);
      });
    }
    if (node && typeof node === "object") {
      var out = {};
      var selfObj = this;
      Object.keys(node).forEach(function (key) {
        out[key] = selfObj._rebaseSeedDates(node[key], deltaDays);
      });
      return out;
    }
    return node;
  },

  _cloneSeed() {
    var data = JSON.parse(JSON.stringify(globalThis.MOCK_DATA));
    var today =
      globalThis.UI && typeof globalThis.UI.todayISO === "function"
        ? globalThis.UI.todayISO()
        : this._SEED_ANCHOR;
    var delta = this._dayDiff(this._SEED_ANCHOR, today);
    if (delta) {
      data = this._rebaseSeedDates(data, delta);
    }
    if (globalThis.UI) {
      globalThis.UI.SCHEDULE_START = today;
      globalThis.UI.MOCK_DATE = globalThis.UI.addDays(today, -1);
    }
    return data;
  },

  _write(data) {
    this._cache = data;
    this._clearLookupMaps();
  },

  /**
   * Overlay live Imaging Scheduler data from ngauge.
   * Live patients/services/setups replace seed when provided; bookings use setLiveBookings.
   */
  setLiveQueue(payload) {
    var next = payload || {};
    var liveSetups = Array.isArray(next.setups) ? next.setups.slice() : [];
    this._liveQueue = {
      requests: Array.isArray(next.requests) ? next.requests.slice() : [],
      patients: Array.isArray(next.patients) ? next.patients.slice() : [],
      services: Array.isArray(next.services) ? next.services.slice() : [],
      setups: liveSetups,
    };
    // Keep seed cache in sync so any getAll().setups readers see backend Setup List.
    if (liveSetups.length && this._cache) {
      this._cache.setups = liveSetups.slice();
    }
    this._clearLookupMaps();
    return this._liveQueue;
  },

  clearLiveQueue() {
    this._liveQueue = null;
    this._clearLookupMaps();
  },

  /**
   * Overlay live beds inventory from ngauge hosp_beds.
   */
  setLiveBedsInventory(payload) {
    var next = payload || {};
    this._liveBedsInventory = {
      beds: Array.isArray(next.beds) ? next.beds.slice() : [],
      wards: Array.isArray(next.wards) ? next.wards.slice() : [],
      departments: Array.isArray(next.departments)
        ? next.departments.slice()
        : [],
    };
    if (this._liveBedsInventory.beds.length && this._cache) {
      this._cache.beds = this._liveBedsInventory.beds.slice();
      this._cache.wards = this._liveBedsInventory.wards.slice();
      this._cache.departments = this._liveBedsInventory.departments.slice();
    }
    this._clearLookupMaps();
    return this._liveBedsInventory;
  },

  clearLiveBedsInventory() {
    this._liveBedsInventory = null;
    this._clearLookupMaps();
  },

  hasLiveBedsInventory() {
    return Boolean(this._liveBedsInventory);
  },

  setLiveBedsQueue(payload) {
    var next = payload || {};
    this._liveBedsQueue = {
      bedRequests: Array.isArray(next.bedRequests) ? next.bedRequests.slice() : [],
      patients: Array.isArray(next.patients) ? next.patients.slice() : [],
      departments: Array.isArray(next.departments) ? next.departments.slice() : [],
      allotments: Array.isArray(next.allotments) ? next.allotments.slice() : [],
    };
    this._clearLookupMaps();
    return this._liveBedsQueue;
  },

  clearLiveBedsQueue() {
    this._liveBedsQueue = null;
    this._clearLookupMaps();
  },

  hasLiveBedsQueue() {
    return Boolean(this._liveBedsQueue);
  },

  hasLiveQueue() {
    return Boolean(this._liveQueue);
  },

  /**
   * Overlay live Assigned bookings.
   * @param {any[]} bookings
   * @param {"replace"|"merge"} [mode="replace"] Both modes show API Assigned only
   *   (no mock demo patients). Downs / operator leaves stay on seed events/leaves.
   *   merge is kept as an alias for day hydrate callers.
   */
  setLiveBookings(bookings, mode) {
    this._liveBookings = Array.isArray(bookings) ? bookings.slice() : [];
    this._liveBookingsMode = mode === "merge" ? "merge" : "replace";
    return this._liveBookings;
  },

  clearLiveBookings() {
    this._liveBookings = null;
    this._liveBookingsMode = "replace";
  },

  hasLiveBookings() {
    return this._liveBookings !== null;
  },

  /** Mark live-queue requests Assigned so they drop out of the Pending panel. */
  markLiveRequestsAssigned(requestIds) {
    if (!this._liveQueue || !Array.isArray(this._liveQueue.requests)) {
      return;
    }
    var idSet = {};
    (requestIds || []).forEach(function (id) {
      if (id) idSet[String(id)] = true;
    });
    this._liveQueue.requests.forEach(function (request) {
      if (idSet[request.id]) {
        request.status = "Assigned";
      }
    });
  },

  seed() {
    return this.getAll();
  },

  reset() {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("assignRequestId");
    }
    this._cache = null;
    this._liveQueue = null;
    this._liveBedsInventory = null;
    this._liveBedsQueue = null;
    this._liveBookings = null;
    this._liveBookingsMode = "replace";
    this._clearLookupMaps();
    return this.getAll();
  },

  getAll() {
    if (!this._cache) {
      this._cache = this._cloneSeed();
      this.syncData(this._cache);
    }
    return this._cache;
  },

  syncData(data) {
    if (!data.requests) {
      data.requests = [];
    }
    if (!data.bookings) {
      data.bookings = [];
    }
    if (!data.departments) {
      data.departments = [];
    }
    if (!data.wards) {
      data.wards = [];
    }
    if (!data.beds) {
      data.beds = [];
    }
    if (!data.bedRequests) {
      data.bedRequests = [];
    }
    if (!data.allotments) {
      data.allotments = [];
    }

    var changed = false;

    changed = this.repairDemoAssignedBooking(data) || changed;
    changed = this.repairDemoReschedulePlan(data) || changed;
    changed = this.syncBedAllotments(data) || changed;

    var requestById = {};
    var pendingOrphanKeys = {};
    var pendingRequestIds = {};
    data.requests.forEach(function (request) {
      requestById[request.id] = request;
      if (request.status === "Pending") {
        pendingRequestIds[request.id] = true;
        pendingOrphanKeys[
          request.patientId + "|" + request.serviceId + "|" + request.requestedDate
        ] = true;
      }
    });

    data.bookings = data.bookings.filter(function (booking) {
      if (!booking.requestId) {
        var orphanKey =
          booking.patientId + "|" + booking.serviceId + "|" + booking.date;
        if (pendingOrphanKeys[orphanKey]) {
          changed = true;
          return false;
        }
        return true;
      }

      var linkedRequest = requestById[booking.requestId];

      if (!linkedRequest || linkedRequest.status === "Cancelled" || linkedRequest.status === "Pending") {
        changed = true;
        return false;
      }

      return booking.status !== "Cancelled";
    });

    var bookingsBeforePendingPurge = data.bookings.length;
    data.bookings = data.bookings.filter(function (booking) {
      return !booking.requestId || !pendingRequestIds[booking.requestId];
    });
    if (data.bookings.length !== bookingsBeforePendingPurge) {
      changed = true;
    }

    var activeBookingRequestIds = {};
    data.bookings.forEach(function (booking) {
      if (booking.requestId && booking.status !== "Cancelled") {
        activeBookingRequestIds[booking.requestId] = true;
      }
    });

    data.requests.forEach(function (request) {
      if (request.status === "Assigned" && !activeBookingRequestIds[request.id]) {
        request.status = "Pending";
        changed = true;
      }
    });

    changed = this.repairDemoAssignedBooking(data) || changed;
    changed = this.repairInvalidBookingSlots(data) || changed;

    if (changed) {
      this._clearLookupMaps();
    }

    return data;
  },

  repairSeedPatients(data) {
    if (!globalThis.MOCK_DATA || !globalThis.MOCK_DATA.patients) {
      return false;
    }

    var seedPatients = globalThis.MOCK_DATA.patients;
    var changed = false;

    if (!data.patients) {
      data.patients = [];
      changed = true;
    }

    if (data.patients.length >= seedPatients.length) {
      // Seed was filtered down (e.g. 1000 → 100); replace so globalThis.UI matches MOCK_DATA.
      if (data.patients.length - seedPatients.length > 10) {
        data.patients = JSON.parse(JSON.stringify(seedPatients));
        return true;
      }
      return changed;
    }

    if (seedPatients.length - data.patients.length > 10) {
      data.patients = JSON.parse(JSON.stringify(seedPatients));
      return true;
    }

    var existingIds = {};
    data.patients.forEach(function (patient) {
      existingIds[patient.id] = true;
    });

    seedPatients.forEach(function (seedPatient) {
      if (!existingIds[seedPatient.id]) {
        data.patients.push(JSON.parse(JSON.stringify(seedPatient)));
        changed = true;
      }
    });

    return changed;
  },

  repairSeedRequests(data) {
    if (!globalThis.MOCK_DATA || !globalThis.MOCK_DATA.requests) {
      return false;
    }

    var seedRequests = globalThis.MOCK_DATA.requests;
    var changed = false;

    if (!data.requests) {
      data.requests = [];
      changed = true;
    }

    if (data.requests.length >= seedRequests.length) {
      if (data.requests.length - seedRequests.length > 10) {
        data.requests = JSON.parse(JSON.stringify(seedRequests));
        return true;
      }
      return changed;
    }

    if (seedRequests.length - data.requests.length > 10) {
      data.requests = JSON.parse(JSON.stringify(seedRequests));
      return true;
    }

    var existingIds = {};
    data.requests.forEach(function (request) {
      existingIds[request.id] = true;
    });

    seedRequests.forEach(function (seedRequest) {
      if (!existingIds[seedRequest.id]) {
        data.requests.push(JSON.parse(JSON.stringify(seedRequest)));
        changed = true;
      }
    });

    return changed;
  },

  repairSeedOperators(data) {
    if (!globalThis.MOCK_DATA || !globalThis.MOCK_DATA.operators) {
      return false;
    }

    var changed = false;

    if (!data.operators) {
      data.operators = [];
      changed = true;
    }

    globalThis.MOCK_DATA.operators.forEach(function (seedOperator) {
      var existing = data.operators.find(function (operator) {
        return operator.id === seedOperator.id;
      });

      if (!existing) {
        data.operators.push(JSON.parse(JSON.stringify(seedOperator)));
        changed = true;
        return;
      }

      ["name", "role", "designation", "initials", "avatarColor"].forEach(function (key) {
        if (seedOperator[key] !== undefined && existing[key] !== seedOperator[key]) {
          existing[key] = seedOperator[key];
          changed = true;
        }
      });
    });

    return changed;
  },

  repairSeedServices(data) {
    if (!globalThis.MOCK_DATA || !globalThis.MOCK_DATA.services) {
      return false;
    }

    var changed = false;

    if (!data.services) {
      data.services = JSON.parse(JSON.stringify(globalThis.MOCK_DATA.services));
      return true;
    }

    globalThis.MOCK_DATA.services.forEach(function (seedService) {
      var existing = data.services.find(function (service) {
        return service.id === seedService.id;
      });

      if (!existing) {
        data.services.push(JSON.parse(JSON.stringify(seedService)));
        changed = true;
        return;
      }

      ["name", "type", "lead", "procedure", "lag", "active"].forEach(function (key) {
        if (seedService[key] !== undefined && existing[key] !== seedService[key]) {
          existing[key] = seedService[key];
          changed = true;
        }
      });
    });

    return changed;
  },

  repairSeedSetups(data) {
    if (!globalThis.MOCK_DATA || !globalThis.MOCK_DATA.setups) {
      return false;
    }

    var changed = false;

    if (!data.setups) {
      data.setups = [];
      changed = true;
    }

    globalThis.MOCK_DATA.setups.forEach(function (seedSetup) {
      var existing = data.setups.find(function (setup) {
        return setup.id === seedSetup.id;
      });

      if (!existing) {
        data.setups.push(JSON.parse(JSON.stringify(seedSetup)));
        changed = true;
        return;
      }

      [
        "name",
        "serviceId",
        "equipmentLabel",
        "status",
        "location",
        "defaultOperatorId",
        "defaultOperatorName",
      ].forEach(function (key) {
        if (seedSetup[key] !== undefined && existing[key] !== seedSetup[key]) {
          existing[key] = seedSetup[key];
          changed = true;
        }
      });
    });

    return changed;
  },

  repairSeedBookings(data) {
    if (!globalThis.MOCK_DATA || !globalThis.MOCK_DATA.bookings) {
      return false;
    }

    var changed = false;

    if (!data.bookings) {
      data.bookings = [];
      changed = true;
    }

    globalThis.MOCK_DATA.bookings.forEach(function (seedBooking) {
      if (seedBooking.id === "bk-001") {
        return;
      }

      var existing = data.bookings.find(function (booking) {
        return booking.id === seedBooking.id;
      });

      if (!existing) {
        data.bookings.push(JSON.parse(JSON.stringify(seedBooking)));
        changed = true;
      } else {
        ["operatorId", "operatorName", "startTime", "setupId"].forEach(function (key) {
          if (seedBooking[key] && existing[key] !== seedBooking[key]) {
            existing[key] = seedBooking[key];
            changed = true;
          }
        });
      }
    });

    return changed;
  },

  repairInvalidBookingSlots(data) {
    if (typeof globalThis.ScheduleTimeline === "undefined" || typeof globalThis.SchedulerSlots === "undefined") {
      return false;
    }

    var self = this;
    var changed = false;

    data.bookings.forEach(function (booking) {
      if (!booking.date || !booking.setupId || !booking.startTime || booking.status === "Cancelled") {
        return;
      }

      var service = self.getService(booking.serviceId);
      var setup = self.getSetup(booking.setupId);
      if (!service || !setup) {
        return;
      }

      var start = globalThis.SchedulerSlots.toMinutes(booking.startTime);
      var end = start + globalThis.SchedulerSlots.blockMinutes(service);
      var span = { start: start, end: end };
      if (
        globalThis.ScheduleTimeline.isSlotOperationallyOpen(booking.setupId, booking.date, start, end) &&
        !globalThis.SchedulerSlots.overlapsBreak(span)
      ) {
        return;
      }

      var dayBookings = data.bookings.filter(function (item) {
        return item.date === booking.date && item.status !== "Cancelled" && item.id !== booking.id;
      });
      var candidateSetups = self.getSetups().filter(function (item) {
        return item.status === "Active" && item.serviceId === service.id;
      });
      var slots = globalThis.SchedulerSlots.availableSlots(
        candidateSetups,
        booking.date,
        service,
        dayBookings,
        booking.requestId || null
      );

      if (!slots.length) {
        return;
      }

      var slot = slots[0];
      var nextSetup = self.getSetup(slot.setupId);
      if (booking.setupId !== slot.setupId) {
        booking.setupId = slot.setupId;
        changed = true;
      }
      if (booking.startTime !== slot.startTime) {
        booking.startTime = slot.startTime;
        changed = true;
      }
      if (nextSetup && nextSetup.defaultOperatorId) {
        var operator = self.getOperator(nextSetup.defaultOperatorId);
        if (operator) {
          if (booking.operatorId !== operator.id) {
            booking.operatorId = operator.id;
            changed = true;
          }
          if (booking.operatorName !== operator.name) {
            booking.operatorName = operator.name;
            changed = true;
          }
        }
      }
    });

    return changed;
  },

  repairDemoAssignedBooking(data) {
    if (!globalThis.MOCK_DATA || !globalThis.MOCK_DATA.bookings) {
      return false;
    }

    var seedBooking = globalThis.MOCK_DATA.bookings.find(function (booking) {
      return booking.id === "bk-001";
    });
    var seedRequest = globalThis.MOCK_DATA.requests.find(function (request) {
      return request.id === "req-003";
    });

    if (!seedBooking || !seedRequest) {
      return false;
    }

    var changed = false;
    var request = data.requests.find(function (item) {
      return item.id === seedRequest.id;
    });

    if (!request || request.status === "Cancelled") {
      return false;
    }

    if (request.status !== "Assigned") {
      request.status = "Assigned";
      changed = true;
    }

    if (request.requestedDate !== seedRequest.requestedDate) {
      request.requestedDate = seedRequest.requestedDate;
      changed = true;
    }

    var booking =
      data.bookings.find(function (item) {
        return item.id === seedBooking.id;
      }) ||
      data.bookings.find(function (item) {
        return item.requestId === seedRequest.id && item.status !== "Cancelled";
      });

    if (!booking) {
      data.bookings.push(JSON.parse(JSON.stringify(seedBooking)));
      changed = true;
    } else {
      if (booking.id !== seedBooking.id) {
        booking.id = seedBooking.id;
        changed = true;
      }
      ["requestId", "date", "startTime", "setupId", "patientId", "serviceId", "status", "operatorId", "operatorName"].forEach(function (key) {
        if (booking[key] !== seedBooking[key]) {
          booking[key] = seedBooking[key];
          changed = true;
        }
      });
    }

    return changed;
  },

  repairDemoReschedulePlan(data) {
    if (!globalThis.MOCK_DATA || !globalThis.MOCK_DATA.reschedulePlans) {
      return false;
    }

    var seedPlan = globalThis.MOCK_DATA.reschedulePlans.find(function (plan) {
      return plan.id === "plan-demo";
    });
    var seedEvent = globalThis.MOCK_DATA.events && globalThis.MOCK_DATA.events.find(function (event) {
      return event.id === "evt-demo";
    });

    if (!seedPlan || !seedEvent) {
      return false;
    }

    var changed = false;

    if (!data.events) {
      data.events = [];
      changed = true;
    }
    if (!data.reschedulePlans) {
      data.reschedulePlans = [];
      changed = true;
    }

    var existingEvent = data.events.find(function (event) {
      return event.id === seedEvent.id;
    });
    var existingPlan = data.reschedulePlans.find(function (plan) {
      return plan.id === seedPlan.id;
    });

    if (!existingEvent) {
      data.events.push(JSON.parse(JSON.stringify(seedEvent)));
      existingEvent = data.events[data.events.length - 1];
      changed = true;
    }

    if (!existingPlan) {
      data.reschedulePlans.push(JSON.parse(JSON.stringify(seedPlan)));
      existingPlan = data.reschedulePlans[data.reschedulePlans.length - 1];
      changed = true;
    }

    if (existingEvent && existingEvent.planId !== seedPlan.id) {
      existingEvent.planId = seedPlan.id;
      changed = true;
    }
    if (existingPlan && existingPlan.eventId !== seedEvent.id) {
      existingPlan.eventId = seedEvent.id;
      changed = true;
    }

    return changed;
  },

  getServices() {
    if (this._liveQueue && this._liveQueue.services && this._liveQueue.services.length) {
      return Object.values(this.getServiceMap());
    }
    return this.getAll().services;
  },

  getServiceMap() {
    if (!this._serviceMap) {
      var map = {};
      (this.getAll().services || []).forEach(function (service) {
        if (service && service.id) {
          map[service.id] = service;
        }
      });
      if (this._liveQueue && this._liveQueue.services) {
        this._liveQueue.services.forEach(function (service) {
          if (service && service.id) {
            map[service.id] = service;
          }
        });
      }
      this._serviceMap = map;
    }
    return this._serviceMap;
  },

  getService(id) {
    return this.getServiceMap()[id] ?? null;
  },

  isServiceNameTaken(name, excludeId) {
    const normalized = name.trim().toLowerCase();
    return this.getServices().some(function (service) {
      return service.name.trim().toLowerCase() === normalized && service.id !== excludeId;
    });
  },

  generateServiceId(name) {
    let base =
      "svc-" +
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    if (!base || base === "svc-") {
      base = "svc-new";
    }
    let id = base;
    let suffix = 2;
    while (this.getService(id)) {
      id = base + "-" + suffix;
      suffix += 1;
    }
    return id;
  },

  saveService(service) {
    const data = this.getAll();
    const index = data.services.findIndex(function (item) {
      return item.id === service.id;
    });
    if (index >= 0) {
      data.services[index] = service;
    } else {
      data.services.push(service);
    }
    this._write(data);
    return service;
  },

  getSetups() {
    // While Imaging live queue is active, never fall back to mock seed setups.
    if (this._liveQueue) {
      return Array.isArray(this._liveQueue.setups) ? this._liveQueue.setups : [];
    }
    return this.getAll().setups || [];
  },

  getSetup(id) {
    return this.getSetups().find(function (setup) {
      return setup.id === id;
    }) ?? null;
  },

  getOperators() {
    return this.getAll().operators || [];
  },

  getOperator(id) {
    return this.getOperators().find(function (operator) {
      return operator.id === id;
    }) ?? null;
  },

  getOperatorLeaves() {
    var data = this.getAll();
    if (!data.operatorLeaves) {
      data.operatorLeaves = [];
    }
    return data.operatorLeaves;
  },

  getOperatorLeavesForDate(date) {
    return this.getOperatorLeaves().filter(function (leave) {
      return leave.effectiveFrom <= date && leave.effectiveTo >= date;
    });
  },

  isOperatorOnLeave(operatorId, date) {
    if (!operatorId) {
      return false;
    }
    return this.getOperatorLeavesForDate(date).some(function (leave) {
      return leave.operatorId === operatorId;
    });
  },

  getSetupsDownOnDate(date) {
    var byId = {};
    var self = this;

    this.getSetups().forEach(function (setup) {
      if (setup.status === "Under Maintenance") {
        byId[setup.id] = setup;
      }
    });

    this.getEventsForDate(date).forEach(function (event) {
      if (event.type === "setup_down" && event.setupId) {
        var setup = self.getSetup(event.setupId);
        if (setup) {
          byId[setup.id] = setup;
        }
      }
    });

    return Object.keys(byId)
      .map(function (id) {
        return byId[id];
      })
      .sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });
  },

  getOperatorsUnavailableOnDate(date) {
    var byId = {};
    var self = this;

    this.getOperatorLeavesForDate(date).forEach(function (leave) {
      var operator = self.getOperator(leave.operatorId);
      if (operator) {
        byId[operator.id] = operator;
      }
    });

    this.getSetupsDownOnDate(date).forEach(function (setup) {
      if (setup.defaultOperatorId) {
        var operator = self.getOperator(setup.defaultOperatorId);
        if (operator) {
          byId[operator.id] = operator;
        }
      }
    });

    return Object.keys(byId)
      .map(function (id) {
        return byId[id];
      })
      .sort(function (a, b) {
        return self.getOperatorDisplayName(a).localeCompare(self.getOperatorDisplayName(b));
      });
  },

  operatorInitials(name) {
    if (!name) {
      return "??";
    }
    return this.formatOperatorName(name)
      .split(/\s+/)
      .map(function (part) {
        return part.charAt(0);
      })
      .join("")
      .slice(0, 2)
      .toUpperCase();
  },

  formatOperatorName(name) {
    if (!name) {
      return "";
    }
    return name.replace(/^(Dr\.|Tech\.)\s*/i, "").trim();
  },

  getOperatorDisplayName(operator) {
    if (!operator) {
      return "";
    }
    return this.formatOperatorName(operator.name);
  },

  getOperatorDesignation(operator) {
    if (!operator) {
      return "";
    }
    return "Operator";
  },

  resolveBookingOperator(booking) {
    if (!booking) {
      return null;
    }

    if (booking.operatorId) {
      var byId = this.getOperator(booking.operatorId);
      if (byId) {
        return byId;
      }
    }

    if (booking.operatorName) {
      var byName = this.getOperators().find(function (operator) {
        return operator.name === booking.operatorName;
      });
      if (byName) {
        return byName;
      }
      return {
        id: null,
        name: booking.operatorName,
        designation: "Operator",
        role: "Operator",
        initials: this.operatorInitials(booking.operatorName),
        avatarColor: "#868e96",
      };
    }

    var setup = this.getSetup(booking.setupId);
    if (setup && setup.defaultOperatorId) {
      var setupOperator = this.getOperator(setup.defaultOperatorId);
      if (setupOperator) {
        return setupOperator;
      }
    }

    if (setup && setup.defaultOperatorName) {
      return {
        id: setup.defaultOperatorId || null,
        name: setup.defaultOperatorName,
        designation: "Operator",
        role: "Operator",
        initials: this.operatorInitials(setup.defaultOperatorName),
        avatarColor: "#868e96",
      };
    }

    return null;
  },

  getBookingOperator(booking) {
    var operator = this.resolveBookingOperator(booking);
    return operator ? this.getOperatorDisplayName(operator) : "";
  },

  isSetupNameTaken(name, excludeId) {
    const normalized = name.trim().toLowerCase();
    return this.getSetups().some(function (setup) {
      return setup.name.trim().toLowerCase() === normalized && setup.id !== excludeId;
    });
  },

  generateSetupId(name) {
    let base =
      "setup-" +
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    if (!base || base === "setup-") {
      base = "setup-new";
    }
    let id = base;
    let suffix = 2;
    while (this.getSetup(id)) {
      id = base + "-" + suffix;
      suffix += 1;
    }
    return id;
  },

  saveSetup(setup) {
    const data = this.getAll();
    const index = data.setups.findIndex(function (item) {
      return item.id === setup.id;
    });
    if (index >= 0) {
      data.setups[index] = setup;
    } else {
      data.setups.push(setup);
    }
    this._write(data);
    return setup;
  },

  getPatients() {
    if (this._liveQueue && this._liveQueue.patients && this._liveQueue.patients.length) {
      return Object.values(this.getPatientMap());
    }
    if (
      this._liveBedsQueue &&
      this._liveBedsQueue.patients &&
      this._liveBedsQueue.patients.length
    ) {
      return Object.values(this.getPatientMap());
    }
    return this.getAll().patients || [];
  },

  getPatientMap() {
    if (!this._patientMap) {
      var map = {};
      (this.getAll().patients || []).forEach(function (patient) {
        if (patient && patient.id) {
          map[patient.id] = patient;
        }
      });
      if (this._liveQueue && this._liveQueue.patients) {
        this._liveQueue.patients.forEach(function (patient) {
          if (patient && patient.id) {
            map[patient.id] = patient;
            map[String(patient.id).toUpperCase()] = patient;
          }
        });
      }
      if (this._liveBedsQueue && this._liveBedsQueue.patients) {
        this._liveBedsQueue.patients.forEach(function (patient) {
          if (patient && patient.id) {
            map[patient.id] = patient;
            map[String(patient.id).toUpperCase()] = patient;
          }
        });
      }
      this._patientMap = map;
    }
    return this._patientMap;
  },

  getPatient(id) {
    if (id == null || id === "") {
      return null;
    }
    var key = String(id).trim();
    var map = this.getPatientMap();
    return map[key] ?? map[key.toUpperCase()] ?? null;
  },

  isMrnTaken(mrn, excludeId) {
    const normalized = mrn.trim().toUpperCase();
    return this.getPatients().some(function (patient) {
      return patient.mrn.trim().toUpperCase() === normalized && patient.id !== excludeId;
    });
  },

  generatePatientId(mrn) {
    let base =
      "pat-" +
      mrn
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    if (!base || base === "pat-") {
      base = "pat-new";
    }
    let id = base;
    let suffix = 2;
    while (this.getPatient(id)) {
      id = base + "-" + suffix;
      suffix += 1;
    }
    return id;
  },

  savePatient(patient) {
    const data = this.getAll();
    const index = data.patients.findIndex(function (item) {
      return item.id === patient.id;
    });
    if (index >= 0) {
      data.patients[index] = patient;
    } else {
      data.patients.push(patient);
    }
    this._write(data);
    return patient;
  },

  getRequests() {
    if (this._liveQueue && Array.isArray(this._liveQueue.requests)) {
      return this._liveQueue.requests;
    }
    return this.getAll().requests || [];
  },

  getRequest(id) {
    if (this._liveQueue && Array.isArray(this._liveQueue.requests)) {
      var live = this._liveQueue.requests.find(function (request) {
        return request.id === id;
      });
      if (live) {
        return live;
      }
    }
    return (
      (this.getAll().requests || []).find(function (request) {
        return request.id === id;
      }) ?? null
    );
  },

  getActiveRequests() {
    return this.getRequests().filter(function (request) {
      return request.status !== "Cancelled";
    });
  },

  saveRequest(request) {
    const data = this.getAll();
    if (!data.requests) {
      data.requests = [];
    }
    const index = data.requests.findIndex(function (item) {
      return item.id === request.id;
    });
    if (index >= 0) {
      data.requests[index] = request;
    } else {
      data.requests.push(request);
    }
    this._write(data);
    return request;
  },

  cancelRequest(id) {
    const request = this.getRequest(id);
    if (!request) {
      return null;
    }
    request.status = "Cancelled";
    return this.saveRequest(request);
  },

  generateRequestId() {
    var id = "req-" + String(Date.now()).slice(-6);
    var suffix = 1;
    var base = id;
    while (this.getRequest(id)) {
      id = base + "-" + suffix;
      suffix += 1;
    }
    return id;
  },

  getBookings() {
    if (this._liveBookings !== null) {
      // Live overlay on: API Assigned only.
      return this._liveBookings;
    }
    var seed = this.getAll().bookings || [];
    // Never paint mock demo patient cards (bk-*) on the board while waiting for
    // live hydrate. Downs / operator-away bands come from events/leaves, not bookings.
    return seed.filter(function (booking) {
      return !(booking && booking.patientId);
    });
  },

  getBooking(id) {
    return this.getBookings().find(function (booking) {
      return booking.id === id;
    }) ?? null;
  },

  resolveBooking(bookingId, options) {
    options = options || {};
    this.getAll();

    var id = bookingId || options.fallbackId || "";
    if (!id && typeof sessionStorage !== "undefined") {
      id = sessionStorage.getItem("selectedBookingId") || "";
    }

    if (id) {
      var direct = this.getBooking(id);
      if (direct) {
        return direct;
      }
    }

    if (options.date) {
      var dayBookings = this.getBookingsForDate(options.date);
      if (id) {
        var matched = dayBookings.find(function (booking) {
          return booking.id === id;
        });
        if (matched) {
          return matched;
        }
      }
      if (dayBookings.length === 1) {
        return dayBookings[0];
      }
    }

    var active = this.getBookings().filter(function (booking) {
      return booking.status !== "Cancelled";
    });
    if (active.length === 1) {
      return active[0];
    }

    return null;
  },

  getBookingsForDate(date) {
    return this.getBookings().filter(function (booking) {
      return booking.date === date && booking.status !== "Cancelled";
    });
  },

  generateBookingId() {
    var id = "bk-" + String(Date.now()).slice(-6);
    var suffix = 1;
    var base = id;
    while (this.getBooking(id)) {
      id = base + "-" + suffix;
      suffix += 1;
    }
    return id;
  },

  saveBooking(booking) {
    const data = this.getAll();
    if (!data.bookings) {
      data.bookings = [];
    }
    const index = data.bookings.findIndex(function (item) {
      return item.id === booking.id;
    });
    if (index >= 0) {
      data.bookings[index] = booking;
    } else {
      data.bookings.push(booking);
    }
    this._write(data);
    return booking;
  },

  assignRequest(requestId, setupId, date, startTime) {
    var data = this.getAll();
    var request = data.requests.find(function (item) {
      return item.id === requestId;
    });
    if (!request && this._liveQueue && Array.isArray(this._liveQueue.requests)) {
      var liveRequest = this._liveQueue.requests.find(function (item) {
        return item.id === requestId;
      });
      if (liveRequest) {
        request = Object.assign({}, liveRequest);
        data.requests.push(request);
        liveRequest.status = "Assigned";
      }
    }
    if (!request) {
      return null;
    }

    var existing = data.bookings.find(function (booking) {
      return booking.requestId === requestId && booking.status !== "Cancelled";
    });
    var setup = this.getSetup(setupId);
    var operator = setup && setup.defaultOperatorId ? this.getOperator(setup.defaultOperatorId) : null;
    if (!operator && setup && setup.defaultOperatorName) {
      operator = this.resolveBookingOperator({ setupId: setupId, operatorName: setup.defaultOperatorName });
    }
    var booking = {
      id: existing ? existing.id : this.generateBookingId(),
      requestId: requestId,
      patientId: request.patientId,
      serviceId: request.serviceId,
      setupId: setupId,
      date: date,
      startTime: startTime,
      status: "Scheduled",
      operatorId: operator && operator.id ? operator.id : undefined,
      operatorName: operator ? operator.name : setup && setup.defaultOperatorName ? setup.defaultOperatorName : undefined,
    };

    request.status = "Assigned";

    var index = data.bookings.findIndex(function (item) {
      return item.id === booking.id;
    });
    if (index >= 0) {
      data.bookings[index] = booking;
    } else {
      data.bookings.push(booking);
    }

    this._write(data);
    return booking;
  },

  updateBookingStatus(id, status) {
    var booking = this.getBooking(id);
    if (!booking) {
      return null;
    }
    booking.status = status;
    return this.saveBooking(booking);
  },

  cancelBooking(id) {
    var booking = this.getBooking(id);
    if (!booking) {
      return null;
    }
    booking.status = "Cancelled";
    this.saveBooking(booking);
    if (booking.requestId) {
      var request = this.getRequest(booking.requestId);
      if (request && request.status === "Assigned") {
        request.status = "Pending";
        this.saveRequest(request);
      }
    }
    return booking;
  },

  getEvents() {
    var data = this.getAll();
    if (!data.events) {
      data.events = [];
    }
    return data.events;
  },

  getEventsForDate(date) {
    return this.getEvents().filter(function (event) {
      if (event.date === date) {
        return true;
      }
      if (event.effectiveFrom && event.effectiveTo) {
        return event.effectiveFrom <= date && event.effectiveTo >= date;
      }
      return false;
    });
  },

  getEvent(id) {
    return this.getEvents().find(function (event) {
      return event.id === id;
    }) ?? null;
  },

  resolveEvent(eventId, options) {
    options = options || {};
    this.getAll();

    var id = eventId || options.fallbackId || "";
    if (!id && typeof sessionStorage !== "undefined") {
      id = sessionStorage.getItem("selectedEventId") || "";
    }

    if (id) {
      var direct = this.getEvent(id);
      if (direct) {
        return direct;
      }
    }

    var events = this.getEvents();
    if (events.length === 1) {
      return events[0];
    }

    if (id === "evt-demo") {
      return this.getEvent("evt-demo");
    }

    return null;
  },

  getReschedulePlans() {
    var data = this.getAll();
    if (!data.reschedulePlans) {
      data.reschedulePlans = [];
    }
    return data.reschedulePlans;
  },

  getReschedulePlan(id) {
    return this.getReschedulePlans().find(function (plan) {
      return plan.id === id;
    }) ?? null;
  },

  getReschedulePlanForEvent(eventId) {
    return (
      this.getReschedulePlans().find(function (plan) {
        return plan.eventId === eventId;
      }) ?? null
    );
  },

  generateEventId() {
    var id = "evt-" + String(Date.now()).slice(-6);
    var suffix = 1;
    var base = id;
    while (this.getEvent(id)) {
      id = base + "-" + suffix;
      suffix += 1;
    }
    return id;
  },

  generatePlanId() {
    var id = "plan-" + String(Date.now()).slice(-6);
    var suffix = 1;
    var base = id;
    while (this.getReschedulePlan(id)) {
      id = base + "-" + suffix;
      suffix += 1;
    }
    return id;
  },

  generateMoveId() {
    return "move-" + String(Date.now()) + "-" + Math.floor(Math.random() * 1000);
  },

  _saveEvent(event) {
    var data = this.getAll();
    if (!data.events) {
      data.events = [];
    }
    var index = data.events.findIndex(function (item) {
      return item.id === event.id;
    });
    if (index >= 0) {
      data.events[index] = event;
    } else {
      data.events.push(event);
    }
    this._write(data);
    return event;
  },

  _savePlan(plan) {
    var data = this.getAll();
    if (!data.reschedulePlans) {
      data.reschedulePlans = [];
    }
    var index = data.reschedulePlans.findIndex(function (item) {
      return item.id === plan.id;
    });
    if (index >= 0) {
      data.reschedulePlans[index] = plan;
    } else {
      data.reschedulePlans.push(plan);
    }
    this._write(data);
    return plan;
  },

  _bookingsOverlapSetupWindow(booking, setupId, date, startMin, endMin) {
    if (booking.setupId !== setupId || booking.date !== date || booking.status === "Cancelled") {
      return false;
    }
    var service = this.getService(booking.serviceId);
    if (!service || !globalThis.SchedulerSlots) {
      return false;
    }
    var span = globalThis.SchedulerSlots.bookingSpan(booking, service);
    return span.start < endMin && startMin < span.end;
  },

  _findAffectedBookings(payload) {
    var self = this;
    var bookings = this.getBookings().filter(function (booking) {
      return booking.status !== "Cancelled";
    });

    if (payload.type === "emergency") {
      var startMin = globalThis.SchedulerSlots.toMinutes(payload.startTime);
      var endMin = startMin + Number(payload.durationMinutes || 60);
      return bookings.filter(function (booking) {
        return self._bookingsOverlapSetupWindow(booking, payload.setupId, payload.date, startMin, endMin);
      });
    }

    return bookings.filter(function (booking) {
      if (booking.setupId !== payload.setupId) {
        return false;
      }
      return booking.date >= payload.effectiveFrom && booking.date <= payload.effectiveTo;
    });
  },

  declareEvent(payload) {
    var eventId = this.generateEventId();
    var planId = this.generatePlanId();
    var affected = this._findAffectedBookings(payload);
    var moves = affected.map(
      function (booking) {
        return {
          id: this.generateMoveId(),
        bookingId: booking.id,
        patientId: booking.patientId,
        oldSetupId: booking.setupId,
        oldDate: booking.date,
        oldStartTime: booking.startTime,
        newSetupId: null,
        newDate: null,
        newStartTime: null,
        status: "ManualReview",
        reason: payload.type === "emergency" ? "Emergency block on setup" : "Setup marked down",
        };
      }.bind(this)
    );

    var event = {
      id: eventId,
      type: payload.type,
      setupId: payload.setupId,
      date: payload.date || payload.effectiveFrom,
      startTime: payload.startTime || null,
      durationMinutes: payload.durationMinutes || null,
      effectiveFrom: payload.effectiveFrom || payload.date,
      effectiveTo: payload.effectiveTo || payload.date,
      reason: payload.reason || "",
      status: "Draft",
      planId: planId,
      createdAt: new Date().toISOString(),
    };

    var plan = {
      id: planId,
      eventId: eventId,
      status: "Draft",
      moves: moves,
      createdAt: event.createdAt,
    };

    if (payload.type === "setup_down") {
      var setup = this.getSetup(payload.setupId);
      if (setup) {
        setup.status = "Under Maintenance";
        this.saveSetup(setup);
      }
    }

    this._saveEvent(event);
    this._savePlan(plan);
    return { event: event, plan: plan };
  },

  getPlanMove(planId, moveId) {
    var plan = this.getReschedulePlan(planId);
    if (!plan) {
      return null;
    }
    return (
      plan.moves.find(function (move) {
        return move.id === moveId;
      }) ?? null
    );
  },

  hasUnresolvedMoves(plan) {
    if (!plan || !plan.moves.length) {
      return false;
    }
    return plan.moves.some(function (move) {
      return move.status === "ManualReview" || !move.newDate || !move.newStartTime || !move.newSetupId;
    });
  },

  updatePlanMove(planId, moveId, slot) {
    var plan = this.getReschedulePlan(planId);
    if (!plan) {
      return null;
    }
    var move = plan.moves.find(function (item) {
      return item.id === moveId;
    });
    if (!move) {
      return null;
    }
    move.newSetupId = slot.setupId;
    move.newDate = slot.date;
    move.newStartTime = slot.startTime;
    move.status = "Resolved";
    this._savePlan(plan);
    return move;
  },

  approvePlan(planId) {
    var plan = this.getReschedulePlan(planId);
    if (!plan || plan.status !== "Draft") {
      return null;
    }
    if (this.hasUnresolvedMoves(plan)) {
      return null;
    }

    var self = this;
    plan.moves.forEach(function (move) {
      var booking = self.getBooking(move.bookingId);
      if (!booking) {
        return;
      }
      booking.setupId = move.newSetupId;
      booking.date = move.newDate;
      booking.startTime = move.newStartTime;
      self.saveBooking(booking);
    });

    plan.status = "Approved";
    this._savePlan(plan);

    var event = this.getEvent(plan.eventId);
    if (event) {
      event.status = "Applied";
      this._saveEvent(event);
    }

    return plan;
  },

  rejectPlan(planId) {
    var plan = this.getReschedulePlan(planId);
    if (!plan || plan.status !== "Draft") {
      return null;
    }

    plan.status = "Rejected";
    this._savePlan(plan);

    var event = this.getEvent(plan.eventId);
    if (event) {
      event.status = "Rejected";
      this._saveEvent(event);

      if (event.type === "setup_down") {
        var setup = this.getSetup(event.setupId);
        if (setup && setup.status === "Under Maintenance") {
          setup.status = "Active";
          this.saveSetup(setup);
        }
      }
    }

    return plan;
  },

  syncBedAllotments(data) {
    var changed = false;
    var requestById = {};
    var pendingRequestIds = {};

    data.bedRequests.forEach(function (request) {
      requestById[request.id] = request;
      if (request.status === "Pending") {
        pendingRequestIds[request.id] = true;
      }
    });

    var before = data.allotments.length;
    data.allotments = data.allotments.filter(function (allotment) {
      if (allotment.status === "Cancelled") {
        return false;
      }
      if (!allotment.bedRequestId) {
        return true;
      }
      var linked = requestById[allotment.bedRequestId];
      if (!linked || linked.status === "Cancelled" || linked.status === "Pending") {
        changed = true;
        return false;
      }
      if (pendingRequestIds[allotment.bedRequestId]) {
        changed = true;
        return false;
      }
      return true;
    });
    if (data.allotments.length !== before) {
      changed = true;
    }

    var activeAllotmentRequestIds = {};
    data.allotments.forEach(function (allotment) {
      if (allotment.bedRequestId && allotment.status !== "Cancelled") {
        activeAllotmentRequestIds[allotment.bedRequestId] = true;
      }
    });

    data.bedRequests.forEach(function (request) {
      if (request.status === "Assigned" && !activeAllotmentRequestIds[request.id]) {
        request.status = "Pending";
        changed = true;
      }
    });

    return changed;
  },

  getDepartments() {
    var departments = [];
    var byId = {};

    function addDepartment(department) {
      if (!department || !department.id || byId[department.id]) {
        return;
      }
      byId[department.id] = department;
      departments.push(department);
    }

    if (
      this._liveBedsInventory &&
      Array.isArray(this._liveBedsInventory.departments)
    ) {
      this._liveBedsInventory.departments.forEach(addDepartment);
    }
    if (this._liveBedsQueue && Array.isArray(this._liveBedsQueue.departments)) {
      this._liveBedsQueue.departments.forEach(addDepartment);
    }
    if (departments.length) {
      return departments;
    }
    return this.getAll().departments || [];
  },

  getDepartment(id) {
    return (
      this.getDepartments().find(function (department) {
        return department.id === id;
      }) || null
    );
  },

  getWards() {
    if (
      this._liveBedsInventory &&
      Array.isArray(this._liveBedsInventory.wards)
    ) {
      return this._liveBedsInventory.wards;
    }
    return this.getAll().wards || [];
  },

  getWard(id) {
    return (
      this.getWards().find(function (ward) {
        return ward.id === id;
      }) || null
    );
  },

  getBeds() {
    if (
      this._liveBedsInventory &&
      Array.isArray(this._liveBedsInventory.beds)
    ) {
      return this._liveBedsInventory.beds;
    }
    return this.getAll().beds || [];
  },

  getBed(id) {
    return this.findBedByReference(id);
  },

  /** Match allocation bed_id to a live bed row (id, name, or bed-{slug} forms). */
  findBedByReference(referenceId) {
    var ref = String(referenceId == null ? "" : referenceId).trim();
    if (!ref) {
      return null;
    }

    var beds = this.getBeds();
    var lower = ref.toLowerCase();

    function slugify(label) {
      return String(label || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    function generatedId(name) {
      var slug = slugify(name);
      return "bed-" + (slug || "");
    }

    var bed = beds.find(function (item) {
      return item.id === ref;
    });
    if (bed) {
      return bed;
    }

    bed = beds.find(function (item) {
      return String(item.id).toLowerCase() === lower;
    });
    if (bed) {
      return bed;
    }

    bed = beds.find(function (item) {
      return item.name === ref || String(item.name || "").toLowerCase() === lower;
    });
    if (bed) {
      return bed;
    }

    bed = beds.find(function (item) {
      var generated = generatedId(item.name);
      return generated === ref || generated.toLowerCase() === lower;
    });
    if (bed) {
      return bed;
    }

    if (lower.indexOf("bed-") === 0) {
      var suffix = lower.slice(4);
      bed = beds.find(function (item) {
        return slugify(item.name) === suffix || slugify(item.id) === suffix;
      });
      if (bed) {
        return bed;
      }
    }

    return null;
  },

  getActiveBeds() {
    return this.getBeds().filter(function (bed) {
      return bed.status === "Active" || bed.status === "Under Maintenance";
    });
  },

  bedHasLiveAllotment(bedId) {
    var self = this;
    var bed = this.findBedByReference(bedId);
    if (!bed) {
      return false;
    }
    return this.getConfirmedAllotments().some(function (allotment) {
      if (allotment.status === "Cancelled") {
        return false;
      }
      var resolved = self.findBedByReference(allotment.bedId);
      return resolved && resolved.id === bed.id;
    });
  },

  getBedsGrouped() {
    var self = this;
    var departments = this.getDepartments()
      .slice()
      .sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });

    return departments
      .map(function (department) {
        var wards = self
          .getWards()
          .filter(function (ward) {
            return ward.departmentId === department.id && ward.status !== "Inactive";
          })
          .sort(function (a, b) {
            return a.name.localeCompare(b.name);
          })
          .map(function (ward) {
            var beds = self
              .getBeds()
              .filter(function (bed) {
                if (bed.wardId !== ward.id) {
                  return false;
                }
                if (bed.status === "Active" || bed.status === "Under Maintenance") {
                  return true;
                }
                return self.bedHasLiveAllotment(bed.id);
              })
              .sort(function (a, b) {
                return a.name.localeCompare(b.name);
              });
            return { ward: ward, beds: beds };
          })
          .filter(function (group) {
            return group.beds.length > 0;
          });

        return { department: department, wards: wards };
      })
      .filter(function (group) {
        return group.wards.length > 0;
      });
  },

  getBedRequests() {
    if (
      this._liveBedsQueue &&
      Array.isArray(this._liveBedsQueue.bedRequests)
    ) {
      return this._liveBedsQueue.bedRequests;
    }
    return this.getAll().bedRequests || [];
  },

  getBedRequest(id) {
    return (
      this.getBedRequests().find(function (request) {
        return request.id === id;
      }) || null
    );
  },

  getActiveBedRequests() {
    return this.getBedRequests().filter(function (request) {
      return request.status !== "Cancelled";
    });
  },

  /** Live queue: current_allocation_active rows with bed_id and staff_id both null. */
  getAwaitingBedRequests() {
    if (
      this._liveBedsQueue &&
      Array.isArray(this._liveBedsQueue.bedRequests)
    ) {
      return this._liveBedsQueue.bedRequests.slice();
    }
    return this.getActiveBedRequests().filter(function (request) {
      return request.status === "Pending";
    });
  },

  isNullishAllocationField(value) {
    if (value === null || value === undefined) {
      return true;
    }
    var text = String(value).trim().toLowerCase();
    return text === "" || text === "null" || text === "undefined";
  },

  allocationIsConfirmed(allotment) {
    return (
      allotment && !this.isNullishAllocationField(allotment.bedId)
    );
  },

  /** Live timeline: allocations with a bed assigned (staff optional). */
  getConfirmedAllotments() {
    var self = this;
    var list;
    if (
      this._liveBedsQueue &&
      Array.isArray(this._liveBedsQueue.allotments)
    ) {
      list = this._liveBedsQueue.allotments;
    } else {
      list = this.getAll().allotments || [];
    }
    return list.filter(function (allotment) {
      if (allotment.status === "Cancelled") {
        return false;
      }
      return self.allocationIsConfirmed(allotment);
    });
  },

  getAllotments() {
    if (
      this._liveBedsQueue &&
      Array.isArray(this._liveBedsQueue.allotments)
    ) {
      return this._liveBedsQueue.allotments;
    }
    return this.getAll().allotments || [];
  },

  getAllotment(id) {
    return (
      this.getAllotments().find(function (allotment) {
        return allotment.id === id;
      }) || null
    );
  },

  getAllotmentsForBed(bedId) {
    var self = this;
    var bed = this.findBedByReference(bedId);
    var source = this.hasLiveBedsQueue()
      ? this.getConfirmedAllotments()
      : this.getAllotments();
    return source.filter(function (allotment) {
      if (allotment.status === "Cancelled") {
        return false;
      }
      if (!bed) {
        return allotment.bedId === bedId;
      }
      var resolved = self.findBedByReference(allotment.bedId);
      return resolved && resolved.id === bed.id;
    });
  },

  getAllotmentsInRange(startDate, endDate) {
    var source = this.hasLiveBedsQueue()
      ? this.getConfirmedAllotments()
      : this.getAllotments();
    return source.filter(function (allotment) {
      if (allotment.status === "Cancelled") {
        return false;
      }
      return allotment.admitDate < endDate && allotment.dischargeDate > startDate;
    });
  },

  generateAllotmentId() {
    var id = "allot-" + String(Date.now()).slice(-6);
    var suffix = 1;
    var base = id;
    while (this.getAllotment(id)) {
      id = base + "-" + suffix;
      suffix += 1;
    }
    return id;
  },

  assignBedRequest(bedRequestId, bedId, admitDate, startTime) {
    var data = this.getAll();
    var request = data.bedRequests.find(function (item) {
      return item.id === bedRequestId;
    });
    if (!request) {
      return null;
    }

    var isHourly = request.bookingMode === "Hourly";
    var expectedDays = isHourly ? 1 : request.expectedDays || 1;
    var dischargeDate;
    if (typeof globalThis.BedSlots !== "undefined" && globalThis.BedSlots.addDays) {
      dischargeDate = globalThis.BedSlots.addDays(admitDate, expectedDays);
    } else {
      var parts = admitDate.split("-");
      var date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      date.setDate(date.getDate() + expectedDays);
      dischargeDate =
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0");
    }

    var existing = data.allotments.find(function (allotment) {
      return allotment.bedRequestId === bedRequestId && allotment.status !== "Cancelled";
    });

    var allotment = {
      id: existing ? existing.id : this.generateAllotmentId(),
      bedRequestId: bedRequestId,
      patientId: request.patientId,
      bedId: bedId,
      admitDate: admitDate,
      dischargeDate: dischargeDate,
      status: "Scheduled",
      bookingMode: isHourly ? "Hourly" : "Daily",
    };

    if (isHourly && typeof globalThis.SchedulerSlots !== "undefined") {
      var duration = request.expectedMinutes || 120;
      var start = startTime || request.preferredStartTime || globalThis.SchedulerSlots.fromMinutes(globalThis.SchedulerSlots.DAY_START);
      var startMin = globalThis.SchedulerSlots.toMinutes(start);
      allotment.startTime = globalThis.SchedulerSlots.fromMinutes(startMin);
      allotment.endTime = globalThis.SchedulerSlots.fromMinutes(startMin + duration);
    }

    request.status = "Assigned";

    var index = data.allotments.findIndex(function (item) {
      return item.id === allotment.id;
    });
    if (index >= 0) {
      data.allotments[index] = allotment;
    } else {
      data.allotments.push(allotment);
    }

    this._write(data);
    return allotment;
  },
};

globalThis.Store = Store;
export { Store };
