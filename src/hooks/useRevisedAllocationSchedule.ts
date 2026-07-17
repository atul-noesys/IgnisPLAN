import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchRevisedAllocationSchedule,
  normalizeRevisedAllocationPatientIds,
  revisedAllocationScheduleQueryKey,
  REVISED_ALLOCATION_SCHEDULE_STALE_TIME,
} from "@/lib/getRevisedAllocationSchedule";
import type { RevisedAllocationScheduleRow } from "@/store/ngauge-store";

export function useRevisedAllocationSchedule(
  patientIds: string[],
  enabled = false,
) {
  const normalizedIds = useMemo(
    () => normalizeRevisedAllocationPatientIds(patientIds),
    [patientIds],
  );

  return useQuery<RevisedAllocationScheduleRow[]>({
    queryKey: revisedAllocationScheduleQueryKey(normalizedIds),
    queryFn: () => fetchRevisedAllocationSchedule(normalizedIds),
    enabled: enabled && normalizedIds.length > 0,
    staleTime: REVISED_ALLOCATION_SCHEDULE_STALE_TIME,
  });
}

export function useFetchRevisedAllocationSchedule() {
  const queryClient = useQueryClient();

  return useCallback(
    async (patientIds: string | string[]) => {
      const normalizedIds = normalizeRevisedAllocationPatientIds(patientIds);
      if (normalizedIds.length === 0) {
        return [] as RevisedAllocationScheduleRow[];
      }

      return queryClient.fetchQuery({
        queryKey: revisedAllocationScheduleQueryKey(normalizedIds),
        queryFn: () => fetchRevisedAllocationSchedule(normalizedIds),
        staleTime: REVISED_ALLOCATION_SCHEDULE_STALE_TIME,
      });
    },
    [queryClient],
  );
}
