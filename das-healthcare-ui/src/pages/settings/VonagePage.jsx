import { useOutletContext } from "react-router-dom";

export default function VonagePage() {
  const { isDark = false } = useOutletContext();

  const theme = {
    bar: isDark ? "border-slate-800/80 bg-slate-950/80" : "border-slate-200 bg-white/95",
    text: isDark ? "text-slate-100" : "text-slate-800",
    muted: isDark ? "text-slate-400" : "text-slate-600",
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className={`rounded-2xl border px-4 py-2 ${theme.bar}`}>
        <h1 className={`text-sm font-semibold ${theme.text}`}>Settings — Vonage</h1>
      </div>
      <div className={`rounded-2xl border px-4 py-4 ${theme.bar}`}>
        <p className={`text-xs ${theme.muted}`}>Vonage settings content goes here.</p>
      </div>
    </div>
  );
}
