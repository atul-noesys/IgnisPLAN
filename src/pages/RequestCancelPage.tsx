import { useState } from "react";
import { Alert, Center, Group, Loader, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAddRow } from "@/hooks/useAddRow";
import { useNguageRowData } from "@/hooks/useRow";
import { usePatients } from "@/hooks/usePatients";
import {
  REQUESTS_FORM_ID,
  REQUESTS_TABLE,
  buildRequestRow,
  transformRowToRequest,
} from "@/hooks/useDiagnosticRequests";
import { IgnisButton, IgnisIcons } from "@/components/IgnisButton";
import { NotFound, PageCard, useChrome } from "./_shared";

export function RequestCancelPage() {
  useChrome("Cancel Request", "Confirm request cancellation");
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    data: existingRow,
    isLoading,
    isError,
  } = useNguageRowData(REQUESTS_FORM_ID, REQUESTS_TABLE, id ?? "", "id");

  const { data: patients } = usePatients(1, 500);
  const { mutate: saveRow, isPending } = useAddRow();

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader color="orange" />
      </Center>
    );
  }

  if (isError || !existingRow) {
    return <NotFound back="/queue" label="Back to queue" />;
  }

  const request = transformRowToRequest(existingRow);
  const patientName =
    patients.find((p) => p.patientId === request.patientId)?.patientName ||
    request.patientId;

  const handleCancel = () => {
    setError(null);
    const rowData = buildRequestRow({
      id: request.id,
      patient_id: request.patientId,
      service_id: request.serviceId,
      requested_date: request.requestedDate,
      preferred_window: request.preferredWindow,
      status: "Cancelled",
      created_at: request.createdAt,
    });

    saveRow(
      {
        formId: REQUESTS_FORM_ID,
        tableName: REQUESTS_TABLE,
        rowData,
        primaryKey: { primaryKey: "id", value: request.id },
      },
      {
        onSuccess: (result) => {
          if (result.success === false) {
            setError(result.error || "Failed to cancel request");
            return;
          }
          navigate("/queue");
        },
        onError: (err) => {
          setError(
            err instanceof Error ? err.message : "Failed to cancel request",
          );
        },
      },
    );
  };

  return (
    <PageCard>
      <Text>
        Cancel the request for <strong>{patientName}</strong> (
        {request.id})?
      </Text>
      {error ? (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          mt="md"
          title="Cancel failed"
        >
          {error}
        </Alert>
      ) : null}
      <Group justify="flex-end" mt="md">
        <IgnisButton
          leftSection={IgnisIcons.back}
          onClick={() => navigate("/queue")}
          disabled={isPending}
        >
          Keep request
        </IgnisButton>
        <IgnisButton
          leftSection={IgnisIcons.delete}
          loading={isPending}
          onClick={handleCancel}
        >
          Cancel request
        </IgnisButton>
      </Group>
    </PageCard>
  );
}
