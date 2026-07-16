import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Store } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { useServices, type Service } from "@/hooks/useServices";
import { useSetups, type Setup } from "@/hooks/useSetups";
import { usePatientsByIds } from "@/hooks/usePatients";
import {
  useDiagnosticRequests,
  type DiagnosticRequest,
} from "@/hooks/useDiagnosticRequests";
import { toStoreBookingsFromAssigned, isAssignedForTimeline } from "@/lib/imagingLiveBookings";

const QUEUE_LIMIT = 500;
const SETUPS_LIMIT = 200;

/** Live priority → Store severity (Medium → Moderate for prototype filters). */
export function toStoreSeverity(priority?: string): string {
  const value = (priority || "").trim();
  if (!value) return "";
  if (value.toLowerCase() === "medium") return "Moderate";
  return value;
}

/** Build Store patient shape from denormalized request fields (+ optional type). */
export function toStorePatientFromRequest(
  request: DiagnosticRequest,
  patientType?: string,
) {
  const id = (request.patientId || "").trim();
  return {
    id,
    mrn: id,
    name: request.patientName || "",
    age: 0,
    gender: "",
    patientType: patientType || request.patientType || "",
    disease: "",
    severity: toStoreSeverity(request.severity),
  };
}

/** @deprecated use toStorePatientFromRequest — kept for callers expecting Patient */
export function toStorePatient(patient: {
  patientId: string;
  patientName: string;
  age?: number;
  gender?: string;
  patientType?: string;
  diagnosis?: string;
  priority?: string;
}) {
  const id = (patient.patientId || "").trim();
  return {
    id,
    mrn: id,
    name: patient.patientName || "",
    age: patient.age ?? 0,
    gender: patient.gender || "",
    patientType: patient.patientType || "",
    disease: patient.diagnosis || "",
    severity: toStoreSeverity(patient.priority),
  };
}

export function toStoreRequest(request: DiagnosticRequest) {
  return {
    id: request.id,
    patientId: request.patientId,
    serviceId: request.serviceId,
    requestedDate: request.requestedDate,
    preferredWindow: request.preferredWindow,
    status: request.status,
    ...(request.setupId ? { setupId: request.setupId } : {}),
    ...(request.requestedStartTime
      ? { requestedStartTime: request.requestedStartTime }
      : {}),
  };
}

export function toStoreService(service: Service) {
  return {
    id: service.id,
    name: service.name,
    type: service.type,
    lead: service.lead,
    procedure: service.procedure,
    lag: service.lag,
    active: service.active,
  };
}

/** Map ngauge Setup List row → Store setup track shape. */
export function toStoreSetup(setup: Setup) {
  return {
    id: setup.id,
    name: setup.name,
    serviceId: setup.serviceId,
    equipmentLabel: setup.equipmentLabel,
    status: setup.status,
    location: setup.location,
    defaultOperatorId: setup.defaultOperatorId,
    defaultOperatorName: setup.defaultOperatorName,
  };
}

/**
 * Hydrate Imaging Scheduler awaiting panel from live Patients Queue (ngauge).
 * Tracks come from Setup List (form 37); name/severity from request row; Type from patient join.
 */
export function useHydrateImagingQueue(scheduleDate: string) {
  const { refresh } = useAppStore();
  const [storeReady, setStoreReady] = useState(false);
  const appliedKeyRef = useRef("");

  const {
    data: requests,
    isLoading: requestsLoading,
    error: requestsError,
  } = useDiagnosticRequests(1, QUEUE_LIMIT, undefined);

  const requestIdsKey = requests
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
    !setupsLoading &&
    (requests.length === 0 || (patientsReady && !patientsLoading));

  const overlayKey = useMemo(() => {
    if (!mappingReady) return "";
    const typeKey = Object.values(patientById)
      .map((p) => `${p.patientId}:${p.patientType}`)
      .sort()
      .join(",");
    const reqKey = requests
      .map(
        (r) =>
          `${r.id}:${r.patientName}:${r.severity}:${r.status}:${r.setupId || ""}:${r.requestedDate}:${r.requestedStartTime || ""}`,
      )
      .join(",");
    const svcKey = services.map((s) => s.id).join(",");
    const setupKey = setups
      .map((s) => `${s.id}:${s.serviceId}:${s.status}`)
      .join(",");
    return `${scheduleDate}|${reqKey}|${typeKey}|${svcKey}|${setupKey}`;
  }, [mappingReady, scheduleDate, requests, services, setups, patientById]);

  useLayoutEffect(() => {
    if (!mappingReady || !overlayKey) {
      setStoreReady(false);
      Store.setLiveQueue({
        requests: [],
        patients: [],
        services: [],
        setups: [],
      });
      Store.setLiveBookings([], "merge");
      return;
    }

    const seen = new Set<string>();
    const storePatients: ReturnType<typeof toStorePatientFromRequest>[] = [];
    for (const request of requests) {
      const key = (request.patientId || "").trim();
      const mapped = patientById[key] ?? patientById[key.toUpperCase()];
      const adapted = toStorePatientFromRequest(request, mapped?.patientType);
      const idKey = adapted.id.toUpperCase();
      if (!adapted.id || seen.has(idKey)) continue;
      seen.add(idKey);
      storePatients.push(adapted);
    }

    Store.setLiveQueue({
      requests: requests.map(toStoreRequest),
      patients: storePatients,
      services: services.map(toStoreService),
      setups: setups.map(toStoreSetup),
    });

    const day = String(scheduleDate || "").slice(0, 10);
    const assignedForDay = requests.filter(
      (r) =>
        isAssignedForTimeline(r) &&
        String(r.requestedDate || "").slice(0, 10) === day,
    );
    Store.setLiveBookings(toStoreBookingsFromAssigned(assignedForDay), "merge");

    appliedKeyRef.current = overlayKey;
    setStoreReady(true);
    refresh();
    // requests / services / setups / patientById are reflected in overlayKey
    // eslint-disable-next-line react-hooks/exhaustive-deps -- overlayKey is the content fingerprint
  }, [mappingReady, overlayKey, refresh, scheduleDate]);

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
    error:
      requestsError ||
      patientsError ||
      servicesError ||
      setupsError ||
      null,
    requestCount: requests.length,
  };
}
