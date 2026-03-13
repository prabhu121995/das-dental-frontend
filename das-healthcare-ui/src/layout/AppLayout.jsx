import { useEffect, useMemo, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ChatWidget from "../components/ChatWidget";

const MENU_ITEMS = [
  { key: "overview", label: "Overview", path: "/app" },
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

const DEFAULT_COLORS = {
  primary: "#0f172a",
  accent: "#00d4ff",
  accentSoft: "#0ea5e9",
};

const STORAGE_KEYS = {
  THEME: "das_theme",
  COLORS: "das_colors",
  PROFILE: "das_profile",
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [profile, setProfile] = useState({
    name: "Admin User",
    role: localStorage.getItem("role") ?? "Admin",
    avatar: null,
  });

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      const savedColors = localStorage.getItem(STORAGE_KEYS.COLORS);
      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);

      if (savedTheme) setIsDark(savedTheme === "dark");
      if (savedColors) setColors(JSON.parse(savedColors));
      if (savedProfile) {
        setProfile((prev) => ({ ...prev, ...JSON.parse(savedProfile) }));
      }
    } catch {
      // ignore parse issues
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLORS, JSON.stringify(colors));
  }, [colors]);

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [profileOpen]);

  const activeMenu = useMemo(
    () =>
      MENU_ITEMS.find((item) =>
        item.path === "/app"
          ? location.pathname === "/app"
          : location.pathname.startsWith(item.path),
      ) ?? MENU_ITEMS[0],
    [location.pathname],
  );

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
    appBg: isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900",
    panel: isDark
      ? "border-slate-800/80 bg-slate-950/80"
      : "border-slate-200 bg-white/80",
    panelSoft: isDark ? "bg-slate-950/60" : "bg-slate-100/50",
    panelSolid: isDark ? "bg-slate-950/90" : "bg-white/90",
    textMuted: isDark ? "text-slate-400" : "text-slate-600",
    textSoft: isDark ? "text-slate-300" : "text-slate-700",
    divider: isDark ? "border-slate-800/80" : "border-slate-200",
    hover: isDark ? "hover:bg-slate-900/80" : "hover:bg-slate-100",
  };

  return (
    <div
      className={`flex min-h-screen ${ui.appBg}`}
      style={{
        backgroundImage: `radial-gradient(circle at top left, ${colors.accent}${
          isDark ? "22" : "18"
        }, transparent 55%), radial-gradient(circle at bottom right, ${
          colors.accentSoft
        }${isDark ? "22" : "18"}, transparent 55%)`,
      }}
    >
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
          {MENU_ITEMS.map((item) => (
            <NavLink key={item.key} to={item.path}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
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
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`mt-4 space-y-3 border-t pt-3 text-xs ${ui.divider}`}>
          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left ${
              isDark ? "bg-slate-900/80 hover:bg-slate-800" : "bg-white hover:bg-slate-100"
            }`}
          >
            <span className={ui.textSoft}>Daylight mode</span>
            <span
              className={`inline-flex h-4 w-7 items-center rounded-full px-0.5 transition ${
                isDark ? "bg-slate-600" : "bg-medical"
              }`}
            >
              <span
                className={`h-3 w-3 rounded-full bg-white transition-transform ${
                  isDark ? "translate-x-0" : "translate-x-3"
                }`}
              />
            </span>
          </button>

          <div
            className={`space-y-1 rounded-lg p-3 ${
              isDark ? "bg-slate-900/80" : "bg-white"
            }`}
          >
            <div
              className={`mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${ui.textMuted}`}
            >
              App colors
            </div>
            {["primary", "accent", "accentSoft"].map((key) => (
              <div
                key={key}
                className="flex items-center justify-between gap-2"
              >
                <span className={`text-[11px] capitalize ${ui.textSoft}`}>
                  {key === "accentSoft" ? "Accent 2" : key}
                </span>
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) =>
                    setColors((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className={`h-5 w-10 cursor-pointer rounded border p-0.5 ${
                    isDark
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex min-h-screen flex-1 flex-col ${ui.panelSoft}`}>
        {/* Top bar */}
        <header
          className={`relative z-40 border-b px-3 py-3 sm:px-6 sm:py-3 backdrop-blur-xl ${ui.panel} ${ui.divider}`}
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col">
              <span className={`text-xs font-medium ${ui.textMuted}`}>
                Welcome back
              </span>
              <span className="text-sm font-semibold">{profile.name}</span>
            </div>

            <div className="relative flex items-center gap-4">
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
                  <div className="text-[11px] font-semibold">
                    {profile.role}
                  </div>
                  <div className={`text-[11px] ${ui.textMuted}`}>Profile</div>
                </div>
              </button>
            </div>
          </div>
        </header>

        <section className="relative flex-1 min-h-0 overflow-hidden px-3 py-4 sm:px-6 sm:py-5">
          <div className="flex h-full w-full flex-col">
            <Outlet context={{ activeMenu, colors }} />
          </div>
        </section>
      </main>

      {profileOpen && (
        <>
          <button
            type="button"
            aria-label="Close profile"
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setProfileOpen(false)}
          />
          <aside
            className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto border-l shadow-2xl ${ui.panelSolid} ${ui.divider}`}
          >
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="text-xs font-semibold">Profile</div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${ui.divider} ${
                  isDark
                    ? "bg-slate-900/70 hover:bg-slate-800"
                    : "bg-white hover:bg-slate-100"
                }`}
              >
                Close
              </button>
            </div>

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

            <div className={`mt-auto border-t px-4 py-3 ${ui.divider}`}>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-300 hover:bg-red-500/15"
              >
                Logout
              </button>
            </div>
          </aside>
        </>
      )}

      <ChatWidget />
    </div>
  );
}

