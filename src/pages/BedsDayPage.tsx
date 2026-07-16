import { useCallback, useMemo, useState } from "react";
import { Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useSearchParams } from "react-router-dom";
import { PrototypeHost } from "@/components/PrototypeHost";
import { QueueSearchPortal } from "@/components/QueueSearchPortal";
import { useScheduleChromeToolbar } from "@/components/ScheduleToolbar";
import { useHydrateBeds } from "@/hooks/useHydrateBeds";
import { BedTimeline } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { SCHEDULE_START } from "@/lib/routes";

export function BedsDayPage() {
  const [params] = useSearchParams();
  const date = params.get("date") || SCHEDULE_START;
  const { refresh } = useAppStore();
  const [statsHtml, setStatsHtml] = useState("");

  const { isReady, isLoading, error } = useHydrateBeds(date);

  useScheduleChromeToolbar({
    mode: "beds",
    view: "day",
    date,
    title: "Beds Allotment",
    headerStatsHtml: statsHtml,
  });

  const showSkeleton = !isReady || isLoading;

  const render = useCallback(() => {
    const headerStats = showSkeleton
      ? BedTimeline.renderNavbarStatsSkeleton()
      : BedTimeline.renderNavbarStats(date);
    return {
      body: BedTimeline.renderDayView(date, {
        queueSkeleton: showSkeleton,
        boardSkeleton: showSkeleton,
      }),
      headerStats,
      actions: "",
    };
  }, [date, showSkeleton]);

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

      const page = root.querySelector(`.schedule-page[data-beds-date="${date}"]`);
      if (page instanceof HTMLElement) {
        [
          "data-queue-init",
          "data-search-init",
          "data-suggestion-init",
          "data-bulk-init",
        ].forEach((a) => page.removeAttribute(a));
      }
      document.body.removeAttribute("data-timeline-filter-init");
      BedTimeline.initDayPage(date);
      root.addEventListener("click", (e) => {
        const t = e.target as HTMLElement;
        if (
          t.closest(
            ".timeline-suggestion-btn--accept, .timeline-suggestion-btn--reject",
          )
        ) {
          setTimeout(refresh, 50);
        }
      });
    },
    [date, refresh, isReady],
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
          : "Failed to load live bed or allocation data for Beds Allotment"}
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
