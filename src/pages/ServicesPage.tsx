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
  useServices,
  serviceTotal,
  SERVICES_FORM_ID,
  SERVICES_TABLE,
  type Service,
} from "@/hooks/useServices";
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
  { value: "MRI", label: "MRI" },
  { value: "CT", label: "CT" },
  { value: "X-Ray", label: "X-Ray" },
];

export function ServicesPage() {
  const navigate = useNavigate();
  const { setChrome } = usePageChrome();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const addAction = useMemo(
    () => <AddActionButton to="/services/new" label="Add Service" />,
    [],
  );

  useEffect(() => {
    setChrome({
      title: "Service Master",
      subtitle: "Directory of diagnostic services",
      headerStatsHtml: "",
      actions: addAction,
    });
  }, [setChrome, addAction]);

  const apiFilters = useMemo((): FiltersType | undefined => {
    const next: FiltersType = {};
    const q = search.trim();
    if (q) {
      next.name = [{ items: [q], operator: "contains" }];
    }
    if (type) {
      next.service_type = [{ items: [type], operator: "equals" }];
    }
    if (status === "active") {
      next.active = [{ items: ["true"], operator: "equals" }];
    } else if (status === "inactive") {
      next.active = [{ items: ["false"], operator: "equals" }];
    }
    return Object.keys(next).length > 0 ? next : undefined;
  }, [search, type, status]);

  const {
    data: services,
    totalRowCount,
    isLoading,
    error,
    refetch,
  } = useServices(page, LIMIT, apiFilters);

  const { mutate: deleteRow, isPending: isDeleting } = useDeleteRow();

  useEffect(() => {
    setPage(1);
  }, [apiFilters]);

  const stats = useMemo(() => {
    const active = services.filter((s) => s.active).length;
    const avg = services.length
      ? Math.round(
          services.reduce((sum, s) => sum + serviceTotal(s), 0) / services.length,
        )
      : 0;
    return [
      { label: "Total Services", value: totalRowCount },
      { label: "Active (page)", value: active },
      { label: "Inactive (page)", value: services.length - active },
      { label: "Avg Slot Duration", value: `${avg} min` },
    ];
  }, [services, totalRowCount]);

  const hasActive = Boolean(search || type || status);
  const clear = () => {
    setSearch("");
    setType("");
    setStatus("");
    setPage(1);
  };

  const pageCount = Math.max(1, Math.ceil(totalRowCount / LIMIT));
  const rangeStart = services.length === 0 ? 0 : (page - 1) * LIMIT + 1;
  const rangeEnd = (page - 1) * LIMIT + services.length;

  const handleConfirmDelete = () => {
    if (!deleteTarget?.id) return;
    setDeleteError(null);
    deleteRow(
      {
        formId: SERVICES_FORM_ID,
        tableName: SERVICES_TABLE,
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
            err instanceof Error ? err.message : "Failed to delete service",
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
          label="Search by service name"
          placeholder="Search by service name"
          value={search}
          onChange={setSearch}
        />
        <FilterSelect
          label="Service type"
          value={type}
          onChange={setType}
          options={TYPE_OPTIONS}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </FiltersCard>

      {error ? (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          title="Error loading services"
        >
          {error instanceof Error
            ? error.message
            : "Failed to load services from Infoveave"}
        </Alert>
      ) : null}

      <ResultsBar
        shown={services.length}
        total={totalRowCount}
        entity="services"
        suffix={totalRowCount > 0 ? ` (rows ${rangeStart}-${rangeEnd})` : ""}
      />

      <DataTableShell>
        <table className="data-table">
          <thead>
            <tr>
              <th>Service name</th>
              <th>Service type</th>
              <th>Lead</th>
              <th>Procedure</th>
              <th>Lag</th>
              <th>Total</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && services.length === 0 ? (
              <TableSkeletonRows columns={8} />
            ) : services.length === 0 ? (
              <TableEmptyRow
                columns={8}
                message="No services match your filters."
                onClear={clear}
              />
            ) : (
              services.map((service) => (
                <tr
                  key={service.id || service.name}
                  className={service.active ? undefined : "row-inactive"}
                >
                  <td className="text-strong">{service.name}</td>
                  <td>
                    <ProtoBadge text={service.type || "—"} />
                  </td>
                  <td className="text-muted">{service.lead} min</td>
                  <td className="text-muted">{service.procedure} min</td>
                  <td className="text-muted">{service.lag} min</td>
                  <td style={{ fontWeight: 600 }}>{serviceTotal(service)} min</td>
                  <td>
                    <ProtoBadge
                      text={service.active ? "Active" : "Inactive"}
                      variant={service.active ? "Active" : "Inactive"}
                    />
                  </td>
                  <td>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Edit">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="orange"
                          aria-label={`Edit ${service.name}`}
                          onClick={() =>
                            navigate(`/services/${service.id}/edit`)
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
                          aria-label={`Delete ${service.name}`}
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(service);
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
        title="Delete service"
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
          <Button
            color="red"
            loading={isDeleting}
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
