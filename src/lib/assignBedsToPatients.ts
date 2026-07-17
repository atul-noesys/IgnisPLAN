import type { QueryClient } from "@tanstack/react-query";
import {
  ALLOCATIONS_FORM_ID,
  ALLOCATIONS_RECORD_ID_FIELD,
  ALLOCATIONS_TABLE,
} from "@/hooks/useCurrentAllocations";
import { refreshLiveBedsStore } from "@/hooks/useHydrateBeds";
import { ngaugeStore } from "@/store/ngauge-store";

export type BedAllocationAssignment = {
  recordId: string;
  bedId: string;
};

function normalizeAssignments(
  recordIds: string[],
  bedIds: string | string[],
): BedAllocationAssignment[] {
  const ids = (recordIds ?? [])
    .map((id) => String(id ?? "").trim())
    .filter(Boolean);
  if (ids.length === 0) return [];

  const beds = Array.isArray(bedIds)
    ? bedIds.map((id) => String(id ?? "").trim())
    : ids.map(() => String(bedIds ?? "").trim());

  if (beds.length !== ids.length || beds.some((id) => !id)) {
    return [];
  }

  return ids.map((recordId, index) => ({
    recordId,
    bedId: beds[index],
  }));
}

/**
 * Update current_allocation_active.bed_id via form 41 row edit API.
 * Uses allocation recordid (queue row id), not patientid.
 */
export async function assignBedsToPatients(
  recordIds: string[],
  bedIds: string | string[],
  queryClient?: QueryClient,
): Promise<boolean> {
  const assignments = normalizeAssignments(recordIds, bedIds);
  if (assignments.length === 0) return false;

  try {
    const ok = await ngaugeStore.assignBedsToAllocations(
      ALLOCATIONS_FORM_ID,
      ALLOCATIONS_TABLE,
      assignments,
      ALLOCATIONS_RECORD_ID_FIELD,
    );
    if (ok && queryClient) {
      await refreshLiveBedsStore(queryClient);
    }
    return ok;
  } catch (error) {
    console.error("assignBedsToPatients failed:", error);
    return false;
  }
}
