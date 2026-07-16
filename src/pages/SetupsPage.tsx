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
import { UI } from "@/lib/prototype";
import { usePageChrome } from "@/store/PageChromeContext";
import { useDeleteRow } from "@/hooks/useDeleteRow";
import { useServices } from "@/hooks/useServices";
import {
  useSetups,
  SETUPS_FORM_ID,
  SETUPS_TABLE,
  type Setup,
} from "@/hooks/useSetups";
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

export function SetupsPage() {
  const navigate = useNavigate();
  const { setChrome } = usePageChrome();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [status, setStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Setup | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const addAction = useMemo(
    () => <AddActionButton to="/setups/new" label="Add Setup" />,
    [],
  );

  useEffect(() => {
    setChrome({
      title: "Setup List",
      subtitle: "Directory of scanner setups",
      headerStatsHtml: "",
      actions: addAction,
    });
  }, [setChrome, addAction]);

  const { data: allServices } = useServices(1, 200);

  const serviceNameById = useMemo(() => {
    const map: Record<string, string> = {};
    allServices.forEach((s) => {
      if (s.id) map[s.id] = s.name;
    });
    return map;
  }, [allServices]);

  const serviceOptions = useMemo(
    () => [
      { value: "", label: "All services" },
      ...allServices
        .filter((s) => s.id)
        .map((s) => ({ value: s.id, label: s.name || s.id })),
    ],
    [allServices],
  );

  const apiFilters = useMemo((): FiltersType | undefined => {
    const next: FiltersType = {};
    const q = search.trim();
    if (q) {
      next.name = [{ items: [q], operator: "contains" }];
    }
    if (serviceId) {
      next.service_id = [{ items: [serviceId], operator: "equals" }];
    }
    if (status) {
      next.status = [{ items: [status], operator: "equals" }];
    }
    return Object.keys(next).length > 0 ? next : undefined;
  }, [search, serviceId, status]);

  const {
    data: setups,
    totalRowCount,
    isLoading,
    error,
    refetch,
  } = useSetups(page, LIMIT, apiFilters);

  const { mutate: deleteRow, isPending: isDeleting } = useDeleteRow();

  useEffect(() => {
    setPage(1);
  }, [apiFilters]);

  const stats = useMemo(() => {
    const active = setups.filter((s) => s.status === "Active").length;
    const maintenance = setups.filter(
      (s) => s.status === "Under Maintenance",
    ).length;
    const linked = new Set(setups.map((s) => s.serviceId).filter(Boolean)).size;
    return [
      { label: "Total Setups", value: totalRowCount },
      { label: "Active (page)", value: active },
      { label: "Under Maintenance (page)", value: maintenance },
      { label: "Linked Services (page)", value: linked },
    ];
  }, [setups, totalRowCount]);

  const hasActive = Boolean(search || serviceId || status);
  const clear = () => {
    setSearch("");
    setServiceId("");
    setStatus("");
    setPage(1);
  };

  const pageCount = Math.max(1, Math.ceil(totalRowCount / LIMIT));
  const rangeStart = setups.length === 0 ? 0 : (page - 1) * LIMIT + 1;
  const rangeEnd = (page - 1) * LIMIT + setups.length;

  const handleConfirmDelete = () => {
    if (!deleteTarget?.id) return;
    setDeleteError(null);
    deleteRow(
      {
        formId: SETUPS_FORM_ID,
        tableName: SETUPS_TABLE,
        rowId: deleteTarget.id,
        primaryKey: "id",
      },
      {
        onSuccess: async () => {
          setDeleteTarget(null);
          await refetch();
        },
        onError: (err) => {
          setDeleteError(
            err instanceof Error ? err.message : "Failed to delete setup",
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
          label="Search by setup name"
          placeholder="Search by setup name"
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
      </FiltersCard>

      {error ? (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          title="Error loading setups"
        >
          {error instanceof Error
            ? error.message
            : "Failed to load setups from Infoveave"}
        </Alert>
      ) : null}

      <ResultsBar
        shown={setups.length}
        total={totalRowCount}
        entity="setups"
        suffix={totalRowCount > 0 ? ` (rows ${rangeStart}-${rangeEnd})` : ""}
      />

      <DataTableShell>
        <table className="data-table data-table--setups">
          <colgroup>
            <col style={{ width: "16%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Setup name</th>
              <th>Service</th>
              <th>Equipment label</th>
              <th>Status</th>
              <th>Location</th>
              <th>Operator</th>
              <th className="table-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && setups.length === 0 ? (
              <TableSkeletonRows columns={7} />
            ) : setups.length === 0 ? (
              <TableEmptyRow
                columns={7}
                message="No setups match your filters."
                onClear={clear}
              />
            ) : (
              setups.map((setup) => (
                <tr
                  key={setup.id || setup.name}
                  className={
                    setup.status === "Inactive" ? "row-inactive" : undefined
                  }
                >
                  <td className="text-strong">{setup.name}</td>
                  <td>
                    {serviceNameById[setup.serviceId] ||
                      setup.serviceId ||
                      "—"}
                  </td>
                  <td className="text-muted">{setup.equipmentLabel || "—"}</td>
                  <td>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: UI.setupStatusBadge(setup.status),
                      }}
                    />
                  </td>
                  <td className="text-muted">{setup.location || "—"}</td>
                  <td className="text-muted">
                    {setup.defaultOperatorName || "—"}
                  </td>
                  <td className="table-col-actions">
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Edit">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="orange"
                          aria-label={`Edit ${setup.name}`}
                          onClick={() => navigate(`/setups/${setup.id}/edit`)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          aria-label={`Delete ${setup.name}`}
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(setup);
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
        title="Delete setup"
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
