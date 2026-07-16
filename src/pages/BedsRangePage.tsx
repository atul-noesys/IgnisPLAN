import { useCallback, useMemo, useState } from "react";
import { Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { PrototypeHost } from "@/components/PrototypeHost";
import { QueueSearchPortal } from "@/components/QueueSearchPortal";
import { useScheduleChromeToolbar } from "@/components/ScheduleToolbar";
import { useHydrateBeds } from "@/hooks/useHydrateBeds";
import { BedTimeline, UI } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";

export function BedsRangePage() {
  const { refresh } = useAppStore();
  const [statsHtml, setStatsHtml] = useState("");
  const date = UI.todayISO() as string;

  const { isReady, isLoading, error } = useHydrateBeds(date);

  useScheduleChromeToolbar({
    mode: "beds",
    view: "range",
    date,
    title: "15-Day Beds",
    headerStatsHtml: statsHtml,
  });

  const showSkeleton = !isReady || isLoading;

  const render = useCallback(() => {
    const headerStats = showSkeleton
      ? BedTimeline.renderNavbarStatsSkeleton()
      : BedTimeline.renderNavbarRangeStats();
    return {
      body: BedTimeline.renderRangeView({
        queueSkeleton: showSkeleton,
        boardSkeleton: showSkeleton,
      }),
      headerStats,
      actions: "",
    };
  }, [showSkeleton]);

  const onHeader = useCallback(
    (p: { headerStats?: string }) => {
      const next = p.headerStats || "";
      setStatsHtml((prev) => (prev === next ? prev : next));
    },
    [],
  );

  const onMount = useCallback(
    (root: HTMLElement) => {
      if (!isReady) return;

      document.body.removeAttribute("data-timeline-filter-init");
      const page = root.querySelector(".schedule-page[data-beds-date]");
      if (page instanceof HTMLElement) {
        [
          "data-queue-init",
          "data-search-init",
          "data-suggestion-init",
          "data-bulk-init",
        ].forEach((a) => page.removeAttribute(a));
      }
      BedTimeline.initRangePage();
      root.addEventListener("click", (e) => {
        if (
          (e.target as HTMLElement).closest(
            ".timeline-suggestion-btn--accept, .timeline-suggestion-btn--reject",
          )
        ) {
          setTimeout(refresh, 50);
        }
      });
    },
    [isReady, refresh],
  );

  const hostKey = useMemo(
    () => `${date}-${showSkeleton ? "skeleton" : "ready"}`,
    [date, showSkeleton],
  );

  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        color="red"
        title="Error loading beds allotment"
        m="md"
      >
        {error instanceof Error
          ? error.message
          : "Failed to load live bed or allocation data for 15-Day Beds"}
      </Alert>
    );
  }

  return (
    <>
      <PrototypeHost
        renderKey={hostKey}
        render={render}
        onMount={onMount}
        onHeader={onHeader}
      />
      <QueueSearchPortal mode="beds" date={date} hostKey={hostKey} />
    </>
  );
}
