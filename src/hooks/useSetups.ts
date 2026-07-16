import { Dispatch, SetStateAction } from "react";
import type { NgaugeDataRow } from "@/store/ngauge-store";
import {
  useNgaugePaginatedData,
  type FiltersType,
  type UseNgaugePaginatedDataResult,
} from "@/hooks/useNgaugePaginatedData";

export const SETUPS_FORM_ID = 37;
export const SETUPS_TABLE = "hosp_setups";

export type Setup = {
  id: string;
  name: string;
  serviceId: string;
  equipmentLabel: string;
  status: string;
  location: string;
  defaultOperatorId: string;
  defaultOperatorName: string;
  createdAt?: string;
  updatedAt?: string;
};

export function transformRowToSetup(row: NgaugeDataRow): Setup {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    serviceId: String(row.service_id ?? row.serviceId ?? ""),
    equipmentLabel: String(row.equipment_label ?? row.equipmentLabel ?? ""),
    status: String(row.status ?? ""),
    location: String(row.location ?? ""),
    defaultOperatorId: String(
      row.default_operator_id ?? row.defaultOperatorId ?? "",
    ),
    defaultOperatorName: String(
      row.default_operator_name ?? row.defaultOperatorName ?? "",
    ),
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

/** e.g. "MRI Suite B" → "setup-mri-suite-b" */
export function generateSetupId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `setup-${slug || "new"}`;
}

export type SetupRowPayload = {
  id: string;
  name: string;
  service_id: string;
  equipment_label: string;
  status: string;
  location: string;
  default_operator_id: string;
  default_operator_name: string;
  created_at: string;
  updated_at: string;
};

export function buildSetupRow(input: {
  id: string;
  name: string;
  service_id: string;
  equipment_label: string;
  status: string;
  location: string;
  default_operator_id?: string;
  default_operator_name?: string;
  created_at?: string;
}): SetupRowPayload {
  const now = new Date().toISOString();
  return {
    id: input.id,
    name: input.name,
    service_id: input.service_id,
    equipment_label: input.equipment_label,
    status: input.status,
    location: input.location,
    default_operator_id: input.default_operator_id ?? "",
    default_operator_name: input.default_operator_name ?? "",
    created_at: input.created_at ?? now,
    updated_at: now,
  };
}

type UseSetupsResult = Omit<UseNgaugePaginatedDataResult, "data"> & {
  data: Setup[];
  filters: FiltersType | undefined;
  setFilters: Dispatch<SetStateAction<FiltersType | undefined>>;
};

export function useSetups(
  pageNo = 1,
  limit = 10,
  initialFilters?: FiltersType,
): UseSetupsResult {
  const query = useNgaugePaginatedData(
    SETUPS_FORM_ID,
    SETUPS_TABLE,
    pageNo,
    limit,
    initialFilters,
  );

  return {
    ...query,
    data: (query.data ?? []).map(transformRowToSetup),
  };
}
