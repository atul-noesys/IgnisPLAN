import { useLayoutEffect, useMemo, useRef } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { Store } from "@/lib/prototype";
import { BEDS_QUERY_KEY, useBeds, type Bed } from "@/hooks/useBeds";
import {
  ALLOCATIONS_QUERY_KEY,
  useCurrentAllocations,
} from "@/hooks/useCurrentAllocations";
import { buildBedsQueueFromAllocations, mergeAllocationBeds } from "@/lib/bedsAllocationMapper";
import type { NgaugeDataRow, PaginatedDataResponse } from "@/store/ngauge-store";

const BEDS_LIMIT = 100;
const ALLOCATIONS_LIMIT = 500;

const BEDS_PAGE_QUERY_KEY = [
  BEDS_QUERY_KEY[0],
  BEDS_QUERY_KEY[1],
  1,
  BEDS_LIMIT,
  undefined,
  undefined,
  "paginated",
] as const;

const ALLOCATIONS_PAGE_QUERY_KEY = [
  ALLOCATIONS_QUERY_KEY[0],
  ALLOCATIONS_QUERY_KEY[1],
  1,
  ALLOCATIONS_LIMIT,
  undefined,
  undefined,
  "paginated",
] as const;

let clearBedsOverlayAppliedKey: (() => void) | null = null;

function readCachedPaginatedRows(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
): NgaugeDataRow[] | null {
  const cached = queryClient.getQueryData<PaginatedDataResponse>(queryKey);
  if (!cached) return null;
  return Array.isArray(cached.data) ? cached.data : [];
}

function readPaginatedRows(
  queryClient: QueryClient,
  queryKeyPrefix: readonly (string | number)[],
): NgaugeDataRow[] | null {
  const entries = queryClient.getQueriesData<PaginatedDataResponse>({
    queryKey: [...queryKeyPrefix],
  });
  if (!entries.length) return null;

  let best: PaginatedDataResponse | undefined;
  for (const [, data] of entries) {
    if (!data) continue;
    const len = data.data?.length ?? 0;
    if (!best || len > (best.data?.length ?? 0)) {
      best = data;
    }
  }
  if (!best) return null;
  return Array.isArray(best.data) ? best.data : [];
}

function resolveCachedRows(
  queryClient: QueryClient,
  exactKey: readonly unknown[],
  prefix: readonly (string | number)[],
): NgaugeDataRow[] | null {
  return readCachedPaginatedRows(queryClient, exactKey) ?? readPaginatedRows(queryClient, prefix);
}

/** Refetch allocation queries; next render re-syncs prototype Store from cache. */
export async function refreshLiveBedsStore(
  queryClient: QueryClient,
): Promise<boolean> {
  await Promise.all([
    queryClient.refetchQueries({ queryKey: [...ALLOCATIONS_QUERY_KEY] }),
    queryClient.refetchQueries({ queryKey: [...BEDS_QUERY_KEY] }),
  ]);

  const allocationRows = resolveCachedRows(
    queryClient,
    ALLOCATIONS_PAGE_QUERY_KEY,
    ALLOCATIONS_QUERY_KEY,
  );
  const bedRows = resolveCachedRows(
    queryClient,
    BEDS_PAGE_QUERY_KEY,
    BEDS_QUERY_KEY,
  );

  if (allocationRows === null && bedRows === null) {
    return false;
  }

  clearBedsOverlayAppliedKey?.();
  return true;
}

