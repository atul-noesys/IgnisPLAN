import { useMemo, useState } from "react";
import { Alert, Anchor, Select, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAddRow } from "@/hooks/useAddRow";
import { usePatients } from "@/hooks/usePatients";
import { useServices } from "@/hooks/useServices";
import {
  REQUESTS_FORM_ID,
  REQUESTS_TABLE,
  buildRequestRow,
  generateRequestId,
} from "@/hooks/useDiagnosticRequests";
import { PageCard, SaveActions, useChrome } from "./_shared";

type FormValues = {
  patientId: string;
  serviceId: string;
  requestedDate: string;
  preferredWindow: string;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function RequestIntakePage() {
  useChrome("Request Intake", "Add a diagnostic request to the queue");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { mutate: addRow, isPending, error: mutationError } = useAddRow();
  const { data: patients, isLoading: loadingPatients } = usePatients(1, 500);
  const { data: services, isLoading: loadingServices } = useServices(1, 200);

  const form = useForm<FormValues>({
    initialValues: {
      patientId: params.get("patientId") || "",
      serviceId: "",
      requestedDate: todayIsoDate(),
      preferredWindow: "Morning",
    },
    validate: {
      patientId: (v) => (v ? null : "Select a patient"),
      serviceId: (v) => (v ? null : "Select a service"),
      requestedDate: (v) => (v ? null : "Enter a requested date"),
      preferredWindow: (v) => (v ? null : "Select a window"),
    },
  });

  const patientOptions = useMemo(
    () =>
      patients.map((p) => ({
        value: p.patientId,
        label: `${p.patientName} · ${p.patientId}`,
      })),
    [patients],
  );

  const serviceOptions = useMemo(
    () =>
      services
        .filter((s) => s.active)
        .map((s) => ({ value: s.id, label: s.name || s.id })),
    [services],
  );

  const handleSubmit = (values: FormValues) => {
    setSubmitError(null);
    const rowData = buildRequestRow({
      id: generateRequestId(),
      patient_id: values.patientId,
      service_id: values.serviceId,
      requested_date: values.requestedDate,
      preferred_window: values.preferredWindow,
      status: "Pending",
    });

    addRow(
      {
        formId: REQUESTS_FORM_ID,
        tableName: REQUESTS_TABLE,
        rowData,
      },
      {
        onSuccess: (result) => {
          if (result.success === false) {
            setSubmitError(result.error || "Failed to create request");
            return;
          }
          navigate("/queue");
        },
        onError: (err) => {
          setSubmitError(
            err instanceof Error ? err.message : "Failed to create request",
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
              title="Could not submit request"
            >
              {errorMessage}
            </Alert>
          ) : null}

          <Select
            label="Patient"
            searchable
            data={patientOptions}
            required
            disabled={loadingPatients}
            {...form.getInputProps("patientId")}
          />
          <Anchor component={Link} to="/patients/new?return=request-intake">
            Create a new patient
          </Anchor>
          <Select
            label="Service"
            searchable
            data={serviceOptions}
            required
            disabled={loadingServices}
            {...form.getInputProps("serviceId")}
          />
          <TextInput
            label="Requested date"
            type="date"
            required
            {...form.getInputProps("requestedDate")}
          />
          <Select
            label="Preferred window"
            data={["Morning", "Afternoon", "Any time", "Custom"]}
            {...form.getInputProps("preferredWindow")}
          />
        </Stack>
        <SaveActions
          cancelTo="/queue"
          label="Submit to queue"
          loading={isPending}
        />
      </form>
    </PageCard>
  );
}
