import { SimpleGrid } from "@mantine/core";
import { Link, useParams } from "react-router-dom";
import { Store } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { IgnisButton, IgnisIcons } from "@/components/IgnisButton";
import { Meta, NotFound, PageCard, useChrome } from "./_shared";

export function EventDetailPage() {
  useChrome("Event Detail", "Declared event snapshot");
  const { id } = useParams();
  const { version } = useAppStore();
  void version;
  const event = Store.getAll().events.find((e: any) => e.id === id);
  if (!event) return <NotFound back="/events" label="Back to events" />;
  const plan = Store.getAll().reschedulePlans?.find((p: any) => p.eventId === event.id);
  return (
    <PageCard>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Meta label="Type" value={event.type} />
        <Meta label="Setup" value={Store.getSetup(event.setupId)?.name} />
        <Meta
          label="Window"
          value={
            event.type === "emergency"
              ? `${event.date} ${event.startTime} · ${event.durationMinutes} min`
              : `${event.effectiveFrom} → ${event.effectiveTo}`
          }
        />
        <Meta label="Status" value={event.status} />
        <Meta label="Reason" value={event.reason} />
      </SimpleGrid>
      {plan && (
        <IgnisButton
          component={Link}
          to={`/reschedule/${plan.id}`}
          leftSection={IgnisIcons.view}
          mt="lg"
        >
          Review reschedule plan
        </IgnisButton>
      )}
    </PageCard>
  );
}
