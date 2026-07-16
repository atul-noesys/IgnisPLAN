import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { PrototypeHost } from "@/components/PrototypeHost";
import { QueueSearchPortal } from "@/components/QueueSearchPortal";
import { useScheduleChromeToolbar } from "@/components/ScheduleToolbar";
import { useHydrateImagingQueue } from "@/hooks/useHydrateImagingQueue";
import { REQUESTS_FORM_ID, REQUESTS_TABLE } from "@/hooks/useDiagnosticRequests";
import { allocateDiagnosticRequests } from "@/lib/allocateDiagnosticRequests";
import { formatDayMonthNoYear } from "@/lib/formatScheduleDate";
import { ScheduleTimeline } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { SCHEDULE_START } from "@/lib/routes";

declare global {
  // eslint-disable-next-line no-var
  var __ignisAllocatePatients:
    | ((requestIds: string[]) => Promise<boolean>)
    | undefined;
}

export function ScheduleDayPage() {
  const [params] = useSearchParams();
  const date = params.get("date") || SCHEDULE_START;
  const { version, refresh } = useAppStore();
  const queryClient = useQueryClient();
  const [statsHtml, setStatsHtml] = useState("");

  const { isReady, error } = useHydrateImagingQueue(date);

  useEffect(() => {
    globalThis.__ignisAllocatePatients = async (requestIds: string[]) => {
      const ok = await allocateDiagnosticRequests(requestIds);
      if (ok) {
        await queryClient.invalidateQueries({
          queryKey: [REQUESTS_TABLE, REQUESTS_FORM_ID],
        });
        refresh();
      }
      return ok;
    };
    return () => {
      delete globalThis.__ignisAllocatePatients;
    };
  }, [queryClient, refresh]);

  useScheduleChromeToolbar({
    mode: "imaging",
    view: "day",
    date,
    title: `Imaging Scheduler (${formatDayMonthNoYear(date)})`,
    headerStatsHtml: statsHtml,
  });

  const render = useCallback(() => {
    const headerStats = isReady
      ? ScheduleTimeline.renderNavbarStats(date)
      : ScheduleTimeline.renderNavbarStatsSkeleton();
    return {
      body: ScheduleTimeline.renderDayView(date, {
        showDraft: false,
        queueSkeleton: !isReady,
        boardSkeleton: !isReady,
      }),
      headerStats,
      actions: "",
    };
  }, [date, version, isReady]);

  const onMount = useCallback(
    (root: HTMLElement) => {
      if (!isReady) return;

      const page = root.querySelector(
        `.schedule-page[data-schedule-date="${date}"]`,
      );
      if (page instanceof HTMLElement) {
        [
          "data-queue-init",
          "data-queue-search-init",
          "data-suggestion-init",
          "data-bulk-ops-init",
        ].forEach((a) => page.removeAttribute(a));
      }
      document.body.removeAttribute("data-timeline-filter-init");
      ScheduleTimeline.initQueueSuggestions(date);
      ScheduleTimeline.initQueueSearch(date);
      ScheduleTimeline.initSuggestionActions(date);
      ScheduleTimeline.initBulkAssign(date);

      root.addEventListener("click", (e) => {
        const t = e.target as HTMLElement;
        if (
          t.closest(
            ".timeline-suggestion-btn--accept, .timeline-suggestion-btn--reject",
          )
        ) {
          setTimeout(refresh, 80);
        }
      });
    },
    [date, refresh, isReady],
  );

  const hostKey = useMemo(
    () => `${date}-${version}-${isReady ? "ready" : "skeleton"}`,
    [date, version, isReady],
  );

  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        color="red"
        title="Error loading patients queue"
        m="md"
      >
        {error instanceof Error
          ? error.message
          : "Failed to load live queue data for Imaging Scheduler"}
      </Alert>
    );
  }

  return (
    <>
      <PrototypeHost
        renderKey={hostKey}
        render={render}
        onMount={onMount}
        onHeader={(p) => {
          const next = p.headerStats || "";
          setStatsHtml((prev) => (prev === next ? prev : next));
        }}
      />
      <QueueSearchPortal mode="imaging" date={date} hostKey={hostKey} />
    </>
  );
}
