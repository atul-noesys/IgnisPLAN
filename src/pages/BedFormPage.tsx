import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Center,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useAddRow } from "@/hooks/useAddRow";
import { useNguageRowData, ROW_QUERY_KEY } from "@/hooks/useRow";
import type { FiltersType } from "@/hooks/useNgaugePaginatedData";
import {
  BED_ID_FIELD,
  BEDS_FORM_ID,
  BEDS_TABLE,
  buildBedRow,
  generateBedId,
  transformRowToBed,
  useBeds,
  type Bed,
} from "@/hooks/useBeds";
import { NotFound, PageCard, SaveActions, useChrome } from "./_shared";

type FormValues = {
  id: string;
  name: string;
  wardId: string;
  wardName: string;
  status: string;
  bookingMode: string;
};

function findBedById(beds: Bed[], bedId: string): Bed | undefined {
  const lower = bedId.toLowerCase();
  return beds.find(
    (bed) => bed.id === bedId || bed.id.toLowerCase() === lower,
  );
}

function bedHydrateKey(bed: Bed): string {
  return [
    bed.id,
    bed.updatedAt ?? "",
    bed.name,
    bed.wardId,
    bed.wardName,
    bed.status,
    bed.bookingMode,
    bed.department,
  ].join("|");
}

export function BedFormPage() {
  const { bedId: bedIdParam } = useParams();
  const decodedId = bedIdParam ? decodeURIComponent(bedIdParam) : "";
  const isEdit = Boolean(decodedId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | undefined>();
  const [department, setDepartment] = useState<string>("");
  const hydratedKeyRef = useRef("");

  const { mutate: saveRow, isPending, error: mutationError } = useAddRow();

  const { data: allBeds, isLoading: isLoadingWards } = useBeds(1, 100);

  const editFilters = useMemo((): FiltersType | undefined => {
    if (!isEdit || !decodedId) return undefined;
    return { [BED_ID_FIELD]: [{ items: [decodedId], operator: "equals" }] };
  }, [decodedId, isEdit]);

  const { data: bedsById, isLoading: isLoadingBedById } = useBeds(
    1,
    1,
    editFilters,
    undefined,
    Boolean(editFilters),
  );

  const { data: existingRow, isLoading: isLoadingRow } = useNguageRowData(
    BEDS_FORM_ID,
    BEDS_TABLE,
    decodedId,
    BED_ID_FIELD,
  );

  const resolvedBed = useMemo((): Bed | null => {
    if (existingRow) return transformRowToBed(existingRow);
    if (bedsById[0]) return bedsById[0];
    return findBedById(allBeds, decodedId) ?? null;
  }, [allBeds, bedsById, decodedId, existingRow]);

  useChrome(
    isEdit ? "Edit Bed" : "Add Bed",
    isEdit ? "Update bed record" : "Register a new bed",
  );

  const form = useForm<FormValues>({
    initialValues: {
      id: "",
      name: "",
      wardId: "",
      wardName: "",
      status: "Active",
      bookingMode: "Daily",
    },
    validate: {
      name: (value) =>
        value.trim().length > 0 ? null : "Enter a bed name",
      wardId: (value) =>
        value.trim().length > 0 ? null : "Enter a ward ID",
      wardName: (value) =>
        value.trim().length > 0 ? null : "Enter a ward name",
      status: (value) => (value ? null : "Select a status"),
      bookingMode: (value) => (value ? null : "Select a booking mode"),
    },
  });

  const wardOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const bed of allBeds) {
      if (!bed.wardId) continue;
      if (!seen.has(bed.wardId)) {
        seen.set(bed.wardId, bed.wardName || bed.wardId);
      }
    }
    if (resolvedBed?.wardId && !seen.has(resolvedBed.wardId)) {
      seen.set(
        resolvedBed.wardId,
        resolvedBed.wardName || resolvedBed.wardId,
      );
    }
    return [...seen.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [allBeds, resolvedBed?.wardId, resolvedBed?.wardName]);

  useEffect(() => {
    if (!resolvedBed) return;

    const nextKey = bedHydrateKey(resolvedBed);
    if (hydratedKeyRef.current === nextKey) return;
    hydratedKeyRef.current = nextKey;

    setCreatedAt(resolvedBed.createdAt);
    setDepartment(resolvedBed.department || "");
    form.setValues({
      id: resolvedBed.id,
      name: resolvedBed.name,
      wardId: resolvedBed.wardId,
      wardName: resolvedBed.wardName,
      status: resolvedBed.status || "Active",
      bookingMode: resolvedBed.bookingMode || "Daily",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per bed snapshot
  }, [resolvedBed]);

  useEffect(() => {
    hydratedKeyRef.current = "";
  }, [decodedId]);

  const isResolvingEdit =
    isEdit &&
    !resolvedBed &&
    (isLoadingRow || isLoadingBedById || (isLoadingWards && allBeds.length === 0));

  if (isResolvingEdit) {
    return (
      <Center py="xl">
        <Loader color="orange" />
      </Center>
    );
  }

  if (isEdit && !resolvedBed) {
    return <NotFound back="/bed-master" label="Back to bed master" />;
  }

  const applyWardSelection = (wardId: string | null) => {
    if (!wardId) return;
    const match = wardOptions.find((option) => option.value === wardId);
    form.setFieldValue("wardId", wardId);
    if (match?.label) {
      form.setFieldValue("wardName", match.label);
    }
  };

  const handleSubmit = (values: FormValues) => {
    setSubmitError(null);
    const name = values.name.trim();
    const bedId = isEdit && decodedId ? decodedId : generateBedId(name);

    const rowData = buildBedRow({
      bed_id: bedId,
      ward_id: values.wardId.trim(),
      ward_name: values.wardName.trim(),
      name,
      status: values.status,
      booking_mode: values.bookingMode,
      department: department || null,
      created_at: isEdit ? createdAt : undefined,
    });

    saveRow(
      {
        formId: BEDS_FORM_ID,
        tableName: BEDS_TABLE,
        rowData,
        ...(isEdit
          ? { primaryKey: { primaryKey: BED_ID_FIELD, value: bedId } }
          : {}),
      },
      {
        onSuccess: async (result) => {
          if (result.success === false) {
            setSubmitError(result.error || "Failed to save bed");
            return;
          }
          await queryClient.invalidateQueries({
            queryKey: [BEDS_TABLE, BEDS_FORM_ID],
          });
          await queryClient.invalidateQueries({
            queryKey: [...ROW_QUERY_KEY, BEDS_FORM_ID, BEDS_TABLE, bedId],
          });
          navigate("/bed-master");
        },
        onError: (err) => {
          setSubmitError(
            err instanceof Error ? err.message : "Failed to save bed",
          );
        },
      },
    );
  };

  const errorMessage =
    submitError ||
    (mutationError instanceof Error ? mutationError.message : null);

  const wardPickerValue =
    wardOptions.some((option) => option.value === form.values.wardId)
      ? form.values.wardId
      : null;

  return (
    <PageCard>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {errorMessage ? (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              title="Could not save bed"
            >
              {errorMessage}
            </Alert>
          ) : null}

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {isEdit ? (
              <TextInput label="Bed ID" disabled {...form.getInputProps("id")} />
            ) : null}
            <TextInput
              label="Bed name"
              required
              placeholder="ERPR-04"
              {...form.getInputProps("name")}
            />
            <Select
              label="Existing ward"
              placeholder="Pick to fill ward name and ID"
              data={wardOptions}
              searchable
              clearable
              disabled={isLoadingWards}
              value={wardPickerValue}
              onChange={applyWardSelection}
            />
            <TextInput
              label="Ward name"
              required
              placeholder="ER Observation Private"
              {...form.getInputProps("wardName")}
            />
            <TextInput
              label="Ward ID"
              required
              placeholder="ward-er-priv"
              {...form.getInputProps("wardId")}
            />
            <Select
              label="Status"
              data={["Active", "Under Maintenance", "Inactive"]}
              required
              {...form.getInputProps("status")}
            />
            <Select
              label="Booking mode"
              data={["Daily", "Hourly"]}
              required
              {...form.getInputProps("bookingMode")}
            />
          </SimpleGrid>
        </Stack>
        <SaveActions
          cancelTo="/bed-master"
          label={isEdit ? "Update" : "Save"}
          loading={isPending}
        />
      </form>
    </PageCard>
  );
}
