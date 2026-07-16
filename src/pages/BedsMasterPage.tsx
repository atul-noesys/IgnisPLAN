import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  Pagination,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconAlertCircle, IconEdit, IconTrash } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { UI } from "@/lib/prototype";
import { usePageChrome } from "@/store/PageChromeContext";
import { useDeleteRow } from "@/hooks/useDeleteRow";
import {
  useBeds,
  BED_ID_FIELD,
  BEDS_FORM_ID,
  BEDS_TABLE,
  type Bed,
} from "@/hooks/useBeds";
import type { FiltersType } from "@/hooks/useNgaugePaginatedData";
import {
  AddActionButton,
  DataTableShell,
  FilterSearch,
  FilterSelect,
  FiltersCard,
  ResultsBar,
  StatsGrid,
  TableEmptyRow,
  TableSkeletonRows,
} from "./listShared";

const LIMIT = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "Under Maintenance", label: "Under Maintenance" },
  { value: "Inactive", label: "Inactive" },
];

const BOOKING_MODE_OPTIONS = [
  { value: "", label: "All modes" },
  { value: "Daily", label: "Daily" },
  { value: "Hourly", label: "Hourly" },
];

export function BedsMasterPage() {
  const { setChrome } = usePageChrome();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [wardId, setWardId] = useState("");
  const [status, setStatus] = useState("");
  const [bookingMode, setBookingMode] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Bed | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const addAction = useMemo(
    () => <AddActionButton to="/bed-master/new" label="Add Bed" />,
    [],
  );

  useEffect(() => {
    setChrome({
      title: "Bed Master",
      subtitle: "Directory of hospital beds",
      headerStatsHtml: "",
      actions: addAction,
    });
  }, [setChrome, addAction]);

  const { data: allBeds } = useBeds(1, 100);

  const wardOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const bed of allBeds) {
      if (!bed.wardId) continue;
      if (!seen.has(bed.wardId)) {
        seen.set(bed.wardId, bed.wardName || bed.wardId);
      }
    }
    return [
      { value: "", label: "All wards" },
      ...[...seen.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, label]) => ({ value: id, label })),
    ];
  }, [allBeds]);

  const apiFilters = useMemo((): FiltersType | undefined => {
    const next: FiltersType = {};
    const q = search.trim();
    if (q) {
      next.name = [{ items: [q], operator: "contains" }];
    }
    if (wardId) {
      next.ward_id = [{ items: [wardId], operator: "equals" }];
    }
    if (status) {
      next.status = [{ items: [status], operator: "equals" }];
    }
    if (bookingMode) {
      next.booking_mode = [{ items: [bookingMode], operator: "equals" }];
    }
    return Object.keys(next).length > 0 ? next : undefined;
  }, [search, wardId, status, bookingMode]);

  const {
    data: beds,
    totalRowCount,
    isLoading,
    error,
    refetch,
  } = useBeds(page, LIMIT, apiFilters);

  const { mutate: deleteRow, isPending: isDeleting } = useDeleteRow();

  useEffect(() => {
    setPage(1);
  }, [apiFilters]);

  const stats = useMemo(() => {
    const active = beds.filter((b) => b.status === "Active").length;
    const maintenance = beds.filter(
      (b) => b.status === "Under Maintenance",
    ).length;
    const hourly = beds.filter((b) => b.bookingMode === "Hourly").length;
    return [
      { label: "Total Beds", value: totalRowCount },
      { label: "Active (page)", value: active },
      { label: "Under Maintenance (page)", value: maintenance },
      { label: "Hourly (page)", value: hourly },
    ];
  }, [beds, totalRowCount]);

  const hasActive = Boolean(search || wardId || status || bookingMode);
  const clear = () => {
    setSearch("");
    setWardId("");
    setStatus("");
    setBookingMode("");
    setPage(1);
  };

  const pageCount = Math.max(1, Math.ceil(totalRowCount / LIMIT));
  const rangeStart = beds.length === 0 ? 0 : (page - 1) * LIMIT + 1;
  const rangeEnd = (page - 1) * LIMIT + beds.length;

  const handleConfirmDelete = () => {
    if (!deleteTarget?.id) return;
    setDeleteError(null);
    deleteRow(
      {
        formId: BEDS_FORM_ID,
        tableName: BEDS_TABLE,
        rowId: deleteTarget.id,
        primaryKey: BED_ID_FIELD,
      },
      {
        onSuccess: async () => {
          setDeleteTarget(null);
          await refetch();
        },
        onError: (err) => {
          setDeleteError(
            err instanceof Error ? err.message : "Failed to delete bed",
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
          label="Search by bed name"
          placeholder="Search by bed name"
          value={search}
          onChange={setSearch}
        />
        <FilterSelect
          label="Ward"
          value={wardId}
          onChange={setWardId}
          options={wardOptions}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
        />
        <FilterSelect
          label="Booking mode"
          value={bookingMode}
          onChange={setBookingMode}
          options={BOOKING_MODE_OPTIONS}
        />
      </FiltersCard>

      {error ? (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          title="Error loading beds"
        >
          {error instanceof Error
            ? error.message
            : "Failed to load beds from Infoveave"}
        </Alert>
      ) : null}

      <ResultsBar
        shown={beds.length}
        total={totalRowCount}
        entity="beds"
        suffix={totalRowCount > 0 ? ` (rows ${rangeStart}-${rangeEnd})` : ""}
      />

      <DataTableShell>
        <table className="data-table data-table--beds">
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Bed ID</th>
              <th>Bed name</th>
              <th>Ward</th>
              <th>Status</th>
              <th>Booking mode</th>
              <th>Ward ID</th>
              <th className="table-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && beds.length === 0 ? (
              <TableSkeletonRows columns={7} />
            ) : beds.length === 0 ? (
              <TableEmptyRow
                columns={7}
                message="No beds match your filters."
                onClear={clear}
              />
            ) : (
              beds.map((bed) => (
                <tr
                  key={bed.id || bed.name}
                  className={
                    bed.status === "Inactive" ? "row-inactive" : undefined
                  }
                >
                  <td className="table-patient-id">{bed.id}</td>
                  <td className="text-strong">{bed.name}</td>
                  <td>{bed.wardName || "—"}</td>
                  <td>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: UI.setupStatusBadge(bed.status),
                      }}
                    />
                  </td>
                  <td className="text-muted">{bed.bookingMode || "—"}</td>
                  <td className="text-muted">{bed.wardId || "—"}</td>
                  <td className="table-col-actions">
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Edit">
                        <ActionIcon
                          component={Link}
                          to={
                            bed.id
                              ? `/bed-master/edit/${encodeURIComponent(bed.id)}`
                              : "#"
                          }
                          size="sm"
                          variant="subtle"
                          color="orange"
                          aria-label={`Edit ${bed.name}`}
                          aria-disabled={!bed.id}
                          style={!bed.id ? { pointerEvents: "none", opacity: 0.4 } : undefined}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          aria-label={`Delete ${bed.name}`}
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(bed);
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
        title="Delete bed"
        centered
      >
        <Text size="sm" mb="md">
          Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
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
