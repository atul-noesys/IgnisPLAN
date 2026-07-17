import { useCallback, useEffect, useMemo, useState } from "react";
import { Group, SegmentedControl, Select } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { BedTimeline, ScheduleTimeline } from "@/lib/prototype";
import { useAppStore } from "@/store/StoreContext";
import { usePageChrome } from "@/store/PageChromeContext";
import { SCHEDULE_START } from "@/lib/routes";
import { IgnisButton, IgnisIcons } from "@/components/IgnisButton";

type Mode = "imaging" | "beds";
type View = "day" | "range";

export function useScheduleChromeToolbar({
  mode,
  view,
  date,
  title,
  headerStatsHtml,
}: {
  mode: Mode;
  view: View;
  date: string;
  title: string;
  headerStatsHtml: string;
}) {
  const { setChrome } = usePageChrome();
  const { refresh } = useAppStore();
  const navigate = useNavigate();
  const [severity, setSeverity] = useState("all");
  const [serviceType, setServiceType] = useState("all");
  const [previewCount, setPreviewCount] = useState(0);
  const [allocating, setAllocating] = useState(false);

  const filterScope =
    view === "range" && mode === "imaging"
      ? ScheduleTimeline.RANGE_FILTER_SCOPE
      : date || SCHEDULE_START;

  const serviceOptions = useMemo(() => {
    if (mode !== "imaging") return [];
    const types = ScheduleTimeline.getServiceTypeOptions() as string[];
    return [
      { value: "all", label: "All services" },
      ...types.map((t) => ({ value: t, label: t })),
    ];
  }, [mode]);

  const runFilterRefresh = useCallback(
    (nextSeverity: string, nextService: string) => {
      const sev = nextSeverity === "all" ? "" : nextSeverity;
      const svc = nextService === "all" ? "" : nextService;
      if (mode === "imaging") {
        ScheduleTimeline.setTimelineSeverityFilter(filterScope, sev);
        ScheduleTimeline.setTimelineServiceFilter(filterScope, svc);
      } else {
        BedTimeline.setTimelineSeverityFilter(filterScope, sev);
      }
      setPreviewCount(0);
      refresh();
    },
    [filterScope, mode, refresh],
  );

  const runAllocation = useCallback(() => {
    setAllocating(true);
    try {
      if (mode === "imaging") {
        const result = ScheduleTimeline.showBulkPreview(date);
        setPreviewCount(result?.placements?.length || 0);
        return;
      }

      const page = document.querySelector(
        `.schedule-page[data-beds-date="${date || SCHEDULE_START}"]`,
      );
      const selectedIds = BedTimeline.getSelectedQueueRequestIds(page);
      if (!selectedIds.length) {
        BedTimeline; // keep ref
        const UI = (globalThis as any).UI;
        UI?.showToast?.("Select one or more patients in the queue first.");
        return;
      }
      const plan = BedTimeline.planBulkAssignments(date || SCHEDULE_START, selectedIds);
      BedTimeline.clearSlotSuggestions();
      BedTimeline._bulkPreviewPlacements = plan.placements;
      BedTimeline.renderBulkPreviewOverlays(date || SCHEDULE_START);
      setPreviewCount(plan.placements.length || 0);
      if (!plan.placements.length) {
        (globalThis as any).UI?.showToast?.("No beds available for allocation.");
      }
    } finally {
      setAllocating(false);
    }
  }, [date, mode]);

  const toolbar = useMemo(
    () => (
      <Group gap="sm" wrap="wrap" justify="flex-end">
        {previewCount > 0 ? (
          <Group gap="xs">
            <span style={{ fontSize: 13 }}>
              <strong>Preview</strong> · {previewCount} slots
            </span>
            <IgnisButton
              size="compact-sm"
              leftSection={IgnisIcons.clear}
              onClick={() => {
                if (mode === "imaging") ScheduleTimeline.clearSlotSuggestions();
                else BedTimeline.clearSlotSuggestions();
                setPreviewCount(0);
              }}
            >
              Clear
            </IgnisButton>
            <IgnisButton
              size="compact-sm"
              leftSection={IgnisIcons.confirm}
              loading={allocating}
              onClick={async () => {
                setAllocating(true);
                try {
                  if (mode === "imaging") {
                    const ok =
                      await ScheduleTimeline.applyBulkPreviewFromToolbar(date);
                    if (ok) setPreviewCount(0);
                  } else {
                    const ok = await BedTimeline.applyBulkPreviewFromToolbar(
                      date || SCHEDULE_START,
                    );
                    if (ok) setPreviewCount(0);
                  }
                  refresh();
                } finally {
                  setAllocating(false);
                }
              }}
            >
              Confirm
            </IgnisButton>
          </Group>
        ) : null}

        <Select
          size="xs"
          w={150}
          aria-label="Severity"
          value={severity}
          onChange={(v) => {
            const next = v || "all";
            setSeverity(next);
            runFilterRefresh(next, serviceType);
          }}
          data={[
            { value: "all", label: "All severities" },
            { value: "Critical", label: "Critical" },
            { value: "High", label: "High" },
            { value: "Medium", label: "Medium" },
            { value: "Low", label: "Low" },
          ]}
          allowDeselect={false}
        />

        {mode === "imaging" ? (
          <Select
            size="xs"
            w={140}
            aria-label="Service"
            value={serviceType}
            onChange={(v) => {
              const next = v || "all";
              setServiceType(next);
              runFilterRefresh(severity, next);
            }}
            data={serviceOptions}
            allowDeselect={false}
          />
        ) : null}

        <SegmentedControl
          size="xs"
          value={view}
          onChange={(v) => {
            if (v === "day") {
              const UI = (globalThis as { UI?: { todayISO?: () => string } }).UI;
              const dayDate =
                date ||
                (typeof UI?.todayISO === "function" ? UI.todayISO() : "") ||
                SCHEDULE_START;
              navigate(
                mode === "imaging"
                  ? `/schedule?date=${encodeURIComponent(dayDate)}`
                  : `/beds?date=${encodeURIComponent(dayDate)}`,
              );
            } else {
              navigate(mode === "imaging" ? "/schedule/range" : "/beds/range");
            }
          }}
          data={[
            { label: "Day", value: "day" },
            { label: "15d", value: "range" },
          ]}
        />

        {view === "day" || mode === "beds" ? (
          <IgnisButton
            size="compact-sm"
            leftSection={IgnisIcons.allocate}
            loading={allocating}
            onClick={runAllocation}
          >
            Allocate
          </IgnisButton>
        ) : null}
      </Group>
    ),
    [
      allocating,
      date,
      mode,
      navigate,
      previewCount,
      refresh,
      runAllocation,
      runFilterRefresh,
      serviceOptions,
      serviceType,
      severity,
      view,
    ],
  );

  useEffect(() => {
    setChrome({
      title,
      subtitle: "",
      headerStatsHtml,
      actions: toolbar,
    });
  }, [headerStatsHtml, setChrome, title, toolbar]);
}
