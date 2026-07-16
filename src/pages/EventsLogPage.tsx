import { Link } from "react-router-dom";
import { Table } from "@mantine/core";
import { Store } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { IgnisButton, IgnisIcons } from "@/components/IgnisButton";
import { PageCard, useChrome } from "./_shared";

export function EventsLogPage() {
  useChrome("Events Log", "Declared emergencies and setup downtime");
  const { version } = useAppStore();
  const events = Store.getAll().events as any[];
  void version;
  return (
    <PageCard>
      <IgnisButton
        component={Link}
        to="/events/declare"
        leftSection={IgnisIcons.plus}
        mb="md"
      >
        Declare event
      </IgnisButton>
      <Table className="data-table" striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Type</Table.Th>
            <Table.Th>Setup</Table.Th>
            <Table.Th>Window</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {events.map((e: any) => (
            <Table.Tr key={e.id}>
              <Table.Td>{e.type === "setup_down" ? "Setup down" : "Emergency"}</Table.Td>
              <Table.Td>{Store.getSetup(e.setupId)?.name}</Table.Td>
              <Table.Td>
                {e.effectiveFrom}{" "}
                {e.effectiveTo !== e.effectiveFrom ? `→ ${e.effectiveTo}` : e.startTime}
              </Table.Td>
              <Table.Td>{e.status}</Table.Td>
              <Table.Td>
                <IgnisButton
                  component={Link}
                  to={`/events/${e.id}`}
                  leftSection={IgnisIcons.view}
                  size="compact-sm"
                >
                  View
                </IgnisButton>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </PageCard>
  );
}
