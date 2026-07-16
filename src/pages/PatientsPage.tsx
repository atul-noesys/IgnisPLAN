import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Group,
  Pagination,
  Modal,
  Text,
  Button,
  Tooltip,
} from "@mantine/core";
import { IconAlertCircle, IconEdit, IconTrash } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { usePageChrome } from "@/store/PageChromeContext";
import { useDeleteRow } from "@/hooks/useDeleteRow";
import {
  usePatients,
  PATIENTS_FORM_ID,
  PATIENTS_TABLE,
  type Patient,
} from "@/hooks/usePatients";
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

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "Inpatient", label: "Inpatient" },
  { value: "Outpatient", label: "Outpatient" },
  { value: "Emergency", label: "Emergency" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All severities" },
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
];

export function PatientsPage() {
  const navigate = useNavigate();
  const { setChrome } = usePageChrome();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [patientType, setPatientType] = useState("");
  const [priority, setPriority] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const addAction = useMemo(
    () => <AddActionButton to="/patients/new" label="Add Patient" />,
    [],
  );

  useEffect(() => {
    setChrome({
      title: "Patient List",
      subtitle: "Directory of registered patients",
      headerStatsHtml: "",
      actions: addAction,
    });
  }, [setChrome, addAction]);

  const apiFilters = useMemo((): FiltersType | undefined => {
    const next: FiltersType = {};
    const q = search.trim();
    if (q) {
      // Search primarily by name; patientid matches use contains on name field too via OR isn't supported —
      // apply name contains; user can also filter by typing patientid into patientname if backend only has one field.
      // Prefer patientname contains for general search.
      next.patientname = [{ items: [q], operator: "contains" }];
    }
    if (patientType) {
      next.patient_type = [{ items: [patientType], operator: "equals" }];
    }
    if (priority) {
      next.priority = [{ items: [priority], operator: "equals" }];
    }
    return Object.keys(next).length > 0 ? next : undefined;
  }, [search, patientType, priority]);

  const {
    data: patients,
    totalRowCount,
    isLoading,
    error,
    refetch,
  } = usePatients(page, LIMIT, apiFilters);

  const { mutate: deleteRow, isPending: isDeleting } = useDeleteRow();

  useEffect(() => {
    setPage(1);
  }, [apiFilters]);

  const stats = useMemo(() => {
    const inpatient = patients.filter((p) => p.patientType === "Inpatient").length;
    const outpatient = patients.filter((p) => p.patientType === "Outpatient").length;
    const high = patients.filter(
      (p) => p.priority === "High" || p.priority === "Critical",
    ).length;
    return [
      { label: "Total Patients", value: totalRowCount },
      { label: "Inpatient (page)", value: inpatient },
      { label: "Outpatient (page)", value: outpatient },
      { label: "High / Critical (page)", value: high },
    ];
  }, [patients, totalRowCount]);

  const hasActive = Boolean(search || patientType || priority);
  const clear = () => {
    setSearch("");
    setPatientType("");
    setPriority("");
    setPage(1);
  };

  const pageCount = Math.max(1, Math.ceil(totalRowCount / LIMIT));
  const rangeStart = patients.length === 0 ? 0 : (page - 1) * LIMIT + 1;
  const rangeEnd = (page - 1) * LIMIT + patients.length;

  const handleConfirmDelete = () => {
    if (!deleteTarget?.patientId) return;
    setDeleteError(null);
    deleteRow(
      {
        formId: PATIENTS_FORM_ID,
        tableName: PATIENTS_TABLE,
        rowId: deleteTarget.patientId,
        primaryKey: "patientid",
      },
      {
        onSuccess: async () => {
          setDeleteTarget(null);
          await refetch();
        },
        onError: (err) => {
          setDeleteError(
            err instanceof Error ? err.message : "Failed to delete patient",
          );
        },
      },
    );
  };

  return (
    <div className="page-stack">
      <StatsGrid cards={stats} />

      <FiltersCard hasActive={hasActive} onClear={clear}>
        <FilterSearch
          label="Search patients"
          placeholder="Search by patient name"
          value={search}
          onChange={setSearch}
        />
        <FilterSelect
          label="Patient type"
          value={patientType}
          onChange={setPatientType}
          options={TYPE_OPTIONS}
        />
        <FilterSelect
          label="Severity"
          value={priority}
          onChange={setPriority}
          options={PRIORITY_OPTIONS}
        />
      </FiltersCard>

      {error ? (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          title="Error loading patients"
        >
          {error instanceof Error
            ? error.message
            : "Failed to load patients from Infoveave"}
        </Alert>
      ) : null}

      <ResultsBar
        shown={patients.length}
        total={totalRowCount}
        entity="patients"
        suffix={totalRowCount > 0 ? ` (rows ${rangeStart}-${rangeEnd})` : ""}
      />

      <DataTableShell>
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Type</th>
              <th>Diagnosis</th>
              <th>Severity</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && patients.length === 0 ? (
              <TableSkeletonRows columns={9} />
            ) : patients.length === 0 ? (
              <TableEmptyRow
                columns={9}
                message="No patients match your search."
                onClear={clear}
              />
            ) : (
              patients.map((patient) => (
                <tr key={patient.patientId || patient.patientName}>
                  <td className="text-strong">{patient.patientId}</td>
                  <td>{patient.patientName}</td>
                  <td className="text-muted">{patient.age}</td>
                  <td className="text-muted">{patient.gender}</td>
                  <td>
                    <ProtoBadge text={patient.patientType || "—"} />
                  </td>
                  <td>{patient.diagnosis || "—"}</td>
                  <td>
                    <ProtoBadge text={patient.priority || "—"} />
                  </td>
                  <td className="text-muted">{patient.department || "—"}</td>
                  <td>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Edit">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="orange"
                          aria-label={`Edit ${patient.patientName}`}
                          onClick={() =>
                            navigate(`/patients/${patient.patientId}/edit`)
                          }
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          aria-label={`Delete ${patient.patientName}`}
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(patient);
                          }}
                        >
                          <IconTrash size={16} />
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

      <Modal
        opened={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        title="Delete patient"
        centered
      >
        <Text size="sm" mb="md">
          Delete <strong>{deleteTarget?.patientName}</strong> (
          {deleteTarget?.patientId})? This cannot be undone.
        </Text>
        {deleteError ? (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            mb="md"
            title="Delete failed"
          >
            {deleteError}
          </Alert>
        ) : null}
        <Group justify="flex-end">
          <Button
            variant="default"
            disabled={isDeleting}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button color="red" loading={isDeleting} onClick={handleConfirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
