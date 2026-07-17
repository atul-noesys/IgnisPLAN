import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { PrototypeHost } from "@/components/PrototypeHost";
import { QueueSearchPortal } from "@/components/QueueSearchPortal";
import { useScheduleChromeToolbar } from "@/components/ScheduleToolbar";
import { useHydrateBeds } from "@/hooks/useHydrateBeds";
import { assignBedsToPatients } from "@/lib/assignBedsToPatients";
import { BedTimeline, UI } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";

declare global {
  // eslint-disable-next-line no-var
  var __ignisAssignBedsToPatients:
    | ((
        recordIds: string[],
        bedIds: string | string[],
      ) => Promise<boolean>)
    | undefined;
}

export function BedsRangePage() {
  const { refresh, version } = useAppStore();
  const queryClient = useQueryClient();
  const [statsHtml, setStatsHtml] = useState("");
  const date = UI.todayISO() as string;

  const { isReady, hydrationKey, error } = useHydrateBeds(date);

  useEffect(() => {
    globalThis.__ignisAssignBedsToPatients = async (
      recordIds: string[],
      bedIds: string | string[],
    ) => {
      const ok = await assignBedsToPatients(recordIds, bedIds, queryClient);
      if (ok) {
        refresh();
      }
      return ok;
    };
    return () => {
      delete globalThis.__ignisAssignBedsToPatients;
    };
  }, [queryClient, refresh]);

  useScheduleChromeToolbar({
    mode: "beds",
    view: "range",
    date,
    title: "15-Day Beds",
    headerStatsHtml: statsHtml,
  });

  const showSkeleton = !isReady;

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
  }, [showSkeleton, version]);

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
    () => `${date}-${version}-${hydrationKey || "loading"}-${showSkeleton ? "skeleton" : "ready"}`,
    [date, version, hydrationKey, showSkeleton],
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
