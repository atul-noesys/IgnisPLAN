import { useMemo, useState } from "react";
import { Select, Stack, Text } from "@mantine/core";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SchedulerSlots, Store } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { IgnisButton, IgnisIcons } from "@/components/IgnisButton";
import { NotFound, PageCard, useChrome } from "./_shared";

export function AssignSlotPage() {
  const [params] = useSearchParams();
  const request = Store.getRequest(params.get("requestId") || "");
  const { refresh, version } = useAppStore();
  const navigate = useNavigate();
  const [date, setDate] = useState(request?.requestedDate || "2026-07-08");
  const [slot, setSlot] = useState<string | null>(null);
  useChrome("Assign Slot", "Select an available scanner slot");
  const slots = useMemo(() => {
    if (!request) return [];
    const service = Store.getService(request.serviceId);
    if (!service) return [];
    return SchedulerSlots.availableSlots(
      Store.getSetups().filter((s: any) => s.status === "Active" && s.serviceId === service.id),
      date,
      service,
      Store.getBookingsForDate(date),
      request.id,
    );
  }, [date, request?.id, version]);
  if (!request || request.status !== "Pending") {
    return <NotFound back="/queue" label="Back to queue" />;
  }
  return (
    <PageCard>
      <Stack>
        <Text>
          Assign {Store.getPatient(request.patientId)?.name} for{" "}
          {Store.getService(request.serviceId)?.name}.
        </Text>
        <Select
          label="Date"
          data={[request.requestedDate, "2026-07-09", "2026-07-10", "2026-07-11", "2026-07-12"]}
          value={date}
          onChange={(v) => {
            setDate(v || request.requestedDate);
            setSlot(null);
          }}
        />
        <Select
          label="Available slot"
          placeholder="Select a slot"
          data={slots.map((s: any) => ({
            value: `${s.setupId}|${s.startTime}`,
            label: `${Store.getSetup(s.setupId)?.name} · ${s.startTime}`,
          }))}
          value={slot}
          onChange={setSlot}
        />
        <IgnisButton
          leftSection={IgnisIcons.assign}
          disabled={!slot}
          onClick={() => {
            const [setupId, startTime] = slot!.split("|");
            Store.assignRequest(request.id, setupId, date, startTime);
            refresh();
            navigate("/queue");
          }}
        >
          Assign slot
        </IgnisButton>
      </Stack>
    </PageCard>
  );
}
