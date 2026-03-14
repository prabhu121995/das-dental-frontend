import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Sun, Moon, ChevronDown, ChevronRight } from "lucide-react";
import ChatWidget from "../components/ChatWidget";

/** Submenus under Reports (all report types) */
const REPORT_MENU_ITEMS = [
  { key: "login", label: "Login", path: "/app/login" },
  { key: "break", label: "Break", path: "/app/break" },
  { key: "time-on-status", label: "Time on Status", path: "/app/time-on-status" },
  { key: "transaction", label: "Transaction", path: "/app/transactions" },
  { key: "form-submission", label: "Form Submission", path: "/app/form-submissions" },
  { key: "modmed", label: "ModMed", path: "/app/modmed" },
  { key: "nextech", label: "Nextech", path: "/app/nextech" },
  { key: "refused", label: "Refused", path: "/app/refused" },
  { key: "delete", label: "Delete Records", path: "/app/delete-records" },
];

/** Submenus under Settings (admin/teamlead only) */
const SETTINGS_MENU_ITEMS = [
  { key: "settings-team", label: "Team", path: "/app/settings/team" },
  { key: "settings-vonage", label: "Vonage", path: "/app/settings/vonage" },
];

/** All link items for activeMenu lookup: Dashboard, report submenus, Settings submenus, Online Appt */
const ALL_MENU_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/app/dashboard" },
  ...REPORT_MENU_ITEMS,
  ...SETTINGS_MENU_ITEMS,
  { key: "online-appt", label: "Online Appt", path: "/app/online-appt" },
];

const REPORTS_STORAGE_KEY = "das_sidebar_reports_open";
const SETTINGS_STORAGE_KEY = "das_sidebar_settings_open";

/** Admin and teamlead can access Dashboard and Reports. Agent can only access Online Appt. */
function canAccessOverviewDashboardReports(role) {
  const r = (role ?? "").trim().toLowerCase();
  return r === "admin" || r === "teamlead";
}

