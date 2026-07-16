import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Store } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { useBeds, type Bed } from "@/hooks/useBeds";
import { useCurrentAllocations } from "@/hooks/useCurrentAllocations";
import { buildBedsQueueFromAllocations, mergeAllocationBeds } from "@/lib/bedsAllocationMapper";

const BEDS_LIMIT = 100;
const ALLOCATIONS_LIMIT = 500;

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
  const { refresh } = useAppStore();
  const [storeReady, setStoreReady] = useState(false);
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
  const isLoading =
    bedsLoading ||
    bedsFetching ||
    allocationsLoading ||
    allocationsFetching;

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
    if (!mappingReady || !overlayKey) {
      if (!appliedKeyRef.current) {
        setStoreReady(false);
        Store.setLiveBedsInventory({ beds: [], wards: [], departments: [] });
        Store.setLiveBedsQueue({
          bedRequests: [],
          patients: [],
          departments: [],
          allotments: [],
        });
      }
      return;
    }

    if (appliedKeyRef.current === overlayKey) {
      return;
    }

    Store.setLiveBedsInventory(buildBedsInventory(mergedBeds));
    Store.setLiveBedsQueue(buildBedsQueueFromAllocations(allocations, mergedBeds));
    appliedKeyRef.current = overlayKey;
    setStoreReady(true);
    refresh();
    // beds / allocations reflected in overlayKey
    // eslint-disable-next-line react-hooks/exhaustive-deps -- overlayKey is the content fingerprint
  }, [mappingReady, overlayKey, refresh]);

  useLayoutEffect(() => {
    return () => {
      appliedKeyRef.current = "";
      setStoreReady(false);
      Store.clearLiveBedsInventory();
      Store.clearLiveBedsQueue();
    };
  }, []);

  const queueFromAllocations = useMemo(
    () => buildBedsQueueFromAllocations(allocations, mergedBeds),
    [allocations, mergedBeds],
  );

  return {
    isReady: mappingReady && storeReady,
    isLoading,
    error: bedsError || allocationsError || null,
    bedCount: beds.length,
    awaitingCount: queueFromAllocations.bedRequests.length,
    confirmedCount: queueFromAllocations.allotments.length,
  };
}
