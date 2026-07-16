import { useEffect, useState, type ReactNode } from "react";
import { Menu, Stack, Text } from "@mantine/core";
import { IconLogout, IconUser as IconUserTabler } from "@tabler/icons-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePageChrome } from "@/store/PageChromeContext";

const COLLAPSE_KEY = "scheduler-sidebar-collapsed";

type NavItem = {
  key: string;
  path: string;
  label: string;
  icon: ReactNode;
  match?: (pathname: string) => boolean;
};

function IconFlame({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 4C32 4 44 18 44 32C44 42 36 52 32 60C28 52 20 42 20 32C20 18 32 4 32 4Z"
        fill="white"
      />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function IconBed() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 4v16" />
      <path d="M2 8h18a2 2 0 0 1 2 2v10" />
      <path d="M2 17h20" />
      <path d="M6 8v9" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function IconBurger() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { key: "dashboard", path: "/", label: "Dashboard", icon: <IconHome /> },
  { key: "services", path: "/services", label: "Services", icon: <IconList /> },
  { key: "setups", path: "/setups", label: "Setups", icon: <IconBuilding /> },
  { key: "patients", path: "/patients", label: "Patients", icon: <IconUser /> },
  {
    key: "request-queue",
    path: "/queue",
    label: "Patients Queue",
    icon: <IconClipboard />,
  },
  {
    key: "schedule-day",
    path: "/schedule",
    label: "Imaging Schedule",
    icon: <IconImage />,
    match: (p) => p.startsWith("/schedule"),
  },
  {
    key: "bed-master",
    path: "/bed-master",
    label: "Bed Master",
    icon: <IconBed />,
    match: (p) => p.startsWith("/bed-master"),
  },
  {
    key: "beds-day",
    path: "/beds",
    label: "Beds Allotment",
    icon: <IconBed />,
    match: (p) => p.startsWith("/beds"),
  },
  {
    key: "events-log",
    path: "/events",
    label: "Events Log",
    icon: <IconList />,
    match: (p) => p.startsWith("/events") || p.startsWith("/reschedule"),
  },
];

const helpItems = [
  { key: "help-scheduling", label: "Request & Scheduling Guide" },
  { key: "help-events", label: "Events & Reschedule Plans" },
  { key: "help-support", label: "Support" },
];

function isMobile() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function userInitials(firstName?: string, lastName?: string, email?: string) {
  const a = (firstName ?? "").trim().charAt(0);
  const b = (lastName ?? "").trim().charAt(0);
  if (a || b) return `${a}${b}`.toUpperCase() || "U";
  return (email ?? "U").trim().charAt(0).toUpperCase() || "U";
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const chrome = usePageChrome();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (!isMobile()) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const applyCollapsed = (next: boolean) => {
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  };

  const shellClass =
    "app-shell" +
    (collapsed && !isMobile() ? " sidebar-collapsed" : "") +
    (mobileOpen ? "" : "");

  return (
    <div className={shellClass}>
      <aside
        className={"app-navbar" + (mobileOpen ? " mobile-open" : "")}
        id="app-navbar"
      >
        <div className="navbar-header">
          <div className="navbar-brand">
            <div className="brand-icon brand-icon-sm">
              <IconFlame size={16} />
            </div>
            <span className="navbar-brand-text">IgnisPLAN</span>
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn"
            id="sidebar-collapse-btn"
            aria-label="Collapse sidebar"
            onClick={() => applyCollapsed(!collapsed)}
          >
            <IconBurger />
          </button>
        </div>

        <div className="navbar-scroll">
          <div className="nav-stack">
            <nav className="nav-section" aria-label="Main navigation">
              {navItems.map((item) => {
                const active = item.match
                  ? item.match(location.pathname)
                  : location.pathname === item.path ||
                    location.pathname.startsWith(item.path + "/");
                return (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    title={item.label}
                    className={({ isActive }) =>
                      "nav-link" + (active || isActive ? " active" : "")
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="nav-link-icon">{item.icon}</span>
                    <span className="nav-link-label">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="nav-help-section">
              <div className="nav-help-label">Help &amp; Documentation</div>
              <nav className="nav-section" aria-label="Help navigation">
                {helpItems.map((item) => (
                  <span
                    key={item.key}
                    className="nav-link disabled"
                    title={item.label}
                  >
                    <span className="nav-link-icon">
                      <IconList />
                    </span>
                    <span className="nav-link-label">{item.label}</span>
                  </span>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="navbar-footer">
          <a
            className="navbar-footer-powered"
            href="https://www.infoveave.com"
            target="_blank"
            rel="noreferrer"
            title="Powered by Infoveave"
          >
            <span className="navbar-footer-powered-label">powered by</span>
            <img
              className="navbar-footer-powered-logo"
              src="https://cdn.infoveave.com/infoveave_lightbg.svg"
              alt="Infoveave"
            />
          </a>
        </div>
      </aside>

      <header className="app-header">
        <Link to="/" className="app-header-logo">
          <div className="brand-icon">
            <IconFlame size={20} />
          </div>
          <div className="brand-text-block">
            <div className="brand-title">IgnisPLAN</div>
            <div className="brand-subtitle">Diagnostic Ops</div>
          </div>
        </Link>

        <div className="app-header-right">
          {chrome.headerStatsHtml ? (
            <div
              className="schedule-navbar-stats"
              dangerouslySetInnerHTML={{ __html: chrome.headerStatsHtml }}
            />
          ) : null}
          <div className="app-header-actions">
            <div className="header-notif-target" aria-label="Notifications">
              <div className="theme-icon-light">
                <IconBell />
              </div>
              <span className="notif-badge">0</span>
            </div>
            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <div
                  className="user-avatar"
                  title={
                    user
                      ? `${user.firstName} ${user.lastName}`.trim() || user.email
                      : "User"
                  }
                  aria-label="User menu"
                  style={{ cursor: "pointer" }}
                >
                  {userInitials(user?.firstName, user?.lastName, user?.email)}
                </div>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  <Stack gap={0}>
                    <Text size="sm" fw={600}>
                      {user?.firstName} {user?.lastName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {user?.email}
                    </Text>
                  </Stack>
                </Menu.Label>
                <Menu.Divider />
                <Menu.Item leftSection={<IconUserTabler size={16} />}>
                  Profile Settings
                </Menu.Item>
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <button
              type="button"
              className="mobile-menu-btn"
              id="mobile-menu-btn"
              aria-label="Open menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <IconBurger />
            </button>
          </div>
        </div>
      </header>

      <div
        className={"navbar-backdrop" + (mobileOpen ? " open" : "")}
        id="navbar-backdrop"
        onClick={() => setMobileOpen(false)}
      />

      <main className="app-main">
        <div className="page-container">
          <div className="page-body">
            {(chrome.title || chrome.subtitle || chrome.actions) && (
              <div className="page-header">
                <div className="page-header-text">
                  {chrome.title ? (
                    <h1 className="page-title">{chrome.title}</h1>
                  ) : null}
                  {chrome.subtitle ? (
                    <p className="page-subtitle">{chrome.subtitle}</p>
                  ) : null}
                </div>
                {chrome.actions ? (
                  <div className="page-header-actions">{chrome.actions}</div>
                ) : null}
              </div>
            )}
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
