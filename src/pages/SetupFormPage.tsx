import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useAddRow } from "@/hooks/useAddRow";
import { useNguageRowData } from "@/hooks/useRow";
import { useServices } from "@/hooks/useServices";
import {
  REQUESTS_FORM_ID,
  REQUESTS_TABLE,
  type DiagnosticRequest,
} from "@/hooks/useDiagnosticRequests";
import {
  SETUPS_FORM_ID,
  SETUPS_TABLE,
  buildSetupRow,
  generateSetupId,
  transformRowToSetup,
} from "@/hooks/useSetups";
import {
  getAssignedRequestsForSetup,
  reAllocateAssignedPatientsForSetup,
} from "@/lib/reAllocatePatientsBackToQueue";
import { NotFound, PageCard, SaveActions, useChrome } from "./_shared";

type FormValues = {
  name: string;
  serviceId: string;
  equipmentLabel: string;
  status: string;
  location: string;
  defaultOperatorId: string;
  defaultOperatorName: string;
};

function formatScheduleSlot(
  request: DiagnosticRequest,
  setupName: string,
): string {
  const date = request.requestedDate || "—";
  const time = request.requestedStartTime?.trim();
  const when = time ? `${date} ${time}` : date;
  return setupName ? `${when} · ${setupName}` : when;
}