const STORAGE_KEYS = {
  THEME: "das_theme",
  PROFILE: "das_profile",
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) === "dark";
    } catch {
      return false;
    }
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [reportsOpen, setReportsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(REPORTS_STORAGE_KEY);
      return saved !== "false";
    } catch {
      return true;
    }
  });
  const [settingsOpen, setSettingsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return saved !== "false";
    } catch {
      return true;
    }
  });
  const [profile, setProfile] = useState(() => {
    try {
      const role = localStorage.getItem("role") ?? "Admin";
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      const parsed = saved ? JSON.parse(saved) : {};
      return { name: "Admin User", role, avatar: null, ...parsed };
    } catch {
      return { name: "Admin User", role: "Admin", avatar: null };
    }
  });

  const role = (profile?.role ?? (typeof window !== "undefined" ? localStorage.getItem("role") : null) ?? "Admin").trim();
  const canAccessReports = canAccessOverviewDashboardReports(role);

  const activeMenu = useMemo(
    () =>
      ALL_MENU_ITEMS.find((item) => location.pathname.startsWith(item.path)) ?? ALL_MENU_ITEMS[0],
    [location.pathname],
  );

  const isReportSubmenuActive = REPORT_MENU_ITEMS.some((item) => item.key === activeMenu.key);
  const isSettingsSubmenuActive = SETTINGS_MENU_ITEMS.some((item) => item.key === activeMenu.key);

  const toggleReports = () => {
    const next = !reportsOpen;
    setReportsOpen(next);
    try {
      localStorage.setItem(REPORTS_STORAGE_KEY, String(next));
    } catch {}
  };

  const toggleSettings = () => {
    const next = !settingsOpen;
    setSettingsOpen(next);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, String(next));
    } catch {}
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? "dark" : "light");
  }, [isDark]);

  // Close profile panel when route changes (sync UI to navigation)
  useEffect(() => {
    const t = setTimeout(() => setProfileOpen(false), 0);
    return () => clearTimeout(t);
  }, [location.pathname]);

  // Agent can only access Online Appt; redirect to it if they hit any other route
  useEffect(() => {
    if (!canAccessReports && location.pathname !== "/app/online-appt") {
      navigate("/app/online-appt", { replace: true });
    }
  }, [canAccessReports, location.pathname, navigate]);

  // Auto-expand Settings when navigating to a settings submenu
  useEffect(() => {
    if (isSettingsSubmenuActive && !settingsOpen) setSettingsOpen(true);
  }, [isSettingsSubmenuActive, settingsOpen]);

  // Auto-expand Reports when navigating to a report submenu
  useEffect(() => {
    if (isReportSubmenuActive && !reportsOpen) setReportsOpen(true);
  }, [isReportSubmenuActive, reportsOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/", { replace: true });
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...profile, avatar: reader.result };
      setProfile(next);
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next));
    };
    reader.readAsDataURL(file);
  };

  const appVersion = import.meta.env.VITE_APP_VERSION ?? "v0.0.0";

  const ui = {
    appBg: isDark ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900",
    panel: isDark
      ? "border-slate-800/80 bg-slate-950/80"
      : "border-slate-200 bg-white/80",
    panelSoft: isDark ? "bg-slate-950/60" : "bg-white",
    panelSolid: isDark ? "bg-slate-950/90" : "bg-white/95",
    textMuted: isDark ? "text-slate-400" : "text-slate-600",
    textSoft: isDark ? "text-slate-300" : "text-slate-700",
    divider: isDark ? "border-slate-800/80" : "border-slate-200",
    hover: isDark ? "hover:bg-slate-900/80" : "hover:bg-slate-100",
  };

  return (
    <div className={`flex min-h-screen ${ui.appBg}`}>
      {/* Sidebar */}
      <aside
        className={`relative z-10 flex w-64 shrink-0 flex-col border-r px-4 py-5 backdrop-blur-xl ${ui.panel} ${ui.divider}`}
      >
        <div className="mb-6 flex items-center justify-between gap-2 px-1">
          <div>
            <div
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${ui.textMuted}`}
            >
              DAS
            </div>
            <div className="text-sm font-semibold">Healthcare Ops</div>
          </div>
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-mono ${
              isDark ? "bg-slate-900 text-slate-300" : "bg-slate-200 text-slate-700"
            }`}
          >
            {String(appVersion)}
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          {canAccessReports && (
            <>
              {/* 1. Dashboard */}
              <NavLink to="/app/dashboard">
                {({ isActive }) => (
                  <Motion.div
                    whileHover={{ x: 2 }}
                    className={`group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? isDark
                          ? "bg-slate-800/80 text-slate-50"
                          : "bg-slate-200 text-slate-900"
                        : `${ui.textSoft} ${ui.hover}`
                    }`}
                  >
                    <span>Dashboard</span>
                    {activeMenu.key === "dashboard" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-medical" />
                    )}
                  </Motion.div>
                )}
              </NavLink>

              {/* 3. Reports (toggle + submenus) */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={toggleReports}
                  className={`group flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${ui.textSoft} ${ui.hover}`}
                >
                  <span>Reports</span>
                  <Motion.span
                    animate={{ rotate: reportsOpen ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    {reportsOpen ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </Motion.span>
                </button>
                <Motion.div
                  initial={false}
                  animate={{ height: reportsOpen ? "auto" : 0, opacity: reportsOpen ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-0.5 space-y-0.5 pl-1">
                    {REPORT_MENU_ITEMS.map((item) => (
                      <NavLink key={item.key} to={item.path}>
                        {({ isActive }) => (
                          <Motion.div
                            whileHover={{ x: 2 }}
                            className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 pl-4 text-xs font-medium transition ${
                              isActive
                                ? isDark
                                  ? "bg-slate-800/80 text-slate-50"
                                  : "bg-slate-200 text-slate-900"
                                : `${ui.textSoft} ${ui.hover}`
                            }`}
                          >
                            <span>{item.label}</span>
                            {item.key === activeMenu.key && (
                              <span className="h-1.5 w-1.5 rounded-full bg-medical" />
                            )}
                          </Motion.div>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </Motion.div>
              </div>
            </>
          )}

          {/* 4. Settings (admin/teamlead only): Team, Vonage */}
          {canAccessReports && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={toggleSettings}
                className={`group flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${ui.textSoft} ${ui.hover}`}
              >
                <span>Settings</span>
                <Motion.span
                  animate={{ rotate: settingsOpen ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  {settingsOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </Motion.span>
              </button>
              <Motion.div
                initial={false}
                animate={{ height: settingsOpen ? "auto" : 0, opacity: settingsOpen ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-0.5 space-y-0.5 pl-1">
                  {SETTINGS_MENU_ITEMS.map((item) => (
                    <NavLink key={item.key} to={item.path}>
                      {({ isActive }) => (
                        <Motion.div
                          whileHover={{ x: 2 }}
                          className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 pl-4 text-xs font-medium transition ${
                            isActive
                              ? isDark
                                ? "bg-slate-800/80 text-slate-50"
                                : "bg-slate-200 text-slate-900"
                              : `${ui.textSoft} ${ui.hover}`
                          }`}
                        >
                          <span>{item.label}</span>
                          {item.key === activeMenu.key && (
                            <span className="h-1.5 w-1.5 rounded-full bg-medical" />
                          )}
                        </Motion.div>
                      )}
                    </NavLink>
                  ))}
                </div>
              </Motion.div>
            </div>
          )}

          {/* 5. Online Appt (all roles) */}
          <NavLink to="/app/online-appt">
            {({ isActive }) => (
              <Motion.div
                whileHover={{ x: 2 }}
                className={`group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                  isActive
                    ? isDark
                      ? "bg-slate-800/80 text-slate-50"
                      : "bg-slate-200 text-slate-900"
                    : `${ui.textSoft} ${ui.hover}`
                }`}
              >
                <span>Online Appt</span>
                {activeMenu.key === "online-appt" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-medical" />
                )}
              </Motion.div>
            )}
          </NavLink>
        </nav>

      </aside>

      {/* Main content */}
      <main className={`flex min-h-screen flex-1 flex-col ${ui.panelSoft}`}>
        {/* Top bar */}
        <header
          className={`relative z-40 border-b px-3 py-3 sm:px-6 sm:py-3 backdrop-blur-xl ${ui.panel} ${ui.divider}`}
        >
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className={`text-xs font-medium ${ui.textMuted}`}>
                  Welcome back
                </span>
                <span className="text-sm font-semibold">{profile.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs transition ${
                  isDark
                    ? "border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/60"
                    : "border-slate-200 bg-white hover:bg-slate-100"
                }`}
                title={isDark ? "Switch to daylight" : "Switch to dark"}
              >
                <Motion.div
                  key={isDark ? "moon" : "sun"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center justify-center"
                >
                  {isDark ? (
                    <Moon className="h-4 w-4 text-slate-300" />
                  ) : (
                    <Sun className="h-4 w-4 text-amber-500" />
                  )}
                </Motion.div>
                <span
                  className={`inline-flex h-4 w-6 items-center rounded-full px-0.5 transition ${
                    isDark ? "bg-slate-600" : "bg-amber-400/80"
                  }`}
                >
                  <Motion.span
                    className="h-3 w-3 rounded-full bg-white shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    animate={{ x: isDark ? 0 : 8 }}
                  />
                </span>
              </button>
            </div>
          </div>
        </header>

        <section className={`relative flex-1 min-h-0 overflow-auto px-3 py-4 sm:px-6 sm:py-5 ${isDark ? "bg-slate-950/50" : "bg-slate-50/80"}`}>
          <div className="flex min-h-full w-full flex-col">
            <Outlet context={{ activeMenu, isDark, ui }} />
          </div>
        </section>
      </main>

      {/* Profile: fixed top-right, inside screen */}
      <div className="fixed top-1 right-4 z-40 flex items-center sm:top-1 sm:right-1">
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 text-left text-xs transition ${
            isDark
              ? "border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/60"
              : "border-slate-200 bg-white hover:bg-slate-100"
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-medical to-healthcare text-xs font-semibold text-primary">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              profile.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
            )}
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[11px] font-semibold">{profile.role}</div>
            <div className={`text-[11px] ${ui.textMuted}`}>Profile</div>
          </div>
        </button>
      </div>

      {profileOpen && (
        <div className="pointer-events-none fixed top-4 right-4 z-50 sm:top-6 sm:right-6">
          <aside
            ref={profileRef}
            className={`pointer-events-auto flex w-[320px] max-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl ${ui.panelSolid} ${ui.divider}`}
          >
            <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${ui.divider}`}>
              <div className="text-xs font-semibold">Profile</div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${ui.divider} ${
                  isDark
                    ? "bg-slate-900/70 hover:bg-slate-800"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                Close
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-medical to-healthcare text-sm font-semibold text-primary">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold">{profile.name}</div>
                  <div className={`text-[11px] ${ui.textMuted}`}>
                    Role: {profile.role}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div
                  className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${ui.textMuted}`}
                >
                  Profile
                </div>
                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-[11px] transition ${
                    isDark
                      ? "border-slate-800/80 hover:border-medical/60"
                      : "border-slate-200 hover:border-medical/60"
                  }`}
                >
                  <span className={ui.textSoft}>Change photo</span>
                  <span className="text-[11px] text-medical">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
            </div>

            <div className={`mt-auto shrink-0 border-t px-4 py-3 ${ui.divider}`}>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-300 hover:bg-red-500/15"
              >
                Logout
              </button>
            </div>
            </div>
          </aside>
        </div>
      )}

      {canAccessReports && <ChatWidget />}
    </div>
  );
}

