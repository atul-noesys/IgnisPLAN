import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Store, UI } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { useServices } from "@/hooks/useServices";
import { useSetups } from "@/hooks/useSetups";
import { usePatientsByIds } from "@/hooks/usePatients";
import { useDiagnosticRequests } from "@/hooks/useDiagnosticRequests";
import type { FiltersType } from "@/hooks/useNgaugePaginatedData";
import {
  toStorePatientFromRequest,
  toStoreRequest,
  toStoreService,
  toStoreSetup,
} from "@/hooks/useHydrateImagingQueue";
import {
  inferServiceType,
  isAssignedForTimeline,
  toStoreBookingsFromAssigned,
} from "@/lib/imagingLiveBookings";

const RANGE_LIMIT = 500;
const SETUPS_LIMIT = 200;

const ASSIGNED_FILTERS: FiltersType = {
  status: [{ items: ["Assigned"], operator: "equals" }],
};

/**
 * Hydrate Imaging 15-day timeline from live Assigned requests.
 * API: status = Assigned only (multi-date equals often returns empty from ngauge).
 * Client: keep rows whose requested_date falls in today .. today+14.
 */
export function useHydrateImagingRange() {
  const { refresh } = useAppStore();
  const [storeReady, setStoreReady] = useState(false);
  const appliedKeyRef = useRef("");

  const rangeDates = useMemo(() => {
    if (typeof UI.scheduleRangeDates === "function") {
      return UI.scheduleRangeDates() as string[];
    }
    const start =
      typeof UI.todayISO === "function"
        ? (UI.todayISO() as string)
        : new Date().toISOString().slice(0, 10);
    const horizon = Number(UI.SCHEDULE_HORIZON) || 15;
    const dates: string[] = [];
    for (let i = 0; i < horizon; i++) {
      dates.push(
        typeof UI.addDays === "function"
          ? (UI.addDays(start, i) as string)
          : start,
      );
    }
    return dates;
  }, []);

  const rangeDateSet = useMemo(() => new Set(rangeDates), [rangeDates]);

  const {
    data: requests,
    isLoading: requestsLoading,
    error: requestsError,
  } = useDiagnosticRequests(1, RANGE_LIMIT, ASSIGNED_FILTERS);

  const assignedInRange = useMemo(
    () =>
      requests.filter((r) => {
        if (!isAssignedForTimeline(r)) return false;
        const day = String(r.requestedDate || "").slice(0, 10);
        return rangeDateSet.has(day);
      }),
    [requests, rangeDateSet],
  );

  const requestIdsKey = assignedInRange
    .map((r) => (r.patientId || "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join("|");

  const requestPatientIds = useMemo(
    () => (requestIdsKey ? requestIdsKey.split("|") : []),
    [requestIdsKey],
  );

  const {
    byId: patientById,
    isLoading: patientsLoading,
    isReady: patientsReady,
    error: patientsError,
  } = usePatientsByIds(requestPatientIds);

  const {
    data: services,
    isLoading: servicesLoading,
    error: servicesError,
  } = useServices(1, 200);

  const {
    data: setups,
    isLoading: setupsLoading,
    error: setupsError,
  } = useSetups(1, SETUPS_LIMIT);

  const mappingReady =
    !requestsLoading &&
    !servicesLoading &&
    !setupsLoading;

  const rangeKey = rangeDates.join(",");

  const overlayKey = useMemo(() => {
    if (!mappingReady) return "";
    const patientsPart =
      patientsReady && !patientsLoading
        ? Object.values(patientById)
            .map((p) => `${p.patientId}:${p.patientType}`)
            .sort()
            .join(",")
        : "pending-patients";
    const reqKey = assignedInRange
      .map(
        (r) =>
          `${r.id}:${r.setupId || ""}:${r.requestedDate}:${r.requestedStartTime || ""}:${r.serviceId}:${r.preferredWindow}:${r.severity}`,
      )
      .join(",");
    const svcKey = services.map((s) => `${s.id}:${s.type}`).join(",");
    const setupKey = setups
      .map((s) => `${s.id}:${s.serviceId}:${s.status}`)
      .join(",");
    return `${rangeKey}|${reqKey}|${svcKey}|${setupKey}|${patientsPart}`;
  }, [
    mappingReady,
    rangeKey,
    assignedInRange,
    services,
    setups,
    patientById,
    patientsReady,
    patientsLoading,
  ]);

  useLayoutEffect(() => {
    if (!mappingReady || !overlayKey) {
      setStoreReady(false);
      Store.setLiveQueue({
        requests: [],
        patients: [],
        services: [],
        setups: [],
      });
      Store.setLiveBookings([], "replace");
      return;
    }

    const seen = new Set<string>();
    const storePatients: ReturnType<typeof toStorePatientFromRequest>[] = [];
    for (const request of assignedInRange) {
      const key = (request.patientId || "").trim();
      const mapped = patientById[key] ?? patientById[key.toUpperCase()];
      const adapted = toStorePatientFromRequest(request, mapped?.patientType);
      const idKey = adapted.id.toUpperCase();
      if (!adapted.id || seen.has(idKey)) continue;
      seen.add(idKey);
      storePatients.push(adapted);
    }

    const serviceById = new Map(services.map((s) => [s.id, s]));
    const storeServices = [...services.map(toStoreService)];
    for (const request of assignedInRange) {
      const id = request.serviceId;
      if (!id || serviceById.has(id)) continue;
      const type = inferServiceType(id);
      if (!type) continue;
      serviceById.set(id, {
        id,
        name: id,
        type,
        lead: 15,
        procedure: 30,
        lag: 15,
        active: true,
      });
      storeServices.push({
        id,
        name: id,
        type,
        lead: 15,
        procedure: 30,
        lag: 15,
        active: true,
      });
    }

    Store.setLiveQueue({
      requests: assignedInRange.map(toStoreRequest),
      patients: storePatients,
      services: storeServices,
      setups: setups.map(toStoreSetup),
    });
    Store.setLiveBookings(toStoreBookingsFromAssigned(assignedInRange), "replace");

    appliedKeyRef.current = overlayKey;
    setStoreReady(true);
    refresh();
    // assignedInRange / services / setups / patientById are reflected in overlayKey
    // eslint-disable-next-line react-hooks/exhaustive-deps -- overlayKey is the content fingerprint
  }, [mappingReady, overlayKey, refresh]);

  useLayoutEffect(() => {
    return () => {
      appliedKeyRef.current = "";
      setStoreReady(false);
      Store.clearLiveBookings();
      Store.clearLiveQueue();
    };
  }, []);

  return {
    isReady: mappingReady && Boolean(overlayKey) && storeReady,
    error: requestsError || servicesError || setupsError || patientsError || null,
    requestCount: assignedInRange.length,
    requestDayIso: rangeDates[0] ? `${rangeDates[0]}T00:00:00Z` : "",
    rangeDays: rangeDates.length,
  };
}
