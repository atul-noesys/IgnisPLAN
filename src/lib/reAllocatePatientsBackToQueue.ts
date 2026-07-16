import { ngaugeStore } from "@/store/ngauge-store";
import {
  REQUESTS_FORM_ID,
  REQUESTS_TABLE,
  transformRowToRequest,
  type DiagnosticRequest,
} from "@/hooks/useDiagnosticRequests";

async function getRequestsDataSourceId(): Promise<number> {
  const form = await ngaugeStore.getFormById(REQUESTS_FORM_ID);
  return Number(form.dataSourceId ?? form.DataSourceId ?? 0);
}

/** Assigned diagnostic requests currently tied to a setup. */
export async function getAssignedRequestsForSetup(
  setupId: string,
): Promise<DiagnosticRequest[]> {
  const id = String(setupId ?? "").trim();
  if (!id) return [];

  const result = await ngaugeStore.getPaginatedData(
    REQUESTS_FORM_ID,
    REQUESTS_TABLE,
    1,
    500,
    {
      setup_id: [{ items: [id], operator: "equals" }],
      status: [{ items: ["Assigned"], operator: "equals" }],
    },
  );

  return result.data.map(transformRowToRequest);
}

/** Assigned diagnostic request ids currently tied to a setup. */
export async function getAssignedRequestIdsForSetup(
  setupId: string,
): Promise<string[]> {
  const requests = await getAssignedRequestsForSetup(setupId);
  return requests.map((request) => request.id).filter(Boolean);
}

/**
 * Move Assigned patients for a setup back to the awaiting queue as Re-Scheduled.
 */
export async function reAllocatePatientsBackToQueue(
  requestIds: string[],
): Promise<boolean> {
  const ids = (requestIds ?? [])
    .map((requestId) => String(requestId ?? "").trim())
    .filter(Boolean);
  if (ids.length === 0) return true;

  try {
    const dataSourceId = await getRequestsDataSourceId();
    if (!dataSourceId) {
      console.error(
        "reAllocatePatientsBackToQueue: missing dataSourceId for form",
        REQUESTS_FORM_ID,
      );
      return false;
    }
    return await ngaugeStore.reAllocatePatientsBackToQueue(dataSourceId, ids);
  } catch (error) {
    console.error("reAllocatePatientsBackToQueue failed:", error);
    return false;
  }
}

/** Re-allocate all Assigned requests on a setup when it is marked Inactive. */
export async function reAllocateAssignedPatientsForSetup(
  setupId: string,
): Promise<{ ok: boolean; count: number }> {
  const requestIds = await getAssignedRequestIdsForSetup(setupId);
  if (requestIds.length === 0) {
    return { ok: true, count: 0 };
  }
  const ok = await reAllocatePatientsBackToQueue(requestIds);
  return { ok, count: requestIds.length };
}