function slugId(prefix: string, label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${prefix}-${slug || "unknown"}`;
}

function inferWardType(wardName: string): string {
  const text = wardName.toLowerCase();
  if (text.includes("icu") || text.includes("hdu")) return "ICU";
  if (text.includes("private")) return "Private";
  return "General";
}

export function toStoreBed(bed: Bed) {
  return {
    id: bed.id,
    wardId: bed.wardId,
    name: bed.name,
    status: bed.status,
    bookingMode: bed.bookingMode,
  };
}

export function buildBedsInventory(beds: Bed[]) {
  const departmentMap = new Map<
    string,
    { id: string; name: string; status: string }
  >();
  const wardMap = new Map<
    string,
    {
      id: string;
      departmentId: string;
      name: string;
      wardType: string;
      status: string;
    }
  >();

  for (const bed of beds) {
    const deptName = (bed.department || "General").trim() || "General";
    const departmentId = slugId("dept", deptName);
    if (!departmentMap.has(departmentId)) {
      departmentMap.set(departmentId, {
        id: departmentId,
        name: deptName,
        status: "Active",
      });
    }

    const wardId = (bed.wardId || "").trim();
    const effectiveWardId = wardId || `ward-${departmentId}-unassigned`;
    const wardName =
      bed.wardName?.trim() ||
      (wardId ? wardId : `${deptName} (unassigned)`);

    if (!wardMap.has(effectiveWardId)) {
      wardMap.set(effectiveWardId, {
        id: effectiveWardId,
        departmentId,
        name: wardName,
        wardType: inferWardType(wardName),
        status: "Active",
      });
    }
  }

  return {
    beds: beds.map((bed) => {
      const deptName = (bed.department || "General").trim() || "General";
      const departmentId = slugId("dept", deptName);
      const wardId = (bed.wardId || "").trim();
      return {
        ...toStoreBed(bed),
        wardId: wardId || `ward-${departmentId}-unassigned`,
      };
    }),
    wards: [...wardMap.values()],
    departments: [...departmentMap.values()],
  };
}

/**
 * Hydrate Beds Allotment from hosp_beds (form 40) and awaiting/confirmed
 * allocations from current_allocation_active (form 41).
 */
export function useHydrateBeds(_scheduleDate?: string) {
  const appliedKeyRef = useRef("");

  const {
    data: beds,
    isLoading: bedsLoading,
    isFetching: bedsFetching,
    error: bedsError,
  } = useBeds(1, BEDS_LIMIT);

  const {
    data: allocations,
    isLoading: allocationsLoading,
    isFetching: allocationsFetching,
    error: allocationsError,
  } = useCurrentAllocations(1, ALLOCATIONS_LIMIT);

  // Hydrate store once initial queries resolve — not on every background refetch.
  const mappingReady = !bedsLoading && !allocationsLoading;
  const isInitialLoading = bedsLoading || allocationsLoading;
  const isRefetching = bedsFetching || allocationsFetching;

  const mergedBeds = useMemo(
    () => mergeAllocationBeds(beds, allocations),
    [beds, allocations],
  );

  const overlayKey = useMemo(() => {
    if (!mappingReady) return "";
    const bedsKey =
      mergedBeds.length === 0
        ? "__empty_beds__"
        : mergedBeds
            .map(
              (bed) =>
                `${bed.id}:${bed.wardId}:${bed.name}:${bed.status}:${bed.bookingMode}:${bed.wardName}:${bed.department}`,
            )
            .join(",");
    const queueKey = allocations
      .map(
        (row) =>
          `${row.recordId}:${row.patientId}:${row.bedId}:${row.staffId}:${row.staffName}:${row.admissionDate}:${row.los}:${row.severity}`,
      )
      .join(",");
    return `${bedsKey}|${queueKey}`;
  }, [mappingReady, mergedBeds, allocations]);

  useLayoutEffect(() => {
    clearBedsOverlayAppliedKey = () => {
      appliedKeyRef.current = "";
    };
    return () => {
      clearBedsOverlayAppliedKey = null;
    };
  }, []);

  // Sync prototype Store during render so PrototypeHost always reads fresh data
  // (child useLayoutEffect runs before parent effects in React).
  if (mappingReady && overlayKey && appliedKeyRef.current !== overlayKey) {
    Store.setLiveBedsInventory(buildBedsInventory(mergedBeds));
    Store.setLiveBedsQueue(buildBedsQueueFromAllocations(allocations, mergedBeds));
    appliedKeyRef.current = overlayKey;
  }

  const isReady = mappingReady && Boolean(overlayKey) && appliedKeyRef.current === overlayKey;

  useLayoutEffect(() => {
    return () => {
      appliedKeyRef.current = "";
      Store.clearLiveBedsInventory();
      Store.clearLiveBedsQueue();
    };
  }, []);

  const queueFromAllocations = useMemo(
    () => buildBedsQueueFromAllocations(allocations, mergedBeds),
    [allocations, mergedBeds],
  );

  return {
    isReady,
    isInitialLoading,
    isRefetching,
    hydrationKey: overlayKey,
    error: bedsError || allocationsError || null,
    bedCount: beds.length,
    awaitingCount: queueFromAllocations.bedRequests.length,
    confirmedCount: queueFromAllocations.allotments.length,
  };
}
