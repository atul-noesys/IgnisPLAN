import { SchedulerSlots, Store } from "@/lib/prototype";
import type { DiagnosticRequest } from "@/hooks/useDiagnosticRequests";

/** Infer MRI / CT / X-Ray from service id when catalog row is missing. */
export function inferServiceType(serviceId?: string): string {
  const id = String(serviceId || "").toLowerCase();
  if (id.includes("xray") || id.includes("x-ray")) return "X-Ray";
  if (id.includes("ct")) return "CT";
  if (id.includes("mri")) return "MRI";
  return "";
}

type StoreBooking = {
  id: string;
  requestId: string;
  patientId: string;
  serviceId: string;
  setupId: string;
  date: string;
  startTime: string;
  status: string;
  operatorId: string;
  operatorName: string;
};

type SlotPick = { setupId: string; startTime: string };

/** Timeline board only shows Assigned requests that still have a setup_id. */
export function isAssignedForTimeline(request: DiagnosticRequest): boolean {
  return (
    (request.status || "").trim() === "Assigned" &&
    Boolean((request.setupId || "").trim())
  );
}

/**
 * Occupied slots when placing live Assigned. Mock demo bookings are ignored so
 * API patients are not pushed around invisible hardcoded blocks; downs/leaves
 * are still honored via slot search against events/leaves.
 */
function seedBookingsForDate(_date: string): StoreBooking[] {
  return [];
}

/**
 * Place on the request's setup_id only — never auto-pick a compatible setup.
 * Uses requestedStartTime when present; otherwise finds a free slot on that setup.
 */
function pickSlotOnAssignedSetup(
  request: DiagnosticRequest,
  date: string,
  working: StoreBooking[],
): SlotPick | null {
  const setupId = (request.setupId || "").trim();
  if (!setupId) return null;

  const setup = Store.getSetup(setupId);
  if (!setup) return null;

  const fixedTime = (request.requestedStartTime || "").trim();
  if (fixedTime) {
    return { setupId, startTime: fixedTime };
  }

  const service = Store.getService(request.serviceId);
  if (!service) return null;

  const available = SchedulerSlots.availableSlots(
    [setup],
    date,
    service,
    working,
    request.id,
  ) as Array<{ setupId: string; startTime: string; startMinutes?: number }>;

  if (!available.length) return null;

  const preferred = request.preferredWindow;
  const matching = available.filter((slot) =>
    SchedulerSlots.matchesPreferredWindow(
      slot.startMinutes ?? 0,
      preferred,
    ),
  );
  const pool = matching.length ? matching : available;
  const slot = pool[0];
  if (!slot?.setupId || !slot?.startTime) return null;

  return { setupId: slot.setupId, startTime: slot.startTime };
}

function bookingFromSlot(
  request: DiagnosticRequest,
  date: string,
  slot: SlotPick,
): StoreBooking {
  const setup = Store.getSetup(slot.setupId);
  return {
    id: `live-bk-${request.id}`,
    requestId: request.id,
    patientId: request.patientId,
    serviceId: request.serviceId,
    setupId: slot.setupId,
    date,
    startTime: slot.startTime,
    status: "Scheduled",
    operatorId: setup?.defaultOperatorId || "",
    operatorName: setup?.defaultOperatorName || "",
  };
}

/**
 * Place live Assigned requests onto the timeline.
 * Only rows with status Assigned and a setup_id are painted on the board.
 */
export function toStoreBookingsFromAssigned(requests: DiagnosticRequest[]) {
  const sorted = [...requests]
    .filter(isAssignedForTimeline)
    .sort((a, b) => {
      const byDate = String(a.requestedDate || "").localeCompare(
        String(b.requestedDate || ""),
      );
      if (byDate) return byDate;
      const byTime = String(a.requestedStartTime || "").localeCompare(
        String(b.requestedStartTime || ""),
      );
      if (byTime) return byTime;
      const byWindow = String(a.preferredWindow || "").localeCompare(
        String(b.preferredWindow || ""),
      );
      if (byWindow) return byWindow;
      return String(a.id).localeCompare(String(b.id));
    });

  const workingByDate: Record<string, StoreBooking[]> = {};
  const placed: StoreBooking[] = [];

  for (const request of sorted) {
    const date = String(request.requestedDate || "").slice(0, 10);
    if (!date || !request.serviceId) continue;

    if (!workingByDate[date]) {
      workingByDate[date] = seedBookingsForDate(date).slice();
    }

    const working = workingByDate[date];
    const slot = pickSlotOnAssignedSetup(request, date, working);
    if (!slot) {
      continue;
    }

    const booking = bookingFromSlot(request, date, slot);
    working.push(booking);
    placed.push(booking);
  }

  return placed;
}

export function toStoreBookingFromAssigned(request: DiagnosticRequest) {
  return toStoreBookingsFromAssigned([request])[0];
}
