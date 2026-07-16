import { useMemo } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import type { FiltersType } from "@/hooks/useNgaugePaginatedData";

/**
 * Heuristic: patient id vs full name.
 * - PAT… / ids with digits and no spaces → patient_id
 * - otherwise → patientname on the request row
 */
export function looksLikePatientId(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  if (/\s/.test(q)) return false;
  if (/^PAT/i.test(q)) return true;
  return /[0-9]/.test(q) && /^[A-Za-z0-9_-]+$/.test(q);
}

/**
 * Build request-table search filters from queue search text.
 * Uses denormalized patientname / patient_id on hosp_diagnostic_requests
 * (no Patient_Master lookup).
 */
export function useQueueSearchPatientFilter(search: string) {
  const [debounced] = useDebouncedValue(search.trim(), 500);

  const searchFilters = useMemo((): FiltersType | undefined => {
    if (!debounced) return undefined;
    if (looksLikePatientId(debounced)) {
      return {
        patient_id: [{ items: [debounced], operator: "contains" }],
      };
    }
    return {
      patientname: [{ items: [debounced], operator: "contains" }],
    };
  }, [debounced]);

  return {
    searchFilters,
    /** No async resolve needed — fields are on the request row */
    isResolving: false,
    debouncedSearch: debounced,
    /** @deprecated kept for callers; unused with denormalized rows */
    patientIdFilter: undefined as FiltersType["patient_id"] | undefined,
  };
}
