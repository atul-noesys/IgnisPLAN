import { Group, SimpleGrid } from "@mantine/core";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Store } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { IgnisButton, IgnisIcons } from "@/components/IgnisButton";
import { Meta, NotFound, PageCard, useChrome } from "./_shared";

export function BookingDetailPage() {
  useChrome("Booking Detail", "Review and update booking status");
  const { id } = useParams();
  const [params] = useSearchParams();
  const booking = Store.getBooking(id);
  const { refresh } = useAppStore();
  const navigate = useNavigate();
  if (!booking) return <NotFound back="/schedule" label="Back to schedule" />;

  const terminal = ["Complete", "Cancelled", "No-show"].includes(booking.status);
  const update = (status: string) => {
    Store.updateBookingStatus(booking.id, status);
    refresh();
    navigate(`/bookings/${booking.id}${params.get("date") ? `?date=${params.get("date")}` : ""}`);
  };

  return (
    <PageCard>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Meta label="Patient" value={Store.getPatient(booking.patientId)?.name} />
        <Meta label="Service" value={Store.getService(booking.serviceId)?.name} />
        <Meta label="Setup" value={Store.getSetup(booking.setupId)?.name} />
        <Meta label="Slot" value={`${booking.date} · ${booking.startTime}`} />
        <Meta label="Status" value={booking.status} />
      </SimpleGrid>
      {!terminal && (
        <Group mt="lg">
          <IgnisButton
            leftSection={IgnisIcons.start}
            onClick={() => update("In-Progress")}
            disabled={booking.status !== "Scheduled"}
          >
            Start
          </IgnisButton>
          <IgnisButton leftSection={IgnisIcons.complete} onClick={() => update("Complete")}>
            Mark complete
          </IgnisButton>
          <IgnisButton leftSection={IgnisIcons.noshow} onClick={() => update("No-show")}>
            No-show
          </IgnisButton>
          <IgnisButton
            component={Link}
            to={`/bookings/${booking.id}/cancel`}
            leftSection={IgnisIcons.cancel}
          >
            Cancel booking
          </IgnisButton>
        </Group>
      )}
    </PageCard>
  );
}
