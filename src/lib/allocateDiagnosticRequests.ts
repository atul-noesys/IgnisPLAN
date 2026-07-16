import { ngaugeStore } from "@/store/ngauge-store";
import { REQUESTS_FORM_ID } from "@/hooks/useDiagnosticRequests";

/**
 * Resolve form 39 data source, then UPDATE hosp_diagnostic_requests → Assigned.
 */
export async function allocateDiagnosticRequests(
  requestIds: string[],
): Promise<boolean> {
  const ids = (requestIds ?? []).map((id) => String(id ?? "").trim()).filter(Boolean);
  if (ids.length === 0) return false;

  try {
    const form = await ngaugeStore.getFormById(REQUESTS_FORM_ID);
    const dataSourceId = Number(form.dataSourceId ?? form.DataSourceId ?? 0);
    if (!dataSourceId) {
      console.error("allocateDiagnosticRequests: missing dataSourceId for form", REQUESTS_FORM_ID);
      return false;
    }
    return await ngaugeStore.allocatePatients(dataSourceId, ids);
  } catch (error) {
    console.error("allocateDiagnosticRequests failed:", error);
    return false;
  }
}
