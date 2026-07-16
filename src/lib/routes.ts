/** Map prototype HTML paths to React Router paths. */

function todayIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Default Imaging Day date — always "today" (mock seed rebases to this). */
export const SCHEDULE_START = todayIsoLocal();
export const SCHEDULE_HORIZON = 15;
export const MOCK_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
})();

/**
 * Convert a prototype-relative href (e.g. schedule-day.html?date=...) to an app route.
 */
export function prototypeHrefToRoute(href: string): string | null {
  if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
    return null;
  }

  // Already a React route
  if (href.startsWith("/") && !href.includes(".html")) {
    return href;
  }

  try {
    const url = new URL(href, "http://local.ignis/staff/");
    const file = (url.pathname.split("/").pop() || "").split("?")[0];
    const params = url.searchParams;

    switch (file) {
      case "index.html":
      case "":
        return "/";
      case "services.html":
        return "/services";
      case "service-form.html": {
        const mode = params.get("mode");
        const id = params.get("id");
        if (mode === "add" || !id) return "/services/new";
        return `/services/${encodeURIComponent(id)}/edit`;
      }
      case "setups.html":
        return "/setups";
      case "setup-form.html": {
        const mode = params.get("mode");
        const id = params.get("id");
        if (mode === "add" || !id) return "/setups/new";
        return `/setups/${encodeURIComponent(id)}/edit`;
      }
      case "patients.html":
        return "/patients";
      case "patient-form.html": {
        const mode = params.get("mode");
        const id = params.get("id");
        if (mode === "add" || !id) return "/patients/new";
        return `/patients/${encodeURIComponent(id)}/edit`;
      }
      case "request-queue.html":
        return "/queue";
      case "request-intake.html":
        return "/requests/new";
      case "request-cancel.html": {
        const id = params.get("requestId");
        return id ? `/requests/${encodeURIComponent(id)}/cancel` : "/queue";
      }
      case "assign-slot.html": {
        const requestId = params.get("requestId");
        const q = requestId ? `?requestId=${encodeURIComponent(requestId)}` : "";
        return `/assign-slot${q}`;
      }
      case "schedule-day.html": {
        const date = params.get("date");
        return date ? `/schedule?date=${encodeURIComponent(date)}` : "/schedule";
      }
      case "schedule-range.html":
        return "/schedule/range";
      case "beds-day.html": {
        const date = params.get("date");
        return date ? `/beds?date=${encodeURIComponent(date)}` : "/beds";
      }
      case "beds-range.html":
        return "/beds/range";
      case "booking-detail.html": {
        const id = params.get("bookingId");
        const date = params.get("date");
        if (!id) return "/schedule";
        const q = date ? `?date=${encodeURIComponent(date)}` : "";
        return `/bookings/${encodeURIComponent(id)}${q}`;
      }
      case "booking-cancel.html": {
        const id = params.get("bookingId");
        return id ? `/bookings/${encodeURIComponent(id)}/cancel` : "/schedule";
      }
      case "declare-event.html": {
        const qs = url.search ? url.search : "";
        return `/events/declare${qs}`;
      }
      case "events-log.html":
        return "/events";
      case "event-detail.html": {
        const id = params.get("eventId");
        return id ? `/events/${encodeURIComponent(id)}` : "/events";
      }
      case "reschedule-plan.html": {
        const id = params.get("planId");
        return id ? `/reschedule/${encodeURIComponent(id)}` : "/events";
      }
      case "reschedule-move-edit.html": {
        const planId = params.get("planId");
        const moveId = params.get("moveId");
        if (!planId || !moveId) return "/events";
        return `/reschedule/${encodeURIComponent(planId)}/moves/${encodeURIComponent(moveId)}`;
      }
      case "reschedule-reject.html": {
        const id = params.get("planId");
        return id ? `/reschedule/${encodeURIComponent(id)}/reject` : "/events";
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/** Rewrite .html hrefs inside an HTML string to React routes. */
export function rewritePrototypeHtml(html: string): string {
  return html.replace(
    /\bhref=(["'])([^"']+)\1/gi,
    (_m, quote: string, href: string) => {
      const route = prototypeHrefToRoute(href);
      if (!route) return `href=${quote}${href}${quote}`;
      return `href=${quote}${route}${quote}`;
    },
  );
}
