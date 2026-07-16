/**
 * Ngauge / Infoveave data layer — ported from IgnisGTM.
 *
 * Store: `@/store/ngauge-store`
 * Hooks:
 *   - useNgaugeData
 *   - useNgaugePaginatedData
 *   - useInfoveaveQuery
 *   - useAddRow
 *   - useDeleteRow
 *   - useNguageRowData (useRow)
 *   - useDistinctColumnItems
 *
 * Auth: methods read `access_token` from localStorage (same as IgnisGTM).
 * Tenant: `ignis` in DEV, `nooms` in production (see INFOVEAVE_TENANT).
 */
export { ngaugeStore } from "@/store/ngauge-store";
export type {
  NgaugeDataRow,
  PrimaryKeyData,
  PaginatedDataResponse,
  InfoveaveQueryRequest,
  ActionStats,
  ActionStatsResponse,
} from "@/store/ngauge-store";

export { useNgaugeData } from "@/hooks/useNgaugeData";
export type { UseNgaugeDataResult } from "@/hooks/useNgaugeData";

export { useNgaugePaginatedData } from "@/hooks/useNgaugePaginatedData";
export type {
  UseNgaugePaginatedDataResult,
  FiltersType,
} from "@/hooks/useNgaugePaginatedData";

export { useInfoveaveQuery } from "@/hooks/useInfoveaveQuery";
export type { UseInfoveaveQueryResult } from "@/hooks/useInfoveaveQuery";

export { useAddRow } from "@/hooks/useAddRow";
export { useDeleteRow } from "@/hooks/useDeleteRow";
export { useNguageRowData, ROW_QUERY_KEY } from "@/hooks/useRow";
export { useDistinctColumnItems } from "@/hooks/useDistinctColumnItems";

export {
  useAuthQuery,
  useAuthMutation,
  makeAuthenticatedRequest,
} from "@/hooks/useAuthQuery";

export { useAuth, AuthProvider } from "@/context/AuthContext";

export {
  useServices,
  SERVICES_FORM_ID,
  SERVICES_TABLE,
  transformRowToService,
  serviceTotal,
  generateServiceId,
  buildServiceRow,
} from "@/hooks/useServices";
export type { Service, ServiceRowPayload } from "@/hooks/useServices";

export {
  useSetups,
  SETUPS_FORM_ID,
  SETUPS_TABLE,
  transformRowToSetup,
  generateSetupId,
  buildSetupRow,
} from "@/hooks/useSetups";
export type { Setup, SetupRowPayload } from "@/hooks/useSetups";

export {
  usePatients,
  usePatientMap,
  usePatientsByIds,
  PATIENTS_FORM_ID,
  PATIENTS_TABLE,
  transformRowToPatient,
  generatePatientId,
  buildPatientRow,
} from "@/hooks/usePatients";
export type { Patient, PatientRowPayload } from "@/hooks/usePatients";

export {
  useDiagnosticRequests,
  REQUESTS_FORM_ID,
  REQUESTS_TABLE,
  transformRowToRequest,
  parseRequestedDateTime,
  generateRequestId,
  buildRequestRow,
  requestPriorityScore,
} from "@/hooks/useDiagnosticRequests";
export type {
  DiagnosticRequest,
  RequestRowPayload,
} from "@/hooks/useDiagnosticRequests";

export {
  useHydrateImagingQueue,
  toStoreSeverity,
  toStorePatient,
  toStorePatientFromRequest,
  toStoreRequest,
  toStoreService,
  toStoreSetup,
} from "@/hooks/useHydrateImagingQueue";

export {
  useHydrateImagingRange,
} from "@/hooks/useHydrateImagingRange";

export {
  useBeds,
  BEDS_FORM_ID,
  BEDS_TABLE,
  transformRowToBed,
  generateBedId,
  buildBedRow,
} from "@/hooks/useBeds";
export type { Bed, BedRowPayload } from "@/hooks/useBeds";

export {
  useHydrateBeds,
  toStoreBed,
  buildBedsInventory,
} from "@/hooks/useHydrateBeds";

export {
  useCurrentAllocations,
  ALLOCATIONS_FORM_ID,
  ALLOCATIONS_TABLE,
  transformRowToAllocation,
  isAwaitingAllocation,
  isConfirmedAllocation,
  parseAdmissionDatetime,
} from "@/hooks/useCurrentAllocations";
export type { CurrentAllocation } from "@/hooks/useCurrentAllocations";

export {
  buildBedsQueueFromAllocations,
  toStoreBedRequestFromAllocation,
  toStoreAllotmentFromAllocation,
} from "@/lib/bedsAllocationMapper";

export {
  toStoreBookingsFromAssigned,
  toStoreBookingFromAssigned,
  inferServiceType,
} from "@/lib/imagingLiveBookings";

export {
  useQueueSearchPatientFilter,
  looksLikePatientId,
} from "@/hooks/useQueueSearchPatientFilter";
