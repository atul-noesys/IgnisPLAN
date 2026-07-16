import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { BedTimeline, ScheduleTimeline } from "@/lib/prototype";

function findQueueSearchBox(): HTMLElement | null {
  return document.querySelector(
    ".timeline-queue-search-box:not(.timeline-queue-search-box--skeleton)",
  ) as HTMLElement | null;
}

/**
 * Replaces the prototype native queue search input with a Mantine TextInput.
 */
export function QueueSearchPortal({
  mode,
  date,
  hostKey,
}: {
  mode: "imaging" | "beds";
  date: string;
  hostKey: string | number;
}) {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    let raf = 0;

    const attach = () => {
      if (cancelled) return;
      const box = findQueueSearchBox();
      if (!box) {
        tries += 1;
        if (tries < 40) {
          raf = requestAnimationFrame(attach);
        } else {
          setMountNode(null);
        }
        return;
      }

      // Hide native input/svg; host Mantine field in the same box
      Array.from(box.children).forEach((child) => {
        const el = child as HTMLElement;
        if (el.getAttribute("data-mantine-queue-search") === "1") return;
        el.style.display = "none";
      });

      let portalRoot = box.querySelector(
        "[data-mantine-queue-search]",
      ) as HTMLElement | null;
      if (!portalRoot) {
        portalRoot = document.createElement("div");
        portalRoot.setAttribute("data-mantine-queue-search", "1");
        portalRoot.style.flex = "1";
        portalRoot.style.minWidth = "0";
        box.appendChild(portalRoot);
      }

      const engine = mode === "imaging" ? ScheduleTimeline : BedTimeline;
      const existing =
        typeof engine.getQueueSearchQuery === "function"
          ? engine.getQueueSearchQuery(date) || ""
          : "";
      setQuery(existing);
      setMountNode(portalRoot);
    };

    setMountNode(null);
    raf = requestAnimationFrame(attach);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [date, hostKey, mode]);

  if (!mountNode) return null;

  return createPortal(
    <TextInput
      size="xs"
      variant="unstyled"
      placeholder="Name, patient ID, service"
      value={query}
      leftSection={<IconSearch size={14} stroke={1.5} />}
      leftSectionPointerEvents="none"
      leftSectionWidth={22}
      onChange={(e) => {
        const value = e.currentTarget.value;
        setQuery(value);
        const engine = mode === "imaging" ? ScheduleTimeline : BedTimeline;
        if (typeof engine.setQueueSearchQuery === "function") {
          engine.setQueueSearchQuery(date, value);
        }
        const page = document.querySelector(".schedule-page") as HTMLElement | null;
        const panel = document.querySelector(".timeline-queue-panel") as HTMLElement | null;
        if (typeof engine.applyQueueSearch === "function" && panel) {
          engine.applyQueueSearch(panel, value);
        } else if (page && typeof engine.applyQueueVisibilityFilters === "function") {
          engine.applyQueueVisibilityFilters(page);
        } else {
          const native = document.getElementById("queue-search") as HTMLInputElement | null;
          if (native) {
            native.value = value;
            native.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }
      }}
      styles={{
        root: { width: "100%" },
        wrapper: { width: "100%" },
        section: {
          width: 22,
          justifyContent: "center",
          paddingInlineStart: 2,
          color: "var(--mantine-color-placeholder)",
        },
        input: {
          minHeight: 28,
          height: 28,
          fontSize: 12,
          paddingInlineStart: 22,
          paddingInlineEnd: 8,
        },
      }}
      className="timeline-queue-mantine-search"
    />,
    mountNode,
  );
}
