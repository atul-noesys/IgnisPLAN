import { Dispatch, SetStateAction } from "react";
import type { NgaugeDataRow } from "@/store/ngauge-store";
import {
  useNgaugePaginatedData,
  type FiltersType,
  type UseNgaugePaginatedDataResult,
} from "@/hooks/useNgaugePaginatedData";

export const ALLOCATIONS_FORM_ID = 41;
export const ALLOCATIONS_TABLE = "current_allocation_active";
export const ALLOCATIONS_RECORD_ID_FIELD = "recordid";
export const ALLOCATIONS_QUERY_KEY = [
  ALLOCATIONS_TABLE,
  ALLOCATIONS_FORM_ID,
] as const;

export type CurrentAllocation = {
  recordId: string;
  department: string;
  shift: string;
  admissionDatetime: string;
  admissionDate: string;
  admissionTime: string;
  dischargeDatetime: string;
  acuityAtAdmission: string;
  estimatedCareHours: string;
  patientId: string;
  patientName: string;
  staffId: string;
  staffName: string;
  role: string;
  maxPatients: string;
  availability: string;
  nursePatientCount: string;
  bedId: string;
  los: string;
  severity: string;
};

function pick(row: NgaugeDataRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  const lowerMap = new Map(
    Object.keys(row).map((k) => [k.toLowerCase(), k] as const),
  );
  for (const key of keys) {
    const actual = lowerMap.get(key.toLowerCase());
    if (!actual) continue;
    const value = row[actual];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

export function isNullishField(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  const text = String(value).trim().toLowerCase();
  return text === "" || text === "null";
}

/** Awaiting queue: no bed and no staff assigned yet. */
export function isAwaitingAllocation(row: NgaugeDataRow | CurrentAllocation): boolean {
  const bedId = "bedId" in row ? row.bedId : pick(row as NgaugeDataRow, ["bed_id", "bedId", "bedid"]);
  const staffId =
    "staffId" in row ? row.staffId : pick(row as NgaugeDataRow, ["staffid", "staffId", "staff_id"]);
  return isNullishField(bedId) && isNullishField(staffId);
}

/** Beds timeline board: bed is assigned (staff may still be missing). */
export function isConfirmedAllocation(row: NgaugeDataRow | CurrentAllocation): boolean {
  const bedId = "bedId" in row ? row.bedId : pick(row as NgaugeDataRow, ["bed_id", "bedId", "bedid"]);
  return !isNullishField(bedId);
}

/** Both bed and staff assigned. */
export function isFullyAssignedAllocation(
  row: NgaugeDataRow | CurrentAllocation,
): boolean {
  const bedId = "bedId" in row ? row.bedId : pick(row as NgaugeDataRow, ["bed_id", "bedId", "bedid"]);
  const staffId =
    "staffId" in row ? row.staffId : pick(row as NgaugeDataRow, ["staffid", "staffId", "staff_id"]);
  return !isNullishField(bedId) && !isNullishField(staffId);
}

/** Staff assigned but no bed — excluded from queue and timeline. */
export function isPartialAllocation(row: NgaugeDataRow | CurrentAllocation): boolean {
  const bedId = "bedId" in row ? row.bedId : pick(row as NgaugeDataRow, ["bed_id", "bedId", "bedid"]);
  const staffId =
    "staffId" in row ? row.staffId : pick(row as NgaugeDataRow, ["staffid", "staffId", "staff_id"]);
  return isNullishField(bedId) && !isNullishField(staffId);
}

export type AllocationCategory = "awaiting" | "confirmed" | "partial";

export function getAllocationCategory(
  row: NgaugeDataRow | CurrentAllocation,
): AllocationCategory {
  if (isAwaitingAllocation(row)) return "awaiting";
  if (isConfirmedAllocation(row)) return "confirmed";
  return "partial";
}

export function parseAdmissionDatetime(raw: unknown): {
  date: string;
  time: string;
  datetime: string;
} {
  const text = String(raw ?? "").trim();
  if (!text) return { date: "", time: "", datetime: "" };

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return { date: "", time: "", datetime: text };
  }

  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  const hh = String(parsed.getHours()).padStart(2, "0");
  const mm = String(parsed.getMinutes()).padStart(2, "0");
  return {
    date: `${y}-${m}-${d}`,
    time: `${hh}:${mm}`,
    datetime: text,
  };
}

export function transformRowToAllocation(row: NgaugeDataRow): CurrentAllocation {
  const admission = parseAdmissionDatetime(
    row.admission_datetime ?? row.admissionDatetime,
  );
  const discharge = parseAdmissionDatetime(
    row.discharge_datetime ?? row.dischargeDatetime,
  );

  return {
    recordId: pick(row, ["recordid", "recordId", "id"]),
    department: pick(row, ["department"]),
    shift: pick(row, ["shift"]),
    admissionDatetime: admission.datetime,
    admissionDate: admission.date,
    admissionTime: admission.time,
    dischargeDatetime: discharge.datetime,
    acuityAtAdmission: pick(row, ["acuity_at_admission", "acuityAtAdmission"]),
    estimatedCareHours: pick(row, ["estimated_care_hours", "estimatedCareHours"]),
    patientId: pick(row, ["patientid", "patientId"]),
    patientName: pick(row, ["patientname", "patientName"]),
    staffId: pick(row, ["staffid", "staff_id", "staffId"]),
    staffName: pick(row, ["staffname", "staff_name", "staffName"]),
    role: pick(row, ["role"]),
    maxPatients: pick(row, ["maxpatients", "maxPatients"]),
    availability: pick(row, ["availability"]),
    nursePatientCount: pick(row, ["nurse_patient_count_in_result", "nursePatientCount"]),
    bedId: pick(row, ["bed_id", "bedId", "bedid"]),
    los: pick(row, ["los"]),
    severity: pick(row, ["severity"]),
  };
}

type UseCurrentAllocationsResult = Omit<
  UseNgaugePaginatedDataResult,
  "data"
> & {
  data: CurrentAllocation[];
  filters: FiltersType | undefined;
  setFilters: Dispatch<SetStateAction<FiltersType | undefined>>;
};

export function useCurrentAllocations(
  pageNo = 1,
  limit = 500,
  initialFilters?: FiltersType,
): UseCurrentAllocationsResult {
  const query = useNgaugePaginatedData(
    ALLOCATIONS_FORM_ID,
    ALLOCATIONS_TABLE,
    pageNo,
    limit,
    initialFilters,
  );

  return {
    ...query,
    data: (query.data ?? []).map(transformRowToAllocation),
  };
}
