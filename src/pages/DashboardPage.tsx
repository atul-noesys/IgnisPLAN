import { Loader, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import Tabs from "@/components/ui/Tabs";
import { ngaugeStore } from "@/store/ngauge-store";
import { QueryKeys } from "@/types/query-keys";
import { PageCard, useChrome } from "./_shared";

const DASHBOARD_INFOBOARD_IDS = [62, 63];

function DashboardIframe({ id }: { id: string | number }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="dashboard-iframe-wrap">
      {!isLoaded && (
        <div className="dashboard-iframe-loading">
          <Loader color="orange" />
        </div>
      )}
      <iframe
        src={`/mobile.html?infoboardId=${id}`}
        className="dashboard-iframe"
        title={`Mobile Dashboard ${id}`}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}

export function DashboardPage() {
  const [tab, setTab] = useState(0);
  useChrome("", "");

  const { data: authToken } = useQuery({
    queryKey: [QueryKeys.AuthToken],
    queryFn: () => localStorage.getItem("access_token"),
    staleTime: Infinity,
  });

  const { data: infoboards, isLoading } = useQuery({
    queryKey: [QueryKeys.Infoboard],
    queryFn: () => ngaugeStore.GetInfoboards(),
    enabled: !!authToken,
  });

  const tabs = useMemo(() => {
    const allowed = new Set(DASHBOARD_INFOBOARD_IDS);
    return (infoboards ?? [])
      .filter((b) => allowed.has(b.id))
      .sort(
        (a, b) =>
          DASHBOARD_INFOBOARD_IDS.indexOf(a.id) - DASHBOARD_INFOBOARD_IDS.indexOf(b.id),
      )
      .map((b) => ({ label: b.name, id: b.id }));
  }, [infoboards]);

  const renderPanel = useCallback((item: { id: string | number }) => {
    return <DashboardIframe key={item.id} id={item.id} />;
  }, []);

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <PageCard>
          <div className="dashboard-loading">
            <Loader color="orange" />
          </div>
        </PageCard>
      </div>
    );
  }

  if (tabs.length === 0) {
    return (
      <PageCard>
        <Text c="dimmed" ta="center" py="xl">
          No dashboards available.
        </Text>
      </PageCard>
    );
  }

  return (
    <div className="dashboard-page">
      <Tabs items={tabs} activeIndex={tab} onChange={setTab} renderPanel={renderPanel} />
    </div>
  );
}
