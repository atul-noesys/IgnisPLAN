import { useEffect, useState } from "react";
import {
  Alert,
  Center,
  Loader,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAddRow } from "@/hooks/useAddRow";
import { useNguageRowData } from "@/hooks/useRow";
import {
  PATIENTS_FORM_ID,
  PATIENTS_TABLE,
  buildPatientRow,
  generatePatientId,
  transformRowToPatient,
} from "@/hooks/usePatients";
import { NotFound, PageCard, SaveActions, useChrome } from "./_shared";

type FormValues = {
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  patientType: string;
  diagnosis: string;
  priority: string;
  department: string;
  acuityLevel: number;
};

export function PatientFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | undefined>();

  const { mutate: saveRow, isPending, error: mutationError } = useAddRow();

  const {
    data: existingRow,
    isLoading: isLoadingRow,
    isError: isRowError,
  } = useNguageRowData(PATIENTS_FORM_ID, PATIENTS_TABLE, id ?? "", "patientid");

  useChrome(
    isEdit ? "Edit Patient" : "Add Patient",
    isEdit ? "Update patient record" : "Register a new patient",
  );

  const form = useForm<FormValues>({
    initialValues: {
      patientId: isEdit ? "" : generatePatientId(),
      patientName: "",
      age: 0,
      gender: "",
      patientType: "Inpatient",
      diagnosis: "",
      priority: "Medium",
      department: "",
      acuityLevel: 1,
    },
    validate: {
      patientId: (value) =>
        value.trim().length > 0 ? null : "Enter a patient ID",
      patientName: (value) =>
        value.trim().length > 0 ? null : "Enter a patient name",
      gender: (value) => (value ? null : "Select gender"),
      patientType: (value) => (value ? null : "Select patient type"),
      diagnosis: (value) =>
        value.trim().length > 0 ? null : "Enter a diagnosis",
      priority: (value) => (value ? null : "Select priority"),
      department: (value) =>
        value.trim().length > 0 ? null : "Enter a department",
      age: (value) =>
        value >= 0 && value <= 130 ? null : "Enter a valid age (0–130)",
      acuityLevel: (value) =>
        value >= 1 && value <= 5 ? null : "Acuity must be between 1 and 5",
    },
  });

  useEffect(() => {
    if (!existingRow) return;
    const patient = transformRowToPatient(existingRow);
    setCreatedAt(patient.createdAt);
    form.setValues({
      patientId: patient.patientId,
      patientName: patient.patientName,
      age: patient.age,
      gender: patient.gender,
      patientType: patient.patientType || "Inpatient",
      diagnosis: patient.diagnosis,
      priority: patient.priority || "Medium",
      department: patient.department,
      acuityLevel: patient.acuityLevel || 1,
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
    return <NotFound back="/patients" label="Back to patients" />;
  }

  const cancelTo =
    params.get("return") === "request-intake" ? "/requests/new" : "/patients";

  const handleSubmit = (values: FormValues) => {
    setSubmitError(null);
    const patientId = (isEdit && id ? id : values.patientId).trim();

    const rowData = buildPatientRow({
      patientid: patientId,
      patientname: values.patientName.trim(),
      diagnosis: values.diagnosis.trim(),
      acuity_level: Number(values.acuityLevel),
      department: values.department.trim(),
      gender: values.gender,
      age: Number(values.age),
      patient_type: values.patientType,
      priority: values.priority,
      created_at: isEdit ? createdAt : undefined,
    });

    saveRow(
      {
        formId: PATIENTS_FORM_ID,
        tableName: PATIENTS_TABLE,
        rowData,
        ...(isEdit
          ? { primaryKey: { primaryKey: "patientid", value: patientId } }
          : {}),
      },
      {
        onSuccess: (result) => {
          if (result.success === false) {
            setSubmitError(result.error || "Failed to save patient");
            return;
          }
          if (params.get("return") === "request-intake") {
            navigate(`/requests/new?patientId=${encodeURIComponent(patientId)}`);
            return;
          }
          navigate("/patients");
        },
        onError: (err) => {
          setSubmitError(
            err instanceof Error ? err.message : "Failed to save patient",
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
              title="Could not save patient"
            >
              {errorMessage}
            </Alert>
          ) : null}

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Patient ID"
              required
              disabled={isEdit}
              {...form.getInputProps("patientId")}
            />
            <TextInput
              label="Patient name"
              required
              {...form.getInputProps("patientName")}
            />
            <NumberInput
              label="Age"
              min={0}
              max={130}
              {...form.getInputProps("age")}
            />
            <Select
              label="Gender"
              data={["Male", "Female", "Other"]}
              required
              {...form.getInputProps("gender")}
            />
            <Select
              label="Patient type"
              data={["Inpatient", "Outpatient", "Emergency"]}
              required
              {...form.getInputProps("patientType")}
            />
            <Select
              label="Severity"
              data={["Low", "Medium", "High", "Critical"]}
              required
              {...form.getInputProps("priority")}
            />
            <TextInput
              label="Diagnosis"
              required
              {...form.getInputProps("diagnosis")}
            />
            <TextInput
              label="Department"
              required
              {...form.getInputProps("department")}
            />
            <NumberInput
              label="Acuity level"
              min={1}
              max={5}
              {...form.getInputProps("acuityLevel")}
            />
          </SimpleGrid>
        </Stack>
        <SaveActions
          cancelTo={cancelTo}
          label={isEdit ? "Update" : "Save"}
          loading={isPending}
        />
      </form>
    </PageCard>
  );
}
