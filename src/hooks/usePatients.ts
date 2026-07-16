import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ngaugeStore, type NgaugeDataRow } from "@/store/ngauge-store";
import {
  useNgaugePaginatedData,
  type FiltersType,
  type UseNgaugePaginatedDataResult,
} from "@/hooks/useNgaugePaginatedData";

export const PATIENTS_FORM_ID = 38;
export const PATIENTS_TABLE = "Patient_Master";

export type Patient = {
  patientId: string;
  patientName: string;
  diagnosis: string;
  acuityLevel: number;
  department: string;
  gender: string;
  age: number;
  patientType: string;
  priority: string;
  createdAt?: string;
  updatedAt?: string;
};

function pickField(row: NgaugeDataRow, keys: string[]): string {
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

export function transformRowToPatient(row: NgaugeDataRow): Patient {
  return {
    patientId: pickField(row, ["patientid", "patientId", "patient_id", "id"]),
    patientName: pickField(row, [
      "patientname",
      "patientName",
      "patient_name",
      "name",
    ]),
    diagnosis: pickField(row, ["diagnosis", "disease"]),
    acuityLevel: Number(row.acuity_level ?? row.acuityLevel ?? 0) || 0,
    department: pickField(row, ["department"]),
    gender: pickField(row, ["gender"]),
    age: Number(row.age ?? 0) || 0,
    patientType: pickField(row, ["patient_type", "patientType"]),
    priority: pickField(row, ["priority", "severity"]),
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

/** e.g. → "PAT017" style id */
export function generatePatientId(): string {
  const n = Math.floor(Math.random() * 90000) + 10000;
  return `PAT${String(n).slice(0, 5)}`;
}

export type PatientRowPayload = {
  patientid: string;
  patientname: string;
  diagnosis: string;
  acuity_level: number;
  department: string;
  gender: string;
  age: number;
  patient_type: string;
  priority: string;
  created_at: string;
  updated_at: string;
};

export function buildPatientRow(input: {
  patientid: string;
  patientname: string;
  diagnosis: string;
  acuity_level: number;
  department: string;
  gender: string;
  age: number;
  patient_type: string;
  priority: string;
  created_at?: string;
}): PatientRowPayload {
  const now = new Date().toISOString();
  return {
    patientid: input.patientid,
    patientname: input.patientname,
    diagnosis: input.diagnosis,
    acuity_level: input.acuity_level,
    department: input.department,
    gender: input.gender,
    age: input.age,
    patient_type: input.patient_type,
    priority: input.priority,
    created_at: input.created_at ?? now,
    updated_at: now,
  };
}

type UsePatientsResult = Omit<UseNgaugePaginatedDataResult, "data"> & {
  data: Patient[];
  filters: FiltersType | undefined;
  setFilters: Dispatch<SetStateAction<FiltersType | undefined>>;
};

export function usePatients(
  pageNo = 1,
  limit = 10,
  initialFilters?: FiltersType,
): UsePatientsResult {
  const query = useNgaugePaginatedData(
    PATIENTS_FORM_ID,
    PATIENTS_TABLE,
    pageNo,
    limit,
    initialFilters,
  );

  return {
    ...query,
    data: (query.data ?? []).map(transformRowToPatient),
  };
}

function indexPatient(
  map: Record<string, Patient>,
  patient: Patient,
  extraKey?: string,
) {
  const id = (patient.patientId || "").trim();
  if (id) {
    map[id] = patient;
    map[id.toUpperCase()] = patient;
  }
  if (extraKey) {
    const key = extraKey.trim();
    if (key) {
      map[key] = patient;
      map[key.toUpperCase()] = patient;
    }
  }
}

function stablePatientIdsKey(patientIds: string[]): string {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const raw of patientIds) {
    const id = String(raw || "").trim();
    if (!id) continue;
    const key = id.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ids.push(id);
  }
  return ids.sort((a, b) => a.localeCompare(b)).join("|");
}

/**
 * Fetch Patient Master rows for the given patient IDs in one filtered query.
 * Uses a content-stable ids key so remount/refetch races don't blank the queue.
 */
export function usePatientsByIds(patientIds: string[]) {
  // String key is stable across renders even when the input array is a new reference.
  const idsKey = stablePatientIdsKey(patientIds);
  const uniqueIds = useMemo(
    () => (idsKey ? idsKey.split("|") : []),
    [idsKey],
  );

  const query = useQuery({
    queryKey: [PATIENTS_TABLE, PATIENTS_FORM_ID, "byIds", idsKey],
    queryFn: async () => {
      if (uniqueIds.length === 0) return [] as Patient[];
      const result = await ngaugeStore.getPaginatedData(
        PATIENTS_FORM_ID,
        PATIENTS_TABLE,
        1,
        Math.max(uniqueIds.length, 50),
        {
          patientid: [{ items: uniqueIds, operator: "equals" }],
        },
      );
      return (result.data ?? []).map(transformRowToPatient);
    },
    enabled: uniqueIds.length > 0,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const byId = useMemo(() => {
    const map: Record<string, Patient> = {};
    for (const patient of query.data ?? []) {
      indexPatient(map, patient);
    }
    return map;
  }, [query.data]);

  // Only block on the first load for these IDs — not background refetches.
  const isLoading =
    uniqueIds.length > 0 && query.isPending && !query.data;
  const isReady = uniqueIds.length === 0 || query.isFetched || !!query.data;

  const getPatient = useCallback(
    (patientId?: string | null) => {
      if (patientId == null || patientId === "") return undefined;
      const key = String(patientId).trim();
      return byId[key] ?? byId[key.toUpperCase()];
    },
    [byId],
  );

  return {
    byId,
    getPatient,
    isLoading,
    isReady,
    error: query.error ?? null,
  };
}

/** Bulk map — prefer usePatientsByIds for queue joins */
export function usePatientMap(limit = 2000) {
  const {
    data: patients,
    isLoading,
    isFetching,
    isPending,
    error,
    refetch,
  } = usePatients(1, limit);

  const byId = useMemo(() => {
    const map: Record<string, Patient> = {};
    for (const patient of patients) {
      indexPatient(map, patient);
    }
    return map;
  }, [patients]);

  const getPatient = useCallback(
    (patientId?: string | null) => {
      if (patientId == null || patientId === "") return undefined;
      const key = String(patientId).trim();
      return byId[key] ?? byId[key.toUpperCase()];
    },
    [byId],
  );

  return {
    patients,
    byId,
    getPatient,
    isLoading: isLoading || isPending,
    isFetching,
    error,
    refetch,
  };
}
