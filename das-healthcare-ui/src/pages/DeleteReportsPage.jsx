import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { deleteReports } from "../services/deleteReportsService";

const REPORT_OPTIONS = [
  { value: "login", label: "Login" },
  { value: "break", label: "Break" },
  { value: "status", label: "Status" },
  { value: "refused", label: "Refused" },
  { value: "submission", label: "Submission" },
  { value: "transaction", label: "Transaction" },
  { value: "modmed", label: "ModMed" },
  { value: "nextech", label: "Nextech" },
];

function toYYYYMMDD(date) {
  if (!date) return "";
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const today = toYYYYMMDD(new Date());

export default function DeleteReportsPage() {
  const { isDark = false } = useOutletContext();
  const navigate = useNavigate();
  const [selectedReports, setSelectedReports] = useState([]);
  const [shiftdate, setShiftdate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultList, setResultList] = useState(null);

  const theme = {
    bar: isDark ? "border-slate-800/80 bg-slate-950/80" : "border-slate-200 bg-white/95",
    input: isDark ? "border-slate-700 bg-slate-950 text-slate-100" : "border-slate-300 bg-white text-slate-900",
    label: isDark ? "text-slate-400" : "text-slate-600",
  };

  const toggleReport = (value) => {
    setSelectedReports((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value],
    );
  };

  const handleDelete = async () => {
    if (!shiftdate) {
      setError("Please select a date.");
      return;
    }
    if (selectedReports.length === 0) {
      setError("Please select at least one report.");
      return;
    }
    setError("");
    setLoading(true);
    setResultList(null);
    try {
      const res = await deleteReports({ shiftdate, reports: selectedReports });
      const list = res?.data?.result ?? [];
      setResultList(list);
      setSelectedReports([]);
      // Auto-dismiss result after 5 seconds
      setTimeout(() => setResultList(null), 5000);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
        navigate("/", { replace: true });
        return;
      }
      setError(err.response?.data?.message ?? err.message ?? "Failed to delete reports.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className={`rounded-2xl border px-4 py-2 ${theme.bar}`}>
        <h1 className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
          Delete reports
        </h1>
      </div>

      <div className={`flex flex-col gap-4 rounded-2xl border px-4 py-4 ${theme.bar}`}>
        <div>
          <span className={`mb-2 block text-xs font-medium ${theme.label}`}>Shift date</span>
          <input
            type="date"
            value={shiftdate}
            onChange={(e) => setShiftdate(e.target.value)}
            className={`h-9 w-full max-w-xs rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-medical/40 ${theme.input}`}
          />
        </div>

        <div>
          <span className={`mb-2 block text-xs font-medium ${theme.label}`}>Reports (multi-select)</span>
          <div className="flex flex-wrap gap-3">
            {REPORT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                  selectedReports.includes(opt.value)
                    ? isDark
                      ? "border-medical/60 bg-medical/20 text-medical"
                      : "border-medical/60 bg-medical/10 text-medical"
                    : isDark
                      ? "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600"
                      : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedReports.includes(opt.value)}
                  onChange={() => toggleReport(opt.value)}
                  className="h-4 w-4 rounded border-slate-500 text-medical focus:ring-medical/50"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-900/80 bg-red-950/50 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="flex h-10 w-fit items-center gap-2 rounded-lg border border-red-600/80 bg-red-600/20 px-4 text-sm font-semibold text-red-400 hover:bg-red-600/30 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {resultList && resultList.length > 0 && (
          <motion.div
            key="result-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 ${theme.bar}`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                Result
              </span>
              <button
                type="button"
                onClick={() => setResultList(null)}
                className={`rounded px-2 py-1 text-[11px] ${isDark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"}`}
              >
                Dismiss
              </button>
            </div>
            <ul className="flex flex-col gap-1.5">
              {resultList.map((item, i) => (
                <motion.li
                  key={`${item.report}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.2 }}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                    isDark ? "border-slate-700/80 bg-slate-900/50 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                >
                  <span className="font-medium">{item.report}</span>
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                    {item.start_date}
                    {item.end_date && item.end_date !== item.start_date ? ` – ${item.end_date}` : ""}
                  </span>
                  <span className={isDark ? "text-emerald-400" : "text-emerald-600"}>{item.message}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
