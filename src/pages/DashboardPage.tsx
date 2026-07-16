import { Title } from "@mantine/core";
import { useAuth } from "@/context/AuthContext";
import { PageCard, useChrome } from "./_shared";

export function DashboardPage() {
  const { user } = useAuth();
  useChrome("", "");

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "there";

  return (
    <PageCard>
      <Title order={2}>Welcome back, {name}!</Title>
    </PageCard>
  );
}
