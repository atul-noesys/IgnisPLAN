import { Dispatch, SetStateAction } from "react";
import type { NgaugeDataRow } from "@/store/ngauge-store";
import {
  useNgaugePaginatedData,
  type FiltersType,
  type UseNgaugePaginatedDataResult,
} from "@/hooks/useNgaugePaginatedData";

export const REQUESTS_FORM_ID = 39;
export const REQUESTS_TABLE = "hosp_diagnostic_requests";

export type DiagnosticRequest = {
  id: string;
  patientId: string;
  serviceId: string;
  setupId: string;
  /** Calendar day YYYY-MM-DD */
  requestedDate: string;
  /**
   * Clock time HH:mm when requested_date includes a real time
   * (not midnight / date-only). Empty string → place via pickSlotForRequest.
   */
  requestedStartTime: string;
  preferredWindow: string;
  status: string;
  /** Joined from patient master on the request row */
  patientName: string;
  /** Joined severity / priority on the request row */
  severity: string;
  /** Optional joined patient type when backend provides it */
  patientType: string;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Split API requested_date into day + optional start time.
 * `…T00:00:00Z` / date-only → no start time (caller uses pickSlot).
 * `…T10:30:00Z` → startTime "10:30" (clock parts from the ISO string).
 */
export function parseRequestedDateTime(raw: unknown): {
  date: string;
  startTime: string;
} {
  const text = String(raw ?? "").trim();
  if (!text) return { date: "", startTime: "" };

  const date = text.includes("T") ? text.slice(0, 10) : text.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { date: text, startTime: "" };
  }

  const timeMatch = text.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!timeMatch) return { date, startTime: "" };

  const hh = timeMatch[1];
  const mm = timeMatch[2];
  const ss = timeMatch[3] ?? "00";
  if (hh === "00" && mm === "00" && ss === "00") {
    return { date, startTime: "" };
  }
  return { date, startTime: `${hh}:${mm}` };
}

function pick(row: NgaugeDataRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

export function transformRowToRequest(row: NgaugeDataRow): DiagnosticRequest {
  const rawDate = row.requested_date ?? row.requestedDate ?? "";
  const { date, startTime } = parseRequestedDateTime(rawDate);
  return {
    id: String(row.id ?? ""),
    patientId: pick(row, ["patient_id", "patientId"]).trim(),
    serviceId: pick(row, ["service_id", "serviceId"]),
    setupId: pick(row, ["setup_id", "setupId"]),
    requestedDate: date,
    requestedStartTime: startTime,
    preferredWindow: pick(row, ["preferred_window", "preferredWindow"]),
    status: pick(row, ["status"]),
    patientName: pick(row, ["patientname", "patientName", "patient_name"]),
    severity: pick(row, ["severity", "priority"]),
    patientType: pick(row, ["patient_type", "patientType"]),
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export function generateRequestId(): string {
  return `req-${String(Date.now()).slice(-6)}`;
}

export type RequestRowPayload = {
  id: string;
  patient_id: string;
  service_id: string;
  requested_date: string;
  preferred_window: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export function buildRequestRow(input: {
  id: string;
  patient_id: string;
  service_id: string;
  requested_date: string;
  preferred_window: string;
  status: string;
  created_at?: string;
}): RequestRowPayload {
  const now = new Date().toISOString();
  let requestedDate = input.requested_date;
  if (requestedDate && !requestedDate.includes("T")) {
    requestedDate = `${requestedDate}T00:00:00Z`;
  }
  return {
    id: input.id,
    patient_id: input.patient_id,
    service_id: input.service_id,
    requested_date: requestedDate,
    preferred_window: input.preferred_window,
    status: input.status,
    created_at: input.created_at ?? now,
    updated_at: now,
  };
}

export function requestPriorityScore(
  request: DiagnosticRequest,
  mappedPatientType?: string,
): number {
  let score = 0;
  const priority = (request.severity ?? "").toLowerCase();
  if (priority === "critical") score += 150;
  else if (priority === "high") score += 100;
  else if (priority === "medium" || priority === "moderate") score += 50;
  else score += 10;

  const patientType = (
    mappedPatientType ||
    request.patientType ||
    ""
  ).toLowerCase();
  if (patientType === "inpatient" || patientType === "ipd") score += 20;
  if (request.status === "Pending" || request.status === "Re-Scheduled") score += 5;
  return score;
}

type UseRequestsResult = Omit<UseNgaugePaginatedDataResult, "data"> & {
  data: DiagnosticRequest[];
  filters: FiltersType | undefined;
  setFilters: Dispatch<SetStateAction<FiltersType | undefined>>;
};

export function useDiagnosticRequests(
  pageNo = 1,
  limit = 10,
  initialFilters?: FiltersType,
): UseRequestsResult {
  const query = useNgaugePaginatedData(
    REQUESTS_FORM_ID,
    REQUESTS_TABLE,
    pageNo,
    limit,
    initialFilters,
  );

  return {
    ...query,
    data: (query.data ?? []).map(transformRowToRequest),
  };
}
