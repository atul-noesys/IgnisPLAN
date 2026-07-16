/**
 * =============================================================================
 * Imaging Scheduler — Slot Suggestion / Bulk Allocation Algorithm
 * =============================================================================
 *
 * Source of truth in the app:
 *   - schedule-timeline.js  (queue order, pickSlot, planBulkAssignments)
 *   - slots.js              (day window, break, free-slot enumeration)
 *
 * This file is a readable, commented reference of that algorithm in plain JS.
 * It is NOT wired into the runtime; use it for docs / review / porting.
 *
 * Day rules
 * ---------
 *   Operating day : 08:00 – 18:00
 *   Slot step     : 15 minutes
 *   Lunch break   : 13:00 – 14:00  (no booking may overlap)
 *   Block length  : service.lead + service.procedure + service.lag
 *   Compatible setup = status "Active" AND setup.serviceId === service.id
 *
 * High-level flow
 * ---------------
 *   1. Build Pending queue, drop already-booked patients/requests for the day
 *   2. Sort by priority (Critical > High > Medium > Low, + Inpatient boost)
 *   3. For each selected request (in that order):
 *        a. Enumerate free slots on compatible setups
 *        b. Prefer slots in preferredWindow (Morning / Afternoon); else all
 *        c. Score slots (prefer earlier in preferred window)
 *        d. Take the highest-scoring slot
 *        e. Tentatively reserve it so the next patient cannot reuse it
 *   4. On Confirm: persist Assigned via allocatePatients API + local booking
 * =============================================================================
 */

/** Day clock (minutes from midnight). */
const DAY_START = 8 * 60; // 08:00
const DAY_END = 18 * 60; // 18:00
const STEP = 15;
const AFTERNOON_START = 12 * 60; // 12:00
const BREAK_START = 13 * 60; // 13:00
const BREAK_END = 14 * 60; // 14:00

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

