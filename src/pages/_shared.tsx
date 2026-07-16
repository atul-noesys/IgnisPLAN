import { useEffect, type ReactNode } from "react";
import { Alert, Group, Text } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import { usePageChrome } from "@/store/PageChromeContext";
import { IgnisButton, IgnisIcons } from "@/components/IgnisButton";

export function useChrome(title: string, subtitle?: string) {
  const { setChrome } = usePageChrome();
  useEffect(() => {
    setChrome({ title, subtitle, actions: null, headerStatsHtml: "" });
  }, [setChrome, subtitle, title]);
}

export function PageCard({ children }: { children: ReactNode }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      {children}
    </div>
  );
}

export function NotFound({ back = "/", label = "Back" }: { back?: string; label?: string }) {
  return (
    <Alert color="orange">
      Record not found.{" "}
      <IgnisButton component={Link} to={back} leftSection={IgnisIcons.back} size="compact-sm">
        {label}
      </IgnisButton>
    </Alert>
  );
}

export function CancelButton({ to }: { to: string }) {
  return (
    <IgnisButton component={Link} to={to} leftSection={IgnisIcons.cancel}>
      Cancel
    </IgnisButton>
  );
}

export function SaveActions({
  cancelTo,
  label = "Save",
  loading = false,
}: {
  cancelTo: string;
  label?: string;
  loading?: boolean;
}) {
  return (
    <Group justify="flex-end" mt="md">
      <CancelButton to={cancelTo} />
      <IgnisButton type="submit" leftSection={IgnisIcons.save} loading={loading}>
        {label}
      </IgnisButton>
    </Group>
  );
}


export function useSavedNavigation() {
  const navigate = useNavigate();
  return (to: string) => navigate(to);
}

export function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text>{value || "—"}</Text>
    </div>
  );
}
