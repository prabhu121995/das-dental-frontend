import { useOutletContext } from "react-router-dom";

export default function AppOverview() {
  const { activeMenu, isDark = false } = useOutletContext();
  const role = localStorage.getItem("role") ?? "Admin";
  const username = "admin1";

  const theme = {
    bar: isDark ? "border-slate-800/80 bg-slate-950/80" : "border-slate-200 bg-white/95",
    text: isDark ? "text-slate-100" : "text-slate-800",
    muted: isDark ? "text-slate-400" : "text-slate-600",
    card: isDark ? "border-slate-800/80 bg-slate-950/80" : "border-slate-200 bg-white/95",
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className={`rounded-2xl border px-4 py-2 ${theme.bar}`}>
        <h1 className={`text-sm font-semibold ${theme.text}`}>
          Report: {activeMenu.label}
        </h1>
      </div>

      <div className={`rounded-2xl border px-4 py-3 ${theme.bar}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${theme.muted}`}>
          Welcome
        </p>
        <h2 className={`mt-1 text-sm font-semibold ${theme.text}`}>
          {username}
        </h2>
        <p className={`mt-1 text-xs ${theme.muted}`}>
          You are signed in as <span className="font-semibold">{role}</span>. Use the
          menu on the left to manage login, break, time on status, and
          transaction records.
        </p>
      </div>

      <div className="grid gap-3 text-xs sm:grid-cols-3">
        <div className={`rounded-xl border px-4 py-3 ${theme.card}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${theme.muted}`}>
            Next
          </p>
          <p className={`mt-1 font-semibold ${theme.text}`}>
            Create dashboard (placeholder)
          </p>
          <p className={`mt-1 ${theme.muted}`}>
            We will plug in widgets for all your reports (login, break, time on
            status, transactions, etc.) on this overview later.
          </p>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${theme.card}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${theme.muted}`}>
            Layout
          </p>
          <p className={`mt-1 font-semibold ${theme.text}`}>
            Sidebar navigation
          </p>
          <p className={`mt-1 ${theme.muted}`}>
            Left side menu controls all report screens. Top bar gives profile,
            photo change, and app version.
          </p>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${theme.card}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${theme.muted}`}>
            Personalization
          </p>
          <p className={`mt-1 font-semibold ${theme.text}`}>
            Daylight mode
          </p>
          <p className={`mt-1 ${theme.muted}`}>
            Toggle daylight or dark mode in the header; preference is saved
            locally.
          </p>
        </div>
      </div>
    </div>
  );
}

