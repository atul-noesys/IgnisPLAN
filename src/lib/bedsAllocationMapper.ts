import { type Bed } from "@/hooks/useBeds";
import type { CurrentAllocation } from "@/hooks/useCurrentAllocations";
import {
  getAllocationCategory,
  isConfirmedAllocation,
  isNullishField,
  parseAdmissionDatetime,
} from "@/hooks/useCurrentAllocations";

function slugId(prefix: string, label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${prefix}-${slug || "unknown"}`;
}

function addDaysISO(dateStr: string, days: number): string {
  const parts = dateStr.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return dateStr;
  }
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function losStayDays(allocation: CurrentAllocation): number | null {
  const los = Number(allocation.los);
  if (!Number.isFinite(los) || los <= 0) return null;
  if (los < 1) return 1;
  return Math.max(1, Math.ceil(los));
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generatedBedId(name: string): string {
  const slug = slugify(name);
  return `bed-${slug || ""}`;
}

export function resolveBedId(rawBedId: string, beds: Bed[]): string {
  const id = String(rawBedId ?? "").trim();
  if (!id) return "";

  const exact = beds.find((bed) => bed.id === id);
  if (exact) return exact.id;

  const lower = id.toLowerCase();
  const byId = beds.find((bed) => bed.id.toLowerCase() === lower);
  if (byId) return byId.id;

  const byName = beds.find(
    (bed) => bed.name === id || bed.name.toLowerCase() === lower,
  );
  if (byName) return byName.id;

  const byGenerated = beds.find((bed) => {
    const generated = generatedBedId(bed.name);
    return generated === id || generated.toLowerCase() === lower;
  });
  if (byGenerated) return byGenerated.id;

  if (lower.startsWith("bed-")) {
    const suffix = lower.slice(4);
    const bySuffix = beds.find(
      (bed) => slugify(bed.name) === suffix || slugify(bed.id) === suffix,
    );
    if (bySuffix) return bySuffix.id;
  }

  return id;
}

function mapSeverity(allocation: CurrentAllocation): string {
  const severity = (allocation.severity || "").trim();
  if (severity) {
    if (severity.toLowerCase() === "medium") return "Moderate";
    return severity;
  }
  const acuity = Number(allocation.acuityAtAdmission);
  if (acuity >= 4) return "Critical";
  if (acuity >= 3) return "High";
  if (acuity >= 2) return "Moderate";
  return "Low";
}

function carePlan(allocation: CurrentAllocation) {
  const los = Number(allocation.los);
  const losDays = losStayDays(allocation);

  if (losDays !== null) {
    if (los > 0 && los < 1) {
      return {
        bookingMode: "Hourly" as const,
        expectedDays: 1,
        expectedMinutes: Math.max(30, Math.round(los * 24 * 60)),
      };
    }
    return {
      bookingMode: "Daily" as const,
      expectedDays: losDays,
      expectedMinutes: 0,
    };
  }

  const hours = Number(allocation.estimatedCareHours);
  if (Number.isFinite(hours) && hours > 0 && hours <= 4) {
    return {
      bookingMode: "Hourly" as const,
      expectedDays: 1,
      expectedMinutes: Math.max(60, Math.round(hours * 60)),
    };
  }

  const dayEstimate =
    Number.isFinite(hours) && hours > 0 ? Math.max(1, Math.ceil(hours / 24)) : 1;
  return {
    bookingMode: "Daily" as const,
    expectedDays: dayEstimate,
    expectedMinutes: 0,
  };
}

/** dischargeDate is exclusive (prototype stay model). End slot = admission + los days. */
function dischargeDateFor(allocation: CurrentAllocation, fallbackDays: number): string {
  const admit = allocation.admissionDate;
  if (!admit) return "";

  const losDays = losStayDays(allocation);
  if (losDays !== null) {
    return addDaysISO(admit, losDays);
  }

  const discharge = parseAdmissionDatetime(allocation.dischargeDatetime);
  if (discharge.date) return discharge.date;

  return addDaysISO(admit, Math.max(1, fallbackDays));
}

function endTimeFromStart(startTime: string, durationMinutes: number): string {
  const [hh, mm] = startTime.split(":").map((part) => Number(part));
  const startTotal = (hh || 0) * 60 + (mm || 0);
  const endTotal = startTotal + durationMinutes;
  const endHour = Math.floor(endTotal / 60);
  const endMinute = endTotal % 60;
  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
}

export function toStorePatientFromAllocation(allocation: CurrentAllocation) {
  const id = allocation.patientId;
  return {
    id,
    mrn: id,
    name: allocation.patientName || id,
    age: 0,
    gender: "",
    patientType: "Inpatient",
    disease: "",
    severity: mapSeverity(allocation),
  };
}

export function toStoreDepartmentFromAllocation(allocation: CurrentAllocation) {
  const name = (allocation.department || "General").trim() || "General";
  return {
    id: slugId("dept", name),
    name,
    status: "Active",
  };
}

export function toStoreBedRequestFromAllocation(allocation: CurrentAllocation) {
  const deptName = (allocation.department || "General").trim() || "General";
  const plan = carePlan(allocation);
  return {
    id: allocation.recordId,
    patientId: allocation.patientId,
    departmentId: slugId("dept", deptName),
    preferredWardType: "General",
    requestedAdmitDate: allocation.admissionDate,
    expectedDays: plan.expectedDays,
    status: "Pending",
    bookingMode: plan.bookingMode,
    ...(plan.bookingMode === "Hourly"
      ? {
          expectedMinutes: plan.expectedMinutes,
          preferredStartTime: allocation.admissionTime || "",
        }
      : {}),
  };
}

export function toStoreAllotmentFromAllocation(
  allocation: CurrentAllocation,
  beds: Bed[] = [],
) {
  const plan = carePlan(allocation);
  const bedId = resolveBedId(allocation.bedId, beds);
  const staffName = allocation.staffName?.trim()
    ? allocation.staffName.trim()
    : !isNullishField(allocation.staffId)
      ? allocation.staffId.trim()
      : "Unknown";
  const allotment: Record<string, unknown> = {
    id: `allot-${allocation.recordId}`,
    bedRequestId: allocation.recordId,
    patientId: allocation.patientId,
    bedId,
    admitDate: allocation.admissionDate,
    dischargeDate: dischargeDateFor(allocation, plan.expectedDays),
    status: "Confirmed",
    bookingMode: plan.bookingMode,
    staffId: allocation.staffId,
    staffName,
    staffname: staffName,
    role: allocation.role,
  };

  if (plan.bookingMode === "Hourly") {
    const start = allocation.admissionTime || "08:00";
    allotment.startTime = start;
    allotment.endTime = endTimeFromStart(start, plan.expectedMinutes || 120);
  }

  return allotment;
}

export function buildBedsQueueFromAllocations(
  allocations: CurrentAllocation[],
  beds: Bed[] = [],
) {
  const patientSeen = new Set<string>();
  const deptSeen = new Map<string, ReturnType<typeof toStoreDepartmentFromAllocation>>();
  const bedRequests: ReturnType<typeof toStoreBedRequestFromAllocation>[] = [];
  const allotments: ReturnType<typeof toStoreAllotmentFromAllocation>[] = [];
  const patients: ReturnType<typeof toStorePatientFromAllocation>[] = [];

  for (const allocation of allocations) {
    if (!allocation.recordId || !allocation.patientId) continue;

    const dept = toStoreDepartmentFromAllocation(allocation);
    deptSeen.set(dept.id, dept);

    const patientKey = allocation.patientId.toUpperCase();
    if (!patientSeen.has(patientKey)) {
      patientSeen.add(patientKey);
      patients.push(toStorePatientFromAllocation(allocation));
    }

    switch (getAllocationCategory(allocation)) {
      case "awaiting":
        bedRequests.push(toStoreBedRequestFromAllocation(allocation));
        break;
      case "confirmed":
        allotments.push(toStoreAllotmentFromAllocation(allocation, beds));
        break;
      default:
        // staff only, no bed — not shown in queue or timeline
        break;
    }
  }

  return {
    bedRequests,
    allotments,
    patients,
    departments: [...deptSeen.values()],
  };
}

/** Add beds referenced by confirmed allocations that are missing from hosp_beds. */
export function mergeAllocationBeds(
  beds: Bed[],
  allocations: CurrentAllocation[],
): Bed[] {
  const merged = [...beds];
  const knownKeys = new Set<string>();

  for (const bed of merged) {
    knownKeys.add(bed.id.toLowerCase());
    if (bed.name) knownKeys.add(bed.name.toLowerCase());
  }

  for (const allocation of allocations) {
    if (!isConfirmedAllocation(allocation)) continue;

    const rawRef = allocation.bedId.trim();
    if (!rawRef) continue;

    const resolvedId = resolveBedId(rawRef, merged);
    const canonicalId = resolvedId || rawRef;
    const canonicalLower = canonicalId.toLowerCase();
    const rawLower = rawRef.toLowerCase();

    if (knownKeys.has(canonicalLower) || knownKeys.has(rawLower)) {
      continue;
    }

    const deptName = (allocation.department || "General").trim() || "General";
    const departmentId = slugId("dept", deptName);

    merged.push({
      id: canonicalId,
      wardId: `ward-${departmentId}-allocated`,
      name: rawRef,
      status: "Active",
      bookingMode: "Daily",
      wardName: `${deptName} Ward`,
      department: deptName,
    });

    knownKeys.add(canonicalLower);
    knownKeys.add(rawLower);
  }

  return merged;
}

/** True when a confirmed allotment occupies a calendar day (discharge is exclusive). */
export function allotmentOccupiesDate(
  allotment: { admitDate?: string; dischargeDate?: string; status?: string },
  date: string,
): boolean {
  if (!date || allotment.status === "Cancelled") return false;
  const admit = String(allotment.admitDate || "").slice(0, 10);
  const discharge = String(allotment.dischargeDate || "").slice(0, 10);
  if (!admit || !discharge) return false;
  return admit <= date && discharge > date;
}
