const UI = {
  MOCK_DATE: "2026-07-07",
  SCHEDULE_START: "2026-07-08",
  SCHEDULE_HORIZON: 15,
  APP_NAME: "IgnisPLAN",
  APP_TAGLINE: "Diagnostic Ops",

  icons: {
    flame(size = 20) {
      return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 4C32 4 44 18 44 32C44 42 36 52 32 60C28 52 20 42 20 32C20 18 32 4 32 4Z" fill="white"/></svg>`;
    },
    search() {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
    },
    bell() {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`;
    },
    home() {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
    },
    list() {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>`;
    },
    building() {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`;
    },
    bed() {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;
    },
    user() {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    },
    clipboard() {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`;
    },
    calendar() {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`;
    },
    image() {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
    },
    burger() {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`;
    },
    filterOff() {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/><path d="m14 6-4 12"/></svg>`;
    },
    x(size = 16) {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
    },
  },

  navItems(basePath) {
    const p = basePath ? basePath + "/" : "";
    return [
      // { key: "hub", href: `${p}index.html`, label: "Screen Hub", icon: "home", enabled: true },
      { key: "services", href: `${p}admin/services.html`, label: "Services", icon: "list", enabled: true },
      { key: "setups", href: `${p}admin/setups.html`, label: "Setups", icon: "building", enabled: true },
      { key: "patients", href: `${p}admin/patients.html`, label: "Patients", icon: "user", enabled: true },
      { key: "request-queue", href: `${p}staff/request-queue.html`, label: "Awaiting Patients Queue", icon: "clipboard", enabled: true },
      { key: "schedule-day", href: `${p}staff/schedule-day.html`, label: "Imaging Scheduler", icon: "image", enabled: true },
      // {
      //   key: "schedule-range",
      //   href: `${p}staff/schedule-range.html`,
      //   label: "Imaging Scheduler (15 Days)",
      //   icon: "image",
      //   enabled: true,
      // },
      { key: "beds-day", href: `${p}staff/beds-day.html`, label: "Beds Allotment", icon: "bed", enabled: true },
      // {
      //   key: "beds-range",
      //   href: `${p}staff/beds-range.html`,
      //   label: "15-Day Beds",
      //   icon: "bed",
      //   enabled: true,
      // },
      { key: "events-log", href: `${p}staff/events-log.html`, label: "Events Log", icon: "list", enabled: true },
    ];
  },

  badge(text, variant) {
    const map = {
      active: "badge-active",
      inactive: "badge-inactive",
      Active: "badge-active",
      Inactive: "badge-inactive",
      "Under Maintenance": "badge-maintenance",
      IPD: "badge-ipd",
      OPD: "badge-opd",
      Inpatient: "badge-ipd",
      Outpatient: "badge-opd",
      Emergency: "badge-maintenance",
      High: "badge-severity-high",
      Critical: "badge-severity-critical",
      Moderate: "badge-severity-moderate",
      Medium: "badge-severity-moderate",
      Low: "badge-severity-low",
      Pending: "badge-pending",
      "Re-Scheduled": "badge-pending",
      Assigned: "badge-assigned",
      Cancelled: "badge-cancelled",
      Scheduled: "badge-assigned",
      "In-Progress": "badge-pending",
      Complete: "badge-active",
      "No-show": "badge-inactive",
      Draft: "badge-pending",
      Approved: "badge-active",
      Applied: "badge-active",
      Rejected: "badge-cancelled",
      ManualReview: "badge-pending",
      Resolved: "badge-assigned",
      AutoResolved: "badge-active",
      MRI: "badge-mri",
      CT: "badge-ct",
      "X-Ray": "badge-xray",
      General: "badge-general",
      Private: "badge-private",
      ICU: "badge-icu",
      Hourly: "badge-hourly",
    };
    const cls = map[variant] || map[text] || "badge-inactive";
    return `<span class="badge ${cls}">${text}</span>`;
  },

  setupStatusBadge(status) {
    return this.badge(status, status);
  },

  primaryButton(href, label) {
    return `<a href="${href}" class="btn-primary-gradient has-left-section">
      <span class="btn-section" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
      </span>
      <span class="btn-label">${label}</span>
    </a>`;
  },

  statCard(label, value) {
    return `<div class="stat-card">
      <span class="stat-card-label">${label}</span>
      <span class="stat-card-value">${value}</span>
    </div>`;
  },

  statsGrid(cards) {
    return `<div class="stats-grid">${cards.join("")}</div>`;
  },

  countBadge(count, label) {
    return `<span class="badge badge-count">${count} ${label}</span>`;
  },

  cancelButton(href, label) {
    label = label || "Cancel";
    return `<a href="${href}" class="btn-light">${label}</a>`;
  },

  tableActionLink(href, label, variant, options) {
    options = options || {};
    var iconName = options.icon;
    var iconHtml =
      iconName && this.icons[iconName]
        ? '<span class="table-action-icon" aria-hidden="true">' + this.icons[iconName](14) + "</span>"
        : "";
    var className = "table-action-btn table-action-btn--" + (variant || "neutral");
    if (options.className) {
      className += " " + options.className;
    }
    var attrs = options.attrs || "";
    if (options.title) {
      attrs += ' title="' + options.title + '"';
    }
    return (
      '<a href="' +
      href +
      '" class="' +
      className +
      '" ' +
      attrs +
      ">" +
      iconHtml +
      "<span>" +
      label +
      "</span></a>"
    );
  },

  dangerButton(label, attrs) {
    attrs = attrs || "";
    return `<button type="button" class="btn-danger" ${attrs}>${label}</button>`;
  },

  showToast(message, type) {
    type = type || "success";
    var existing = document.getElementById("ui-toast");
    if (existing) {
      existing.remove();
    }

    var toast = document.createElement("div");
    toast.id = "ui-toast";
    toast.className = "toast toast-" + type;
    toast.setAttribute("role", "status");
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add("visible");
    });

    window.setTimeout(function () {
      toast.classList.remove("visible");
      window.setTimeout(function () {
        toast.remove();
      }, 200);
    }, 3000);
  },

  readQueryFlag(name) {
    var params = new URLSearchParams(window.location.search);
    if (params.get(name) !== "1") {
      return false;
    }
    params.delete(name);
    var file = window.location.pathname.split("/").pop() || "index.html";
    var nextQuery = params.toString();
    var nextUrl = nextQuery ? file + "?" + nextQuery : file;
    window.history.replaceState({}, "", nextUrl);
    return true;
  },

  readQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  },

  clearQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    if (!params.has(name)) {
      return null;
    }
    var value = params.get(name);
    params.delete(name);
    var file = window.location.pathname.split("/").pop() || "index.html";
    var nextQuery = params.toString();
    var nextUrl = nextQuery ? file + "?" + nextQuery : file;
    window.history.replaceState({}, "", nextUrl);
    return value;
  },

  helpNavItems() {
    return [
      { key: "help-scheduling", label: "Request & Scheduling Guide", icon: "list", enabled: false },
      { key: "help-events", label: "Events & Reschedule Plans", icon: "list", enabled: false },
      { key: "help-support", label: "Support", icon: "bell", enabled: false },
    ];
  },

  /** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
  formatLocalDate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  },

  /** Always “today” in the local timezone — used by 15-day Imaging/Beds range. */
  todayISO() {
    return this.formatLocalDate(new Date());
  },

  addDays(dateStr, days) {
    var date = new Date(dateStr + "T12:00:00");
    date.setDate(date.getDate() + days);
    return this.formatLocalDate(date);
  },

  formatScheduleNavDay(dateStr) {
    var date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  },

  /** Today through today+14 (15 days). Not the mock SCHEDULE_START seed. */
  scheduleRangeDates() {
    var start = this.todayISO();
    var dates = [];
    for (var i = 0; i < this.SCHEDULE_HORIZON; i++) {
      dates.push(this.addDays(start, i));
    }
    return dates;
  },

  renderMainNav(basePath, activeNav) {
    var self = this;
    return this.navItems(basePath)
      .map(function (item) {
        return self.navLink(item, activeNav === item.key);
      })
      .join("");
  },

  navLink(item, active) {
    const icon = this.icons[item.icon]();
    if (!item.enabled) {
      return `<span class="nav-link disabled" title="${item.label}">
        <span class="nav-link-icon">${icon}</span>
        <span class="nav-link-label">${item.label}</span>
      </span>`;
    }
    const activeCls = active ? " active" : "";
    return `<a href="${item.href}" class="nav-link${activeCls}" title="${item.label}">
      <span class="nav-link-icon">${icon}</span>
      <span class="nav-link-label">${item.label}</span>
    </a>`;
  },

  renderShell({
    basePath = "",
    activeNav = "",
    title,
    subtitle = "",
    actions = "",
    headerStats = "",
    body = "",
  }) {
    const assetsPath = basePath ? `${basePath}/assets` : "assets";
    const hubHref = basePath ? `${basePath}/index.html` : "index.html";
    const mainNav = this.renderMainNav(basePath, activeNav);
    const helpNav = this.helpNavItems().map((item) => this.navLink(item, false)).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — ${this.APP_NAME}</title>
  <link rel="stylesheet" href="${assetsPath}/styles.css" />
</head>
<body>
  <div class="app-shell">
    <aside class="app-navbar" id="app-navbar">
      <div class="navbar-header">
        <div class="navbar-brand">
          <div class="brand-icon brand-icon-sm">${this.icons.flame(16)}</div>
          <span class="navbar-brand-text">${this.APP_NAME}</span>
        </div>
        <button type="button" class="sidebar-collapse-btn" id="sidebar-collapse-btn" aria-label="Collapse sidebar">
          ${this.icons.burger()}
        </button>
      </div>

      <div class="navbar-scroll">
        <div class="nav-stack">
          <nav class="nav-section" aria-label="Main navigation">
            ${mainNav}
          </nav>
          <div class="nav-help-section">
            <div class="nav-help-label">Help &amp; Documentation</div>
            <nav class="nav-section" aria-label="Help navigation">
              ${helpNav}
            </nav>
          </div>
        </div>
      </div>

      <div class="navbar-footer">
        <div class="navbar-footer-text">${this.APP_NAME} • Prototype</div>
        <div class="navbar-footer-text navbar-footer-version">v0.1.0</div>
      </div>
    </aside>

    <header class="app-header">
      <a href="${hubHref}" class="app-header-logo">
        <div class="brand-icon">${this.icons.flame(20)}</div>
        <div class="brand-text-block">
          <div class="brand-title">${this.APP_NAME}</div>
          <div class="brand-subtitle">${this.APP_TAGLINE}</div>
        </div>
      </a>

      <div class="app-header-right">
        ${headerStats || ""}
        <div class="app-header-actions">
          <div class="header-notif-target" aria-label="Notifications">
            <div class="theme-icon-light">
              ${this.icons.bell()}
            </div>
            <span class="notif-badge">0</span>
          </div>
          <div class="user-avatar" title="Staff User" aria-label="User menu">SU</div>
          <button type="button" class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Open menu">
            ${this.icons.burger()}
          </button>
        </div>
      </div>
    </header>

    <div class="navbar-backdrop" id="navbar-backdrop"></div>

    <main class="app-main">
      <div class="page-container">
        <div class="page-body">
          <div class="page-header">
            <div class="page-header-text">
              <h1 class="page-title">${title}</h1>
              ${subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ""}
            </div>
            ${actions ? `<div class="page-header-actions">${actions}</div>` : ""}
          </div>
          ${body}
        </div>
      </div>
    </main>
  </div>

  <script src="${assetsPath}/shell.js"></script>
</body>
</html>`;
  },

  mount(config) {
    document.open();
    document.write(this.renderShell(config));
    document.close();
  },
};

globalThis.UI = UI;
export { UI };
