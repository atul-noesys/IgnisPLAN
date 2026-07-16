import { Dispatch, SetStateAction } from "react";
import type { NgaugeDataRow } from "@/store/ngauge-store";
import {
  useNgaugePaginatedData,
  type FiltersType,
  type UseNgaugePaginatedDataResult,
} from "@/hooks/useNgaugePaginatedData";

export const SERVICES_FORM_ID = 36;
export const SERVICES_TABLE = "hosp_services";

export type Service = {
  id: string;
  name: string;
  type: string;
  lead: number;
  procedure: number;
  lag: number;
  active: boolean;
};

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const text = String(value ?? "")
    .trim()
    .toLowerCase();
  return text === "true" || text === "1" || text === "yes" || text === "active";
}

export function transformRowToService(row: NgaugeDataRow): Service {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    type: String(row.service_type ?? row.type ?? ""),
    lead: Number(row.lead_min ?? row.lead ?? 0) || 0,
    procedure: Number(row.procedure_min ?? row.procedure ?? 0) || 0,
    lag: Number(row.lag_min ?? row.lag ?? 0) || 0,
    active: toBool(row.active),
  };
}

export function serviceTotal(service: Pick<Service, "lead" | "procedure" | "lag">) {
  return service.lead + service.procedure + service.lag;
}

/** e.g. "MRI Brain" → "svc-mri-brain" */
export function generateServiceId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `svc-${slug || "new"}`;
}

export type ServiceRowPayload = {
  id: string;
  name: string;
  service_type: string;
  lead_min: number;
  procedure_min: number;
  lag_min: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export function buildServiceRow(input: {
  id: string;
  name: string;
  service_type: string;
  lead_min: number;
  procedure_min: number;
  lag_min: number;
  active: boolean;
  created_at?: string;
}): ServiceRowPayload {
  const now = new Date().toISOString();
  return {
    id: input.id,
    name: input.name,
    service_type: input.service_type,
    lead_min: input.lead_min,
    procedure_min: input.procedure_min,
    lag_min: input.lag_min,
    active: input.active,
    created_at: input.created_at ?? now,
    updated_at: now,
  };
}


type UseServicesResult = Omit<UseNgaugePaginatedDataResult, "data"> & {
  data: Service[];
  filters: FiltersType | undefined;
  setFilters: Dispatch<SetStateAction<FiltersType | undefined>>;
};

export function useServices(
  pageNo = 1,
  limit = 10,
  initialFilters?: FiltersType,
): UseServicesResult {
  const query = useNgaugePaginatedData(
    SERVICES_FORM_ID,
    SERVICES_TABLE,
    pageNo,
    limit,
    initialFilters,
  );

  return {
    ...query,
    data: (query.data ?? []).map(transformRowToService),
  };
}
