import { useOutletContext } from "react-router-dom";

export default function AppOverview() {
  const { activeMenu } = useOutletContext();
  const role = localStorage.getItem("role") ?? "Admin";
  const username = "admin1";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-950/70 to-slate-950 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {activeMenu.label}
        </p>
        <h1 className="mt-1 text-sm font-semibold text-slate-50">
          Welcome, {username}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          You are signed in as{" "}
          <span className="font-semibold text-slate-200">{role}</span>. Use the
          menu on the left to manage login, break, time on status, and
          transaction records.
        </p>
      </div>

      <div className="grid gap-3 text-xs text-slate-200 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Next
          </p>
          <p className="mt-1 font-semibold text-slate-50">
            Create dashboard (placeholder)
          </p>
          <p className="mt-1 text-slate-400">
            We will plug in widgets for all your reports (login, break, time on
            status, transactions, etc.) on this overview later.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Layout
          </p>
          <p className="mt-1 font-semibold text-slate-50">
            Sidebar navigation
          </p>
          <p className="mt-1 text-slate-400">
            Left side menu controls all report screens. Top bar gives profile,
            photo change, and app version.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Personalization
          </p>
          <p className="mt-1 font-semibold text-slate-50">
            Colors & daylight mode
          </p>
          <p className="mt-1 text-slate-400">
            Each user can toggle daylight mode and change app accent colors
            locally without impacting others.
          </p>
        </div>
      </div>
    </div>
  );
}

