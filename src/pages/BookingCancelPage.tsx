import { Group, Text } from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import { Store } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { IgnisButton, IgnisIcons } from "@/components/IgnisButton";
import { NotFound, PageCard, useChrome } from "./_shared";

export function BookingCancelPage() {
  useChrome("Cancel Booking", "Confirm booking cancellation");
  const { id } = useParams();
  const booking = Store.getAll().bookings.find((b: any) => b.id === id);
  const { refresh } = useAppStore();
  const navigate = useNavigate();
  if (!booking) return <NotFound back="/schedule" label="Back to schedule" />;
  return (
    <PageCard>
      <Text>
        Cancel booking <strong>{booking.id}</strong>? The linked request will return to the queue.
      </Text>
      <Group justify="flex-end" mt="md">
        <IgnisButton
          leftSection={IgnisIcons.back}
          onClick={() => navigate(`/bookings/${booking.id}`)}
        >
          Keep booking
        </IgnisButton>
        <IgnisButton
          leftSection={IgnisIcons.delete}
          onClick={() => {
            Store.cancelBooking(booking.id);
            refresh();
            navigate("/schedule");
          }}
        >
          Cancel booking
        </IgnisButton>
      </Group>
    </PageCard>
  );
}
