import { Group, Table, Text } from "@mantine/core";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Store } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { IgnisButton, IgnisIcons } from "@/components/IgnisButton";
import { NotFound, PageCard, useChrome } from "./_shared";

export function ReschedulePlanPage() {
  useChrome("Reschedule Plan", "Review before/after moves");
  const { planId } = useParams();
  const plan = Store.getReschedulePlan(planId);
  const { refresh } = useAppStore();
  const navigate = useNavigate();
  if (!plan) return <NotFound back="/events" label="Back to events" />;
  const canApprove =
    plan.status === "Draft" &&
    plan.moves.every((m: any) => m.newDate && m.newStartTime && m.newSetupId);

  return (
    <PageCard>
      <Text mb="md">Plan status: {plan.status}</Text>
      <Table className="data-table">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Patient</Table.Th>
            <Table.Th>Current slot</Table.Th>
            <Table.Th>New slot</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {plan.moves.map((m: any) => (
            <Table.Tr key={m.id}>
              <Table.Td>{Store.getPatient(m.patientId)?.name}</Table.Td>
              <Table.Td>
                {m.oldDate} {m.oldStartTime} · {Store.getSetup(m.oldSetupId)?.name}
              </Table.Td>
              <Table.Td>
                {m.newDate
                  ? `${m.newDate} ${m.newStartTime} · ${Store.getSetup(m.newSetupId)?.name}`
                  : "Unresolved"}
              </Table.Td>
              <Table.Td>{m.status}</Table.Td>
              <Table.Td>
                {plan.status === "Draft" && (
                  <IgnisButton
                    component={Link}
                    to={`/reschedule/${plan.id}/moves/${m.id}`}
                    leftSection={m.newDate ? IgnisIcons.edit : IgnisIcons.assign}
                    size="compact-sm"
                  >
                    {m.newDate ? "Edit" : "Pick slot"}
                  </IgnisButton>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {plan.status === "Draft" && (
        <Group justify="flex-end" mt="md">
          <IgnisButton
            component={Link}
            to={`/reschedule/${plan.id}/reject`}
            leftSection={IgnisIcons.cancel}
          >
            Reject plan
          </IgnisButton>
          <IgnisButton
            leftSection={IgnisIcons.confirm}
            disabled={!canApprove}
            onClick={() => {
              Store.approvePlan(plan.id);
              refresh();
              navigate("/schedule");
            }}
          >
            Approve & apply
          </IgnisButton>
        </Group>
      )}
    </PageCard>
  );
}
