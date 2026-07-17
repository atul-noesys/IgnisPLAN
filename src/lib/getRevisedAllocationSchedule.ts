import { ALLOCATIONS_FORM_ID } from "@/hooks/useCurrentAllocations";
import {
  ngaugeStore,
  type RevisedAllocationScheduleRow,
} from "@/store/ngauge-store";

export const REVISED_ALLOCATION_SCHEDULE_QUERY_KEY =
  "revised_allocation_schedule" as const;
export const REVISED_ALLOCATION_SCHEDULE_STALE_TIME = 5 * 60 * 1000;

export function normalizeRevisedAllocationPatientIds(
  patientIds: string | string[],
): string[] {
  return (Array.isArray(patientIds) ? patientIds : [patientIds])
    .map((id) => String(id ?? "").trim())
    .filter(Boolean)
    .sort();
}

export function revisedAllocationScheduleQueryKey(patientIds: string[]) {
  return [
    REVISED_ALLOCATION_SCHEDULE_QUERY_KEY,
    normalizeRevisedAllocationPatientIds(patientIds).join(","),
  ] as const;
}

async function getAllocationsDataSourceId(): Promise<number> {
  const form = await ngaugeStore.getFormById(ALLOCATIONS_FORM_ID);
  return Number(form.dataSourceId ?? form.DataSourceId ?? 0);
}

export async function fetchRevisedAllocationSchedule(
  patientIds: string | string[],
): Promise<RevisedAllocationScheduleRow[]> {
  const ids = normalizeRevisedAllocationPatientIds(patientIds);
  if (ids.length === 0) return [];

  const dataSourceId = await getAllocationsDataSourceId();
  if (!dataSourceId) {
    console.error(
      "fetchRevisedAllocationSchedule: missing dataSourceId for form",
      ALLOCATIONS_FORM_ID,
    );
    return [];
  }

  return ngaugeStore.getRevisedAllocationSchedule(dataSourceId, ids);
}