export function SetupFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | undefined>();
  const [isReallocating, setIsReallocating] = useState(false);
  const [isCheckingAssigned, setIsCheckingAssigned] = useState(false);
  const [initialStatus, setInitialStatus] = useState("");
  const [inactiveConfirmOpen, setInactiveConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [assignedPatients, setAssignedPatients] = useState<DiagnosticRequest[]>(
    [],
  );

  const { mutate: saveRow, isPending, error: mutationError } = useAddRow();

  const {
    data: existingRow,
    isLoading: isLoadingRow,
    isError: isRowError,
  } = useNguageRowData(SETUPS_FORM_ID, SETUPS_TABLE, id ?? "", "id");

  const { data: services, isLoading: isLoadingServices } = useServices(1, 200);

  useChrome(
    isEdit ? "Edit Setup" : "Add Setup",
    isEdit ? "Update scanner setup" : "Create a scanner setup",
  );

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      serviceId: "",
      equipmentLabel: "",
      status: "Active",
      location: "",
      defaultOperatorId: "",
      defaultOperatorName: "",
    },
    validate: {
      name: (value) =>
        value.trim().length > 0 ? null : "Enter a setup name",
      serviceId: (value) => (value ? null : "Select a service"),
      equipmentLabel: (value) =>
        value.trim().length > 0 ? null : "Enter an equipment label",
      status: (value) => (value ? null : "Select a status"),
      location: (value) =>
        value.trim().length > 0 ? null : "Enter a location",
    },
  });

  const serviceOptions = useMemo(() => {
    const active = services.filter((s) => s.active || isEdit);
    const options = active.map((s) => ({
      value: s.id,
      label: s.name || s.id,
    }));
    // Keep current service visible when editing inactive services
    if (
      isEdit &&
      form.values.serviceId &&
      !options.some((o) => o.value === form.values.serviceId)
    ) {
      const match = services.find((s) => s.id === form.values.serviceId);
      options.unshift({
        value: form.values.serviceId,
        label: match?.name || form.values.serviceId,
      });
    }
    return options;
  }, [services, isEdit, form.values.serviceId]);

  const serviceNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const service of services) {
      map.set(service.id, service.name || service.id);
    }
    return map;
  }, [services]);

  const setupDisplayName = form.values.name.trim() || id || "this setup";

  useEffect(() => {
    if (!existingRow) return;
    const setup = transformRowToSetup(existingRow);
    setCreatedAt(setup.createdAt);
    setInitialStatus(setup.status || "Active");
    form.setValues({
      name: setup.name,
      serviceId: setup.serviceId,
      equipmentLabel: setup.equipmentLabel,
      status: setup.status || "Active",
      location: setup.location,
      defaultOperatorId: setup.defaultOperatorId,
      defaultOperatorName: setup.defaultOperatorName,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rehydrate when row loads
  }, [existingRow]);

  if (isEdit && isLoadingRow) {
    return (
      <Center py="xl">
        <Loader color="orange" />
      </Center>
    );
  }

  if (isEdit && (isRowError || !existingRow)) {
    return <NotFound back="/setups" label="Back to setups" />;
  }

  const saveSetup = (
    values: FormValues,
    options?: { reallocateAssigned?: boolean },
  ) => {
    const name = values.name.trim();
    const setupId = isEdit && id ? id : generateSetupId(name);

    const runSave = () => {
      const rowData = buildSetupRow({
        id: setupId,
        name,
        service_id: values.serviceId,
        equipment_label: values.equipmentLabel.trim(),
        status: values.status,
        location: values.location.trim(),
        default_operator_id: values.defaultOperatorId.trim(),
        default_operator_name: values.defaultOperatorName.trim(),
        created_at: isEdit ? createdAt : undefined,
      });

      saveRow(
        {
          formId: SETUPS_FORM_ID,
          tableName: SETUPS_TABLE,
          rowData,
          ...(isEdit
            ? { primaryKey: { primaryKey: "id", value: setupId } }
            : {}),
        },
        {
          onSuccess: async (result) => {
            if (result.success === false) {
              setSubmitError(result.error || "Failed to save setup");
              return;
            }
            await queryClient.invalidateQueries({
              queryKey: [REQUESTS_TABLE, REQUESTS_FORM_ID],
            });
            await queryClient.invalidateQueries({
              queryKey: [SETUPS_TABLE, SETUPS_FORM_ID],
            });
            navigate("/setups");
          },
          onError: (err) => {
            setSubmitError(
              err instanceof Error ? err.message : "Failed to save setup",
            );
          },
        },
      );
    };

    if (options?.reallocateAssigned && setupId) {
      setIsReallocating(true);
      void reAllocateAssignedPatientsForSetup(setupId)
        .then(({ ok, count }) => {
          if (!ok) {
            setSubmitError(
              count > 0
                ? `Could not move ${count} assigned patient(s) back to the queue.`
                : "Could not move assigned patients back to the queue.",
            );
            return;
          }
          runSave();
        })
        .finally(() => {
          setIsReallocating(false);
        });
      return;
    }

    runSave();
  };

  const handleSubmit = async (values: FormValues) => {
    setSubmitError(null);
    const setupId = isEdit && id ? id : generateSetupId(values.name.trim());

    if (
      isEdit &&
      setupId &&
      values.status === "Inactive" &&
      initialStatus !== "Inactive"
    ) {
      setIsCheckingAssigned(true);
      try {
        const assigned = await getAssignedRequestsForSetup(setupId);
        if (assigned.length > 0) {
          assigned.sort((a, b) => {
            const byDate = a.requestedDate.localeCompare(b.requestedDate);
            if (byDate !== 0) return byDate;
            return (a.requestedStartTime || "").localeCompare(
              b.requestedStartTime || "",
            );
          });
          setPendingValues(values);
          setAssignedPatients(assigned);
          setInactiveConfirmOpen(true);
          return;
        }
      } finally {
        setIsCheckingAssigned(false);
      }
    }

    saveSetup(values);
  };

  const handleConfirmInactive = () => {
    if (!pendingValues) return;
    const values = pendingValues;
    setInactiveConfirmOpen(false);
    setPendingValues(null);
    setAssignedPatients([]);
    saveSetup(values, { reallocateAssigned: true });
  };

  const handleCancelInactive = () => {
    if (isReallocating) return;
    setInactiveConfirmOpen(false);
    setPendingValues(null);
    setAssignedPatients([]);
  };

  const errorMessage =
    submitError ||
    (mutationError instanceof Error ? mutationError.message : null);

  return (
    <PageCard>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {errorMessage ? (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              title="Could not save setup"
            >
              {errorMessage}
            </Alert>
          ) : null}

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Setup name"
              required
              {...form.getInputProps("name")}
            />
            <Select
              label="Service"
              data={serviceOptions}
              required
              searchable
              disabled={isEdit || isLoadingServices}
              {...form.getInputProps("serviceId")}
            />
            <TextInput
              label="Equipment label"
              required
              {...form.getInputProps("equipmentLabel")}
            />
            <Select
              label="Status"
              data={["Active", "Inactive", "Under Maintenance"]}
              {...form.getInputProps("status")}
            />
            <TextInput
              label="Location"
              required
              {...form.getInputProps("location")}
            />
            <TextInput
              label="Default operator ID"
              placeholder="op-002"
              {...form.getInputProps("defaultOperatorId")}
            />
            <TextInput
              label="Default operator name"
              placeholder="Sullivan"
              {...form.getInputProps("defaultOperatorName")}
            />
          </SimpleGrid>
        </Stack>
        <SaveActions
          cancelTo="/setups"
          label={isEdit ? "Update" : "Save"}
          loading={isPending || isReallocating || isCheckingAssigned}
        />
      </form>

      <Modal
        opened={inactiveConfirmOpen}
        onClose={handleCancelInactive}
        title="Re-schedule assigned patients?"
        centered
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm">
            Marking <strong>{setupDisplayName}</strong> as Inactive will remove
            it from the imaging schedule. The following{" "}
            {assignedPatients.length === 1 ? "patient is" : "patients are"}{" "}
            currently assigned on this setup:
          </Text>

          <Table className="data-table" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Patient</Table.Th>
                <Table.Th>Scheduled slot</Table.Th>
                <Table.Th>Service</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {assignedPatients.map((request) => (
                <Table.Tr key={request.id}>
                  <Table.Td>
                    {request.patientName || request.patientId || "—"}
                  </Table.Td>
                  <Table.Td>
                    {formatScheduleSlot(request, setupDisplayName)}
                  </Table.Td>
                  <Table.Td>
                    {serviceNameById.get(request.serviceId) ||
                      request.serviceId ||
                      "—"}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Text size="sm" c="dimmed">
            Do you want to move them back to the awaiting patients queue as{" "}
            <strong>Re-Scheduled</strong>?
          </Text>

          <Group justify="flex-end">
            <Button
              variant="default"
              disabled={isReallocating}
              onClick={handleCancelInactive}
            >
              Cancel
            </Button>
            <Button
              color="orange"
              loading={isReallocating}
              onClick={handleConfirmInactive}
            >
              Re-schedule patients & update setup
            </Button>
          </Group>
        </Stack>
      </Modal>
    </PageCard>
  );
}
