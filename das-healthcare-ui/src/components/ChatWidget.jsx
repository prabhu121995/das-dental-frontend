import { useEffect, useRef, useState } from "react";
import { MessageCircle, Sparkles, X } from "lucide-react";

const SAMPLE_QUERIES = [
  "Give me aggregated login duration by agent for today",
  "Show raw time-on-status rows for Team A",
  "Summarize transactions (count + avg handling time) this week",
  "Refused calls summary by agent for last 7 days",
];

const REPORT_TYPES = [
  "All reports",
  "Login",
  "Break",
  "Time on status",
  "Transaction",
  "Form submission",
  "ModMed",
  "Nextech",
  "Refused",
];

const MODES = ["Aggregated metrics", "Raw rows"];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState("All reports");
  const [mode, setMode] = useState("Aggregated metrics");
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      <div
        ref={containerRef}
        className="pointer-events-auto flex items-end justify-end gap-3"
      >
        {open && (
          <div className="w-[400px] sm:w-[460px] h-[520px] sm:h-[560px] overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/95 shadow-2xl shadow-slate-900/90 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-gradient-to-r from-medical/20 via-slate-900 to-slate-950 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-medical to-healthcare text-slate-950 shadow-lg shadow-medical/40">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-50">
                    Report Genie
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Ask for aggregated or raw reports
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-700/80 text-slate-400 hover:border-slate-500 hover:text-slate-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex h-[calc(100%-78px)] flex-col justify-between">
              <div className="space-y-3 overflow-y-auto px-4 pt-3 pb-2 text-[11px] text-slate-200">
                <div className="inline-flex max-w-[90%] items-start gap-2 rounded-2xl bg-slate-900/80 px-3 py-2">
                  <div className="mt-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-medical to-healthcare text-[10px] font-semibold text-slate-950">
                    RG
                  </div>
                  <div>
                    <p className="font-semibold text-slate-50">
                      Hi, I am Report Genie.
                    </p>
                    <p className="mt-1 text-slate-300/90">
                      I can help you explore DAS reports as{" "}
                      <span className="font-semibold text-medical">
                        aggregated metrics
                      </span>{" "}
                      or{" "}
                      <span className="font-semibold text-medical">
                        raw rows
                      </span>{" "}
                      across all modules.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Report type
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {REPORT_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setReportType(type)}
                          className={`rounded-full px-2.5 py-1 text-[10px] ${
                            reportType === type
                              ? "bg-medical/20 text-medical border border-medical/50"
                              : "border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-medical/60 hover:text-medical"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Mode
                    </p>
                    <div className="space-y-1.5">
                      {MODES.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMode(m)}
                          className={`flex w-full items-center justify-between rounded-xl border px-2.5 py-1.5 text-[10px] ${
                            mode === m
                              ? "border-medical/70 bg-medical/15 text-medical"
                              : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-medical/60 hover:text-medical"
                          }`}
                        >
                          <span>{m}</span>
                          {mode === m && (
                            <span className="h-1.5 w-1.5 rounded-full bg-medical" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Try asking
                  </p>
                  <div className="space-y-1.5">
                    {SAMPLE_QUERIES.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuery(q)}
                        className="inline-flex max-w-full rounded-2xl bg-slate-900/80 px-3 py-1.5 text-left text-[11px] text-slate-200 hover:border hover:border-medical/60"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 bg-slate-950/95 px-3 pb-3 pt-2">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {["Today", "This week", "By agent", "By date"].map(
                    (chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() =>
                          setQuery(
                            `${mode === "Aggregated metrics" ? "Aggregated" : "Raw"} ${reportType.toLowerCase()} ${chip.toLowerCase()}`,
                          )
                        }
                        className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[10px] text-slate-200 hover:border-medical/60 hover:text-medical"
                      >
                        {chip}
                      </button>
                    ),
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2">
                  <input
                    type="text"
                    placeholder="Ask for aggregated or raw report…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-7 flex-1 bg-transparent text-[11px] text-slate-100 placeholder:text-slate-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // Template only: in future, send `query`, `reportType`, `mode` to backend.
                      setQuery("");
                    }}
                    className="inline-flex h-7 items-center rounded-full bg-gradient-to-r from-medical to-healthcare px-3 text-[10px] font-semibold text-slate-950 shadow shadow-healthcare/40"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-medical to-healthcare text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.9)] outline-none transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-medical/60"
        >
          <span className="absolute inset-0 rounded-full bg-medical/40 blur-xl opacity-0 animate-[ping_3s_ease-out_infinite]" />
          <MessageCircle className="relative h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

