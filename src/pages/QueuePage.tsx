import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Group,
  Pagination,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCalendarEvent,
  IconX,
} from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { usePageChrome } from "@/store/PageChromeContext";
import { useServices } from "@/hooks/useServices";
import { usePatientsByIds } from "@/hooks/usePatients";
import { useQueueSearchPatientFilter } from "@/hooks/useQueueSearchPatientFilter";
import {
  useDiagnosticRequests,
  requestPriorityScore,
  type DiagnosticRequest,
} from "@/hooks/useDiagnosticRequests";
import type { FiltersType } from "@/hooks/useNgaugePaginatedData";
import {
  AddActionButton,
  DataTableShell,
  FilterSearch,
  FilterSelect,
  FiltersCard,
  ProtoBadge,
  ResultsBar,
  StatsGrid,
  TableEmptyRow,
  TableSkeletonRows,
} from "./listShared";

const LIMIT = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Re-Scheduled", label: "Re-Scheduled" },
  { value: "Assigned", label: "Assigned" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "All severities" },
  { value: "Critical", label: "Critical" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

export function QueuePage() {
  const navigate = useNavigate();
  const { setChrome } = usePageChrome();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [status, setStatus] = useState("Pending");
  const [severity, setSeverity] = useState("");

  const addAction = useMemo(
    () => <AddActionButton to="/requests/new" label="New Request" />,
    [],
  );

  useEffect(() => {
    setChrome({
      title: "Patients Queue",
      subtitle: "Priority backlog — assign slots or cancel via dedicated pages",
      headerStatsHtml: "",
      actions: addAction,
    });
  }, [setChrome, addAction]);

  const { data: services } = useServices(1, 200);

  const serviceNameById = useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach((s) => {
      if (s.id) map[s.id] = s.name;
    });
    return map;
  }, [services]);

  const serviceOptions = useMemo(
    () => [
      { value: "", label: "All services" },
      ...services
        .filter((s) => s.active && s.id)
        .map((s) => ({ value: s.id, label: s.name || s.id })),
    ],
    [services],
  );

  const { searchFilters } = useQueueSearchPatientFilter(search);

  const apiFilters = useMemo((): FiltersType | undefined => {
    const next: FiltersType = { ...(searchFilters ?? {}) };
    if (serviceId) {
      next.service_id = [{ items: [serviceId], operator: "equals" }];
    }
    if (status) {
      next.status = [{ items: [status], operator: "equals" }];
    }
    if (severity) {
      next.severity = [{ items: [severity], operator: "equals" }];
    }
    return Object.keys(next).length > 0 ? next : undefined;
  }, [searchFilters, serviceId, status, severity]);

  const {
    data: requests,
    totalRowCount,
    isLoading,
    error,
  } = useDiagnosticRequests(page, LIMIT, apiFilters);

  const requestIdsKey = requests
    .map((r) => (r.patientId || "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join("|");

  const requestPatientIds = useMemo(
    () => (requestIdsKey ? requestIdsKey.split("|") : []),
    [requestIdsKey],
  );

  // Type (Inpatient/Outpatient) still comes from Patient_Master join.
  const {
    byId: patientById,
    isLoading: patientsLoading,
    isReady: patientsReady,
  } = usePatientsByIds(requestPatientIds);

  useEffect(() => {
    setPage(1);
  }, [apiFilters]);

  const mappingReady =
    !isLoading &&
    (requests.length === 0 || (patientsReady && !patientsLoading));

  const enriched = useMemo(() => {
    if (!mappingReady) return [];
    return requests
      .filter((r) => r.status !== "Cancelled")
      .map((request) => {
        const key = (request.patientId || "").trim();
        const patient = patientById[key] ?? patientById[key.toUpperCase()];
        return {
          request,
          patientType: patient?.patientType || request.patientType || "",
          score: requestPriorityScore(request, patient?.patientType),
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.request.requestedDate.localeCompare(b.request.requestedDate);
      });
  }, [requests, patientById, mappingReady]);

  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === "Pending").length;
    const assigned = requests.filter((r) => r.status === "Assigned").length;
    const highPriority = requests.filter((r) => {
      const p = (r.severity || "").toLowerCase();
      return p === "high" || p === "critical";
    }).length;
    return [
      { label: "Total Requests", value: totalRowCount },
      { label: "Pending (page)", value: pending },
      { label: "Assigned (page)", value: assigned },
      { label: "High / Critical (page)", value: highPriority },
    ];
  }, [requests, totalRowCount]);

  const hasActive = Boolean(
    search || serviceId || status !== "Pending" || severity,
  );
  const clear = () => {
    setSearch("");
    setServiceId("");
    setStatus("Pending");
    setSeverity("");
    setPage(1);
  };

  const pageCount = Math.max(1, Math.ceil(totalRowCount / LIMIT));
  const rangeStart = enriched.length === 0 ? 0 : (page - 1) * LIMIT + 1;
  const rangeEnd = (page - 1) * LIMIT + enriched.length;

  const openAssign = (request: DiagnosticRequest) => {
    sessionStorage.setItem("assignRequestId", request.id);
    navigate(`/assign-slot?requestId=${encodeURIComponent(request.id)}`);
  };

  return (
    <div className="page-stack">
      <StatsGrid cards={stats} />

      <FiltersCard hasActive={hasActive} onClear={clear}>
        <FilterSearch
          label="Search queue"
          placeholder="Search by patient ID or name"
          value={search}
          onChange={setSearch}
        />
        <FilterSelect
          label="Service"
          value={serviceId}
          onChange={setServiceId}
          options={serviceOptions}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
        />
        <FilterSelect
          label="Severity"
          value={severity}
          onChange={setSeverity}
          options={SEVERITY_OPTIONS}
        />
      </FiltersCard>

      {error ? (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          title="Error loading queue"
        >
          {error instanceof Error
            ? error.message
            : "Failed to load diagnostic requests"}
        </Alert>
      ) : null}

      <ResultsBar
        shown={enriched.length}
        total={totalRowCount}
        entity="requests"
        suffix={
          totalRowCount > 0
            ? ` (rows ${rangeStart}-${rangeEnd}, priority sorted)`
            : ""
        }
      />

      <DataTableShell>
        <table className="data-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Patient</th>
              <th>Service / Setup</th>
              <th>Requested date</th>
              <th>Window</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading || !mappingReady ? (
              <TableSkeletonRows columns={9} />
            ) : enriched.length === 0 ? (
              <TableEmptyRow
                columns={9}
                message="No requests match your filters."
                onClear={clear}
              />
            ) : (
              enriched.map(({ request, patientType, score }, index) => (
                <tr key={request.id}>
                  <td>
                    <span
                      className={
                        score >= 100
                          ? "priority-rank priority-rank-high"
                          : "priority-rank"
                      }
                    >
                      #{(page - 1) * LIMIT + index + 1}
                    </span>
                  </td>
                  <td>
                    <div className="table-patient-cell">
                      <span className="table-patient-name">
                        {request.patientName || "—"}
                      </span>
                      <span className="table-patient-id">
                        {request.patientId || "—"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="table-patient-cell">
                      <span className="table-patient-name">
                        {serviceNameById[request.serviceId] ||
                          request.serviceId ||
                          "—"}
                      </span>
                      {request.setupId ? (
                        <span className="table-patient-id">{request.setupId}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="text-muted">{request.requestedDate || "—"}</td>
                  <td className="text-muted">
                    {request.preferredWindow || "—"}
                  </td>
                  <td>
                    {patientType ? <ProtoBadge text={patientType} /> : "—"}
                  </td>
                  <td>
                    {request.severity ? (
                      <ProtoBadge text={request.severity} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <ProtoBadge text={request.status || "—"} />
                  </td>
                  <td>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip
                        label={
                          request.status === "Assigned" ? "Reassign" : "Assign"
                        }
                      >
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="orange"
                          aria-label="Assign slot"
                          onClick={() => openAssign(request)}
                        >
                          <IconCalendarEvent size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Cancel">
                        <ActionIcon
                          component={Link}
                          to={`/requests/${encodeURIComponent(request.id)}/cancel`}
                          size="sm"
                          variant="subtle"
                          color="red"
                          aria-label="Cancel request"
                        >
                          <IconX size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DataTableShell>

      {pageCount > 1 ? (
        <Group justify="center" mt="md">
          <Pagination value={page} onChange={setPage} total={pageCount} />
        </Group>
      ) : null}
    </div>
  );
}
