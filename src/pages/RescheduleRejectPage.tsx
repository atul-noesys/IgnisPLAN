import { Group, Text } from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import { Store } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { IgnisButton, IgnisIcons } from "@/components/IgnisButton";
import { NotFound, PageCard, useChrome } from "./_shared";

export function RescheduleRejectPage() {
  useChrome("Reject Reschedule Plan", "Confirm plan rejection");
  const { planId } = useParams();
  const plan = Store.getReschedulePlan(planId);
  const { refresh } = useAppStore();
  const navigate = useNavigate();
  if (!plan) return <NotFound back="/events" label="Back to events" />;
  return (
    <PageCard>
      <Text>
        Reject plan <strong>{plan.id}</strong>? This keeps all affected bookings unchanged.
      </Text>
      <Group justify="flex-end" mt="md">
        <IgnisButton
          leftSection={IgnisIcons.back}
          onClick={() => navigate(`/reschedule/${plan.id}`)}
        >
          Keep plan
        </IgnisButton>
        <IgnisButton
          leftSection={IgnisIcons.delete}
          onClick={() => {
            Store.rejectPlan(plan.id);
            refresh();
            navigate("/events");
          }}
        >
          Reject plan
        </IgnisButton>
      </Group>
    </PageCard>
  );
}
