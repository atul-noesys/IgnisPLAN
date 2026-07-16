import { useMemo, useState } from "react";
import { Select, Stack, Text } from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import { SchedulerSlots, Store } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { IgnisButton, IgnisIcons } from "@/components/IgnisButton";
import { NotFound, PageCard, useChrome } from "./_shared";

export function RescheduleMoveEditPage() {
  useChrome("Override Move Slot", "Select a replacement slot");
  const { planId, moveId } = useParams();
  const plan = Store.getReschedulePlan(planId);
  const move = plan ? Store.getPlanMove(planId, moveId) : null;
  const { refresh, version } = useAppStore();
  const navigate = useNavigate();
  const [date, setDate] = useState(move?.newDate || move?.oldDate || "2026-07-08");
  const [slot, setSlot] = useState<string | null>(
    move?.newSetupId ? `${move.newSetupId}|${move.newStartTime}` : null,
  );

  const slots = useMemo(() => {
    if (!move) return [];
    const booking = Store.getAll().bookings.find((b: any) => b.id === move.bookingId);
    const service = booking && Store.getService(booking.serviceId);
    if (!service) return [];
    return SchedulerSlots.availableSlots(
      Store.getSetups().filter((s: any) => s.status === "Active" && s.serviceId === service.id),
      date,
      service,
      Store.getBookingsForDate(date),
      booking?.requestId,
    );
  }, [date, move, version]);

  if (!plan || !move) return <NotFound back="/events" label="Back to events" />;

  return (
    <PageCard>
      <Stack>
        <Text>Choose a new slot for {Store.getPatient(move.patientId)?.name}.</Text>
        <Select
          label="Date"
          data={[move.oldDate, "2026-07-09", "2026-07-10", "2026-07-11", "2026-07-12"]}
          value={date}
          onChange={(v) => {
            setDate(v || move.oldDate);
            setSlot(null);
          }}
        />
        <Select
          label="Slot"
          data={slots.map((s: any) => ({
            value: `${s.setupId}|${s.startTime}`,
            label: `${Store.getSetup(s.setupId)?.name} · ${s.startTime}`,
          }))}
          value={slot}
          onChange={setSlot}
        />
        <IgnisButton
          leftSection={IgnisIcons.save}
          disabled={!slot}
          onClick={() => {
            const [setupId, startTime] = slot!.split("|");
            Store.updatePlanMove(plan.id, move.id, { setupId, date, startTime });
            refresh();
            navigate(`/reschedule/${plan.id}`);
          }}
        >
          Save move
        </IgnisButton>
      </Stack>
    </PageCard>
  );
}
