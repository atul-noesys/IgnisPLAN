import { Dispatch, SetStateAction } from "react";
import type { NgaugeDataRow } from "@/store/ngauge-store";
import {
  useNgaugePaginatedData,
  type FiltersType,
  type UseNgaugePaginatedDataResult,
} from "@/hooks/useNgaugePaginatedData";

type SortType = { [keyValue: string]: string };

export const BEDS_FORM_ID = 40;
export const BEDS_TABLE = "hosp_beds";
/** Primary key column in hosp_beds API rows */
export const BED_ID_FIELD = "bed_id";

export type Bed = {
  id: string;
  wardId: string;
  name: string;
  status: string;
  bookingMode: string;
  wardName: string;
  department: string;
  createdAt?: string;
  updatedAt?: string;
  rowId?: number;
};

function pick(row: NgaugeDataRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

export function transformRowToBed(row: NgaugeDataRow): Bed {
  return {
    id: pick(row, [BED_ID_FIELD, "bedId", "id", "ID"]),
    wardId: pick(row, ["ward_id", "wardId"]),
    name: String(row.name ?? ""),
    status: pick(row, ["status"]) || "Active",
    bookingMode: pick(row, ["booking_mode", "bookingMode"]) || "Daily",
    wardName: pick(row, ["ward_name", "wardName"]),
    department: pick(row, ["department"]),
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    rowId:
      row.ROWID !== undefined && row.ROWID !== null
        ? Number(row.ROWID)
        : undefined,
  };
}

/** Rebuild an API row from a Bed (e.g. when get-row by id is unavailable). */
export function bedToRow(bed: Bed): NgaugeDataRow {
  return {
    [BED_ID_FIELD]: bed.id,
    ward_id: bed.wardId,
    ward_name: bed.wardName,
    name: bed.name,
    status: bed.status,
    booking_mode: bed.bookingMode,
    department: bed.department || null,
    created_at: bed.createdAt ?? null,
    updated_at: bed.updatedAt ?? null,
    ...(bed.rowId !== undefined ? { ROWID: bed.rowId } : {}),
  };
}

/** e.g. "ERPR-04" → "bed-erpr-04" */
export function generateBedId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `bed-${slug || String(Date.now()).slice(-6)}`;
}

export type BedRowPayload = {
  bed_id: string;
  ward_id: string;
  ward_name: string;
  name: string;
  status: string;
  booking_mode: string;
  department?: string | null;
  created_at: string;
  updated_at: string;
};

export function buildBedRow(input: {
  bed_id: string;
  ward_id: string;
  ward_name: string;
  name: string;
  status: string;
  booking_mode: string;
  department?: string | null;
  created_at?: string;
}): BedRowPayload {
  const now = new Date().toISOString();
  return {
    bed_id: input.bed_id,
    ward_id: input.ward_id,
    ward_name: input.ward_name,
    name: input.name,
    status: input.status,
    booking_mode: input.booking_mode,
    ...(input.department !== undefined ? { department: input.department } : {}),
    created_at: input.created_at ?? now,
    updated_at: now,
  };
}

type UseBedsResult = Omit<UseNgaugePaginatedDataResult, "data"> & {
  data: Bed[];
  filters: FiltersType | undefined;
  setFilters: Dispatch<SetStateAction<FiltersType | undefined>>;
};

export function useBeds(
  pageNo = 1,
  limit = 100,
  initialFilters?: FiltersType,
  initialSort?: SortType,
  enabled = true,
): UseBedsResult {
  const query = useNgaugePaginatedData(
    BEDS_FORM_ID,
    BEDS_TABLE,
    pageNo,
    limit,
    initialFilters,
    initialSort,
    enabled,
  );

  return {
    ...query,
    data: (query.data ?? []).map(transformRowToBed),
  };
}
