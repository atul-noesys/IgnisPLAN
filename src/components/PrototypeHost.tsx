import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { prototypeHrefToRoute, rewritePrototypeHtml } from "@/lib/routes";

type RenderFn = () => { body: string; headerStats?: string; actions?: string; title?: string };

type PrototypeHostProps = {
  /** Re-run when this changes (date, store version, etc.) */
  renderKey: string | number;
  render: RenderFn;
  onHeader?: (parts: { title?: string; headerStats?: string; actions?: string }) => void;
  /** Called after HTML is injected (for prototype init* methods) */
  onMount?: (root: HTMLElement) => void;
  className?: string;
};

/**
 * Renders prototype HTML string engines into a DOM host and wires SPA navigation.
 */
export function PrototypeHost({
  renderKey,
  render,
  onHeader,
  onMount,
  className,
}: PrototypeHostProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const renderRef = useRef(render);
  const onHeaderRef = useRef(onHeader);
  const onMountRef = useRef(onMount);

  renderRef.current = render;
  onHeaderRef.current = onHeader;
  onMountRef.current = onMount;

  const interceptClicks = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const route = prototypeHrefToRoute(href) ?? (href.startsWith("/") ? href : null);
      if (!route) return;

      event.preventDefault();
      navigate(route);
    },
    [navigate],
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    document.body.removeAttribute("data-timeline-filter-init");
    const parts = renderRef.current();
    root.innerHTML = rewritePrototypeHtml(parts.body || "");
    onHeaderRef.current?.({
      title: parts.title,
      headerStats: parts.headerStats
        ? rewritePrototypeHtml(parts.headerStats)
        : undefined,
      actions: parts.actions ? rewritePrototypeHtml(parts.actions) : undefined,
    });
    onMountRef.current?.(root);
  }, [renderKey]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.addEventListener("click", interceptClicks);
    return () => root.removeEventListener("click", interceptClicks);
  }, [interceptClicks]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href.includes(".html") && !href.startsWith("/")) return;
      if (!href.includes(".html")) return;
      const route = prototypeHrefToRoute(href);
      if (!route) return;
      event.preventDefault();
      navigate(route);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [navigate]);

  useEffect(() => {
    (globalThis as { __ignisNavigate?: (url: string) => void }).__ignisNavigate = (
      url: string,
    ) => {
      const route = prototypeHrefToRoute(url) ?? url;
      navigate(route);
    };
    return () => {
      delete (globalThis as { __ignisNavigate?: (url: string) => void }).__ignisNavigate;
    };
  }, [navigate]);

  return <div ref={rootRef} className={className} data-prototype-host style={{ minHeight: 0 }} />;
}
