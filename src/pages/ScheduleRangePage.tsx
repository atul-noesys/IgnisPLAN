import { useCallback, useMemo, useState } from "react";
import { Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { PrototypeHost } from "@/components/PrototypeHost";
import { useScheduleChromeToolbar } from "@/components/ScheduleToolbar";
import { useHydrateImagingRange } from "@/hooks/useHydrateImagingRange";
import { ScheduleTimeline } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";

export function ScheduleRangePage() {
  const { version } = useAppStore();
  const [statsHtml, setStatsHtml] = useState("");
  const { isReady, error, requestDayIso, rangeDays } = useHydrateImagingRange();

  useScheduleChromeToolbar({
    mode: "imaging",
    view: "range",
    date: "",
    title: "Imaging Scheduler (15 Days)",
    headerStatsHtml: statsHtml,
  });

  const render = useCallback(
    () => ({
      body: ScheduleTimeline.renderRangeView({ boardSkeleton: !isReady }),
      headerStats: isReady
        ? ScheduleTimeline.renderNavbarRangeStats()
        : ScheduleTimeline.renderNavbarStatsSkeleton(),
      actions: "",
    }),
    [version, isReady],
  );

  const onMount = useCallback(() => {
    document.body.removeAttribute("data-timeline-filter-init");
  }, []);

  // Include today + hydrate so the window and Assigned overlay stay in sync.
  const today = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, [version]);

  const hostKey = useMemo(
    () => `range-${today}-${version}-${isReady ? "live" : "wait"}`,
    [today, version, isReady],
  );

  return (
    <>
      {error ? (
        <Alert
          color="red"
          icon={<IconAlertCircle size={16} />}
          title="Could not load Assigned schedule"
          mb="sm"
        >
          {String(error)}
          {requestDayIso
            ? ` (filter: Assigned · ${requestDayIso} … +${Math.max(0, (rangeDays || 15) - 1)} days)`
            : ""}
        </Alert>
      ) : null}
      <PrototypeHost
        renderKey={hostKey}
        render={render}
        onMount={onMount}
        onHeader={(p) => {
          const next = p.headerStats || "";
          setStatsHtml((prev) => (prev === next ? prev : next));
        }}
      />
    </>
  );
}