/** "HH:MM" → minutes from midnight */
function toMinutes(time) {
  const parts = String(time).split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/** minutes from midnight → "HH:MM" */
function fromMinutes(mins) {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
}

/** Half-open overlap: [a.start, a.end) vs [b.start, b.end) */
function overlaps(spanA, spanB) {
  return spanA.start < spanB.end && spanB.start < spanA.end;
}

/** Total occupied minutes for a service block (lead + procedure + lag). */
function blockMinutes(service) {
  return service.lead + service.procedure + service.lag;
}

function bookingSpan(booking, service) {
  const start = toMinutes(booking.startTime);
  return { start: start, end: start + blockMinutes(service) };
}

function isMorningStart(startMinutes) {
  return startMinutes < AFTERNOON_START;
}

function isAfternoonStart(startMinutes) {
  return startMinutes >= AFTERNOON_START;
}

/**
 * Does this start time match the request's preferred window?
 * Custom / empty → any time is fine.
 */
function matchesPreferredWindow(startMinutes, preferredWindow) {
  if (!preferredWindow || String(preferredWindow).indexOf("Custom") === 0) {
    return true;
  }
  if (preferredWindow === "Morning") return isMorningStart(startMinutes);
  if (preferredWindow === "Afternoon") return isAfternoonStart(startMinutes);
  return true;
}

// ---------------------------------------------------------------------------
// 1) Patient / queue priority
// ---------------------------------------------------------------------------

/**
 * Higher score = schedule earlier in bulk allocate.
 *
 *   Critical  +150
 *   High      +100
 *   Medium/Moderate +50
 *   else      +10
 *   Inpatient / IPD  +20
 */
function patientPriorityScore(patient) {
  if (!patient) return 0;

  let score = 0;
  const severity = String(patient.severity || "").toLowerCase();

  if (severity === "critical") score += 150;
  else if (severity === "high") score += 100;
  else if (severity === "medium" || severity === "moderate") score += 50;
  else score += 10;

  const patientType = String(patient.patientType || "").toLowerCase();
  if (patientType === "ipd" || patientType === "inpatient") {
    score += 20;
  }

  return score;
}

/**
 * Pending requests only, excluding anyone already booked on this day.
 * Sorted: highest patientPriorityScore first, then request id.
 *
 * @param {Array} requests   diagnostic requests
 * @param {Object} patientMap patientId → patient
 * @param {Array} dayBookings bookings for scheduleDate (non-cancelled matter)
 */
function orderedQueue(requests, patientMap, dayBookings) {
  const bookedPatient = {};
  const bookedRequest = {};

  dayBookings.forEach(function (booking) {
    if (booking.status === "Cancelled") return;
    if (booking.patientId) bookedPatient[booking.patientId] = true;
    if (booking.requestId) bookedRequest[booking.requestId] = true;
  });

  return requests
    .filter(function (request) {
      return (
        (request.status === "Pending" || request.status === "Re-Scheduled") &&
        !bookedPatient[request.patientId] &&
        !bookedRequest[request.id]
      );
    })
    .sort(function (a, b) {
      const scoreDiff =
        patientPriorityScore(patientMap[b.patientId]) -
        patientPriorityScore(patientMap[a.patientId]);
      if (scoreDiff !== 0) return scoreDiff;
      return String(a.id).localeCompare(String(b.id));
    });
}

// ---------------------------------------------------------------------------
// 2) Free-slot enumeration
// ---------------------------------------------------------------------------

/**
 * True if [startMin, startMin+block) is free on this setup for the date.
 * Rejects: outside day, overlaps lunch break, overlaps an existing booking.
 *
 * @param {Function} getService  booking.serviceId → service (for block length)
 */
function isSlotFree(setupId, date, startMin, service, bookings, getService) {
  const candidate = {
    start: startMin,
    end: startMin + blockMinutes(service),
  };

  if (startMin < DAY_START || candidate.end > DAY_END) return false;
  if (overlaps(candidate, { start: BREAK_START, end: BREAK_END })) return false;

  for (let i = 0; i < bookings.length; i++) {
    const booking = bookings[i];
    if (
      booking.setupId !== setupId ||
      booking.date !== date ||
      booking.status === "Cancelled"
    ) {
      continue;
    }
    const bookingService = getService(booking.serviceId);
    if (!bookingService) continue;
    if (overlaps(candidate, bookingSpan(booking, bookingService))) {
      return false;
    }
  }

  return true;
}

/**
 * All free start times on Active setups that offer this service.
 * Walks each setup from DAY_START … DAY_END in STEP increments.
 *
 * @returns {Array<{ setupId, startMinutes, startTime }>}
 */
function availableSlots(setups, date, service, bookings, getService) {
  const compatible = setups.filter(function (setup) {
    return setup.status === "Active" && setup.serviceId === service.id;
  });

  const slots = [];
  const block = blockMinutes(service);

  compatible.forEach(function (setup) {
    for (let t = DAY_START; t <= DAY_END - block; t += STEP) {
      if (isSlotFree(setup.id, date, t, service, bookings, getService)) {
        slots.push({
          setupId: setup.id,
          startMinutes: t,
          startTime: fromMinutes(t),
        });
      }
    }
  });

  return slots;
}

// ---------------------------------------------------------------------------
// 3) Slot scoring (preferred window)
// ---------------------------------------------------------------------------

/**
 * Score a candidate slot for a preferred window.
 * Higher = better suggestion.
 *
 * Morning   : +200 if morning, plus (AFTERNOON_START - start) → earlier morning wins
 * Afternoon : +200 if afternoon, plus (DAY_END - start) → earlier afternoon wins
 * Other     : +100 - startMinutes → earlier in the day wins
 */
function scoreSuggestedSlot(slot, preferredWindow) {
  let score = 0;

  if (preferredWindow === "Morning") {
    if (isMorningStart(slot.startMinutes)) {
      score += 200;
      score += AFTERNOON_START - slot.startMinutes;
    }
  } else if (preferredWindow === "Afternoon") {
    if (isAfternoonStart(slot.startMinutes)) {
      score += 200;
      score += DAY_END - slot.startMinutes;
    }
  } else {
    score += 100;
    score -= slot.startMinutes;
  }

  return score;
}

// ---------------------------------------------------------------------------
// 4) Pick best slot for one request
// ---------------------------------------------------------------------------

/**
 * 1. List free slots for the request's service
 * 2. Prefer those matching preferredWindow (if any); else use all free slots
 * 3. Return the slot with the highest scoreSuggestedSlot
 *
 * @returns {object|null} slot or null if nothing free
 */
function pickSlotForRequest(request, scheduleDate, bookings, deps) {
  const service = deps.getService(request.serviceId);
  if (!service) return null;

  const slots = availableSlots(
    deps.getActiveSetups(),
    scheduleDate,
    service,
    bookings,
    deps.getService,
  );
  if (!slots.length) return null;

  const preferred = request.preferredWindow;
  const matching = slots.filter(function (slot) {
    return matchesPreferredWindow(slot.startMinutes, preferred);
  });
  const pool = matching.length ? matching : slots;

  const ranked = pool
    .map(function (slot) {
      return { slot: slot, score: scoreSuggestedSlot(slot, preferred) };
    })
    .sort(function (a, b) {
      return b.score - a.score;
    });

  return ranked[0].slot;
}

// ---------------------------------------------------------------------------
// 5) Bulk allocate (greedy)
// ---------------------------------------------------------------------------

/**
 * Greedy bulk allocation for Imaging Scheduler "Allocate" preview.
 *
 * Algorithm:
 *   - Order selected Pending requests by severity / inpatient priority
 *   - Walk in that order; for each, pickSlotForRequest against a working
 *     bookings copy
 *   - On success, push a tentative booking so later patients cannot collide
 *   - Collect placements (request + slot); count skipped when no slot found
 *
 * Confirm step (app):
 *   - UPDATE hosp_diagnostic_requests SET status = 'Assigned' …
 *   - Local Store.assignRequest for each placement (timeline board)
 *
 * @param {string} scheduleDate  YYYY-MM-DD
 * @param {string[]} selectedRequestIds  checkbox selection (required for allocate)
 * @param {object} deps
 *   getPendingRequests(), getPatientMap(), getBookings(date),
 *   getService(id), getActiveSetups(), getPatient(id)
 */
function planBulkAssignments(scheduleDate, selectedRequestIds, deps) {
  let requests = orderedQueue(
    deps.getPendingRequests(),
    deps.getPatientMap(),
    deps.getBookings(scheduleDate),
  );

  if (selectedRequestIds && selectedRequestIds.length) {
    const selected = {};
    selectedRequestIds.forEach(function (id) {
      selected[id] = true;
    });
    requests = requests.filter(function (request) {
      return selected[request.id];
    });
  }

  // Working copy: tentative reservations accumulate here
  const bookings = deps.getBookings(scheduleDate).slice();
  const placements = [];
  let skipped = 0;

  requests.forEach(function (request) {
    const slot = pickSlotForRequest(request, scheduleDate, bookings, deps);
    if (!slot) {
      skipped += 1;
      return;
    }

    placements.push({
      request: request,
      patient: deps.getPatient(request.patientId),
      service: deps.getService(request.serviceId),
      slot: slot,
    });

    // Reserve so the next request cannot take the same setup/time
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
}

// ---------------------------------------------------------------------------
// Exports (Node / bundler). Browser: attach to globalThis if needed.
// ---------------------------------------------------------------------------

const ImagingAllocateAlgorithm = {
  DAY_START: DAY_START,
  DAY_END: DAY_END,
  STEP: STEP,
  AFTERNOON_START: AFTERNOON_START,
  BREAK_START: BREAK_START,
  BREAK_END: BREAK_END,
  toMinutes: toMinutes,
  fromMinutes: fromMinutes,
  overlaps: overlaps,
  blockMinutes: blockMinutes,
  patientPriorityScore: patientPriorityScore,
  orderedQueue: orderedQueue,
  isSlotFree: isSlotFree,
  availableSlots: availableSlots,
  matchesPreferredWindow: matchesPreferredWindow,
  scoreSuggestedSlot: scoreSuggestedSlot,
  pickSlotForRequest: pickSlotForRequest,
  planBulkAssignments: planBulkAssignments,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ImagingAllocateAlgorithm;
}

if (typeof globalThis !== "undefined") {
  globalThis.ImagingAllocateAlgorithm = ImagingAllocateAlgorithm;
}
