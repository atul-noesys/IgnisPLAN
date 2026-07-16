import { useEffect, useState } from "react";
import {
  Alert,
  Checkbox,
  Center,
  Loader,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAddRow } from "@/hooks/useAddRow";
import { useNguageRowData } from "@/hooks/useRow";
import {
  SERVICES_FORM_ID,
  SERVICES_TABLE,
  buildServiceRow,
  generateServiceId,
  transformRowToService,
} from "@/hooks/useServices";
import { NotFound, PageCard, SaveActions, useChrome } from "./_shared";

type FormValues = {
  name: string;
  type: string;
  lead: number;
  procedure: number;
  lag: number;
  active: boolean;
};

export function ServiceFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | undefined>();

  const {
    mutate: saveRow,
    isPending,
    error: mutationError,
  } = useAddRow();

  const {
    data: existingRow,
    isLoading: isLoadingRow,
    isError: isRowError,
  } = useNguageRowData(
    SERVICES_FORM_ID,
    SERVICES_TABLE,
    id ?? "",
    "id",
  );

  useChrome(
    isEdit ? "Edit Service" : "Add Service",
    isEdit ? "Update diagnostic service" : "Create a diagnostic service",
  );

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      type: "MRI",
      lead: 15,
      procedure: 30,
      lag: 15,
      active: true,
    },
    validate: {
      name: (value) =>
        value.trim().length > 0 ? null : "Enter a service name",
      type: (value) => (value ? null : "Select a service type"),
      lead: (value) => (value >= 15 ? null : "Lead must be at least 15"),
      procedure: (value) =>
        value >= 15 ? null : "Procedure must be at least 15",
      lag: (value) => (value >= 15 ? null : "Lag must be at least 15"),
    },
  });

  useEffect(() => {
    if (!existingRow) return;
    const service = transformRowToService(existingRow);
    setCreatedAt(
      existingRow.created_at
        ? String(existingRow.created_at)
        : undefined,
    );
    form.setValues({
      name: service.name,
      type: service.type || "MRI",
      lead: service.lead || 15,
      procedure: service.procedure || 30,
      lag: service.lag || 15,
      active: service.active,
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
    return <NotFound back="/services" label="Back to services" />;
  }

  const handleSubmit = (values: FormValues) => {
    setSubmitError(null);
    const name = values.name.trim();
    const serviceId = isEdit && id ? id : generateServiceId(name);

    const rowData = buildServiceRow({
      id: serviceId,
      name,
      service_type: values.type,
      lead_min: Number(values.lead),
      procedure_min: Number(values.procedure),
      lag_min: Number(values.lag),
      active: values.active,
      created_at: isEdit ? createdAt : undefined,
    });

    saveRow(
      {
        formId: SERVICES_FORM_ID,
        tableName: SERVICES_TABLE,
        rowData,
        ...(isEdit
          ? { primaryKey: { primaryKey: "id", value: serviceId } }
          : {}),
      },
      {
        onSuccess: (result) => {
          if (result.success === false) {
            setSubmitError(result.error || "Failed to save service");
            return;
          }
          navigate("/services");
        },
        onError: (err) => {
          setSubmitError(
            err instanceof Error ? err.message : "Failed to save service",
          );
        },
      },
    );
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
              title="Could not save service"
            >
              {errorMessage}
            </Alert>
          ) : null}

          <TextInput
            label="Service name"
            required
            {...form.getInputProps("name")}
          />
          <Select
            label="Service type"
            data={["MRI", "CT", "X-Ray"]}
            {...form.getInputProps("type")}
          />
          <NumberInput
            label="Lead (minutes)"
            min={15}
            max={60}
            step={15}
            {...form.getInputProps("lead")}
          />
          <NumberInput
            label="Procedure (minutes)"
            min={15}
            max={60}
            step={15}
            {...form.getInputProps("procedure")}
          />
          <NumberInput
            label="Lag (minutes)"
            min={15}
            max={60}
            step={15}
            {...form.getInputProps("lag")}
          />
          <Checkbox
            label="Service is active"
            {...form.getInputProps("active", { type: "checkbox" })}
          />
        </Stack>
        <SaveActions
          cancelTo="/services"
          label={isEdit ? "Update" : "Save"}
          loading={isPending}
        />
      </form>
    </PageCard>
  );
}
