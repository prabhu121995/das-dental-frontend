import { useEffect, useMemo, useState } from "react";

const EyeIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function DataTable({
  title,
  description,
  columns,
  rows,
  editable = false,
  editColumnFirst = true,
  onEditRow,
  className = "",
  tableScrollClassName = "max-h-[70vh]",
  searchValue,
  onSearchChange,
  pageValue,
  onPageChange,
  pageSizeValue,
  onPageSizeChange,
  hideToolbar = false,
  hidePagination = false,
  onPaginationInfo,
  isDark = false,
  /** When "All" is selected: null = no cap (show all rows); number = cap (default 5000) */
  maxPageSize,
}) {
  const theme = {
    tableWrap: isDark ? "border-slate-800/80 bg-slate-950" : "border-slate-200 bg-white",
    thead: isDark ? "bg-slate-900/95 text-slate-300" : "bg-slate-100 text-slate-800",
    th: isDark ? "text-slate-300" : "text-slate-700",
    tbody: isDark ? "divide-slate-800/60 bg-slate-950/80" : "divide-slate-200 bg-white",
    td: isDark ? "text-slate-200" : "text-slate-800",
    empty: isDark ? "text-slate-500" : "text-slate-500",
    paginationBar: isDark ? "border-slate-800/80 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700",
    prevNext: isDark
      ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
      : "border-slate-400 bg-white text-slate-800 hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed",
    editBtn: isDark ? "border-slate-700 text-slate-200 hover:border-medical hover:text-medical" : "border-slate-300 text-slate-700 hover:border-medical hover:text-medical",
  };
  const [internalSearch, setInternalSearch] = useState("");
  const [sortKey, setSortKey] = useState(columns[0]?.accessorKey ?? "");
  const [sortDir, setSortDir] = useState("desc");
  const [internalPage, setInternalPage] = useState(1);
  // Page size options for tables with 5k–50k+ rows; "All" only when total is under cap to avoid DOM overload
  const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  const MAX_SAFE_PAGE_SIZE = 5000; // cap "All" to avoid rendering 50k rows at once
  const [internalPageSize, setInternalPageSize] = useState(100);

  const [notesViewOpen, setNotesViewOpen] = useState(false);
  const [notesViewText, setNotesViewText] = useState("");

  const search = searchValue !== undefined ? searchValue : internalSearch;
  const setSearch = onSearchChange ?? ((v) => setInternalSearch(v));
  const page = pageValue !== undefined ? pageValue : internalPage;
  const setPage = onPageChange ?? setInternalPage;
  const pageSize = pageSizeValue !== undefined ? pageSizeValue : internalPageSize;
  const setPageSize = onPageSizeChange ?? setInternalPageSize;

  const sortType = columns.find((c) => c.accessorKey === sortKey)?.sortType;

  const durationToSeconds = (v) => {
    if (v == null) return NaN;
    if (typeof v === "number" && Number.isFinite(v)) return v * 3600; // interpret as hours
    const s = String(v).trim();
    if (!s) return NaN;
    if (!s.includes(":")) {
      const asNum = Number(s);
      return Number.isFinite(asNum) ? asNum * 3600 : NaN; // interpret as hours
    }
    const parts = s.split(":").map(Number);
    if (parts.some((p) => Number.isNaN(p))) return NaN;
    if (parts.length >= 3) return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
    if (parts.length === 2) return parts[0] * 60 + (parts[1] || 0);
    if (parts.length === 1) return parts[0] || 0;
    return NaN;
  };

  const compareValues = (av, bv) => {
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    switch (sortType) {
      case "weekday": {
        // Expected values like: Mon, Tue, Wed, Thu, Fri, Sat, Sun
        const order = {
          mon: 1,
          tue: 2,
          wed: 3,
          thu: 4,
          fri: 5,
          sat: 6,
          sun: 7,
        };
        const toKey = (v) => String(v ?? "").trim().toLowerCase().slice(0, 3);
        const ai = order[toKey(av)];
        const bi = order[toKey(bv)];
        if (ai == null && bi == null) return String(av).localeCompare(String(bv));
        if (ai == null) return 1;
        if (bi == null) return -1;
        return ai - bi;
      }
      case "month": {
        // Expected values like: Jan, Feb, ... Dec
        const order = {
          jan: 1,
          feb: 2,
          mar: 3,
          apr: 4,
          may: 5,
          jun: 6,
          jul: 7,
          aug: 8,
          sep: 9,
          oct: 10,
          nov: 11,
          dec: 12,
        };
        const toKey = (v) => String(v ?? "").trim().toLowerCase().slice(0, 3);
        const ai = order[toKey(av)];
        const bi = order[toKey(bv)];
        if (ai == null && bi == null) return String(av).localeCompare(String(bv));
        if (ai == null) return 1;
        if (bi == null) return -1;
        return ai - bi;
      }
      case "week": {
        // Expected values like: "Week 44"
        const toNum = (v) => {
          const s = String(v ?? "");
          const m = s.match(/(\d+)/);
          return m ? Number(m[1]) : NaN;
        };
        const an = toNum(av);
        const bn = toNum(bv);
        if (Number.isNaN(an) && Number.isNaN(bn)) return String(av).localeCompare(String(bv), undefined, { numeric: true });
        if (Number.isNaN(an)) return 1;
        if (Number.isNaN(bn)) return -1;
        return an - bn;
      }
      case "number": {
        const an = Number(av);
        const bn = Number(bv);
        if (Number.isNaN(an) && Number.isNaN(bn)) return 0;
        if (Number.isNaN(an)) return 1;
        if (Number.isNaN(bn)) return -1;
        return an - bn;
      }
      case "date":
      case "datetime": {
        const at = new Date(av).getTime();
        const bt = new Date(bv).getTime();
        if (Number.isNaN(at) && Number.isNaN(bt)) return String(av).localeCompare(String(bv));
        if (Number.isNaN(at)) return 1;
        if (Number.isNaN(bt)) return -1;
        return at - bt;
      }
      case "duration": {
        const toSeconds = (v) => {
          const s = String(v ?? "").trim();
          const parts = s.split(":").map(Number);
          if (parts.length >= 3)
            return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
          if (parts.length === 2) return parts[0] * 60 + (parts[1] || 0);
          if (parts.length === 1) return parts[0] || 0;
          return 0;
        };
        return toSeconds(av) - toSeconds(bv);
      }
      default:
        if (av === bv) return 0;
        return String(av).localeCompare(String(bv), undefined, { numeric: true });
    }
  };

  const filteredRows = useMemo(() => {
    let data = rows ?? [];

    if (search.trim()) {
      const lower = search.toLowerCase();
      data = data.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? "").toLowerCase().includes(lower),
        ),
      );
    }

    if (sortKey) {
      data = [...data].sort((a, b) => compareValues(a[sortKey], b[sortKey]));
      if (sortDir === "desc") data.reverse();
    }

    return data;
  }, [rows, search, sortKey, sortDir, sortType]);

  // "All": maxPageSize === null means no cap; number or undefined uses that cap (default MAX_SAFE_PAGE_SIZE)
  const allCap = maxPageSize === null ? Infinity : (maxPageSize ?? MAX_SAFE_PAGE_SIZE);
  const effectivePageSize =
    pageSize === 0 || pageSize === "all"
      ? Math.min(filteredRows.length, allCap)
      : pageSize;
  const totalPages =
    effectivePageSize > 0 && Number.isFinite(filteredRows.length / effectivePageSize)
      ? Math.max(1, Math.ceil(filteredRows.length / effectivePageSize))
      : 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * effectivePageSize;
    return filteredRows.slice(start, start + effectivePageSize);
  }, [filteredRows, currentPage, effectivePageSize]);

  useEffect(() => {
    if (onPaginationInfo) {
      onPaginationInfo({
        totalPages,
        currentPage,
        totalRows: filteredRows.length,
      });
    }
  }, [onPaginationInfo, totalPages, currentPage, filteredRows.length]);

  useEffect(() => {
    if (!notesViewOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setNotesViewOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [notesViewOpen]);

  const openNotesView = (val) => {
    const text = typeof val === "string" ? val : val == null ? "" : String(val);
    setNotesViewText(text);
    setNotesViewOpen(true);
  };

  const handleHeaderClick = (accessorKey) => {
    if (sortKey === accessorKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(accessorKey);
      setSortDir("asc");
    }
  };

  return (
    <div className={`flex w-full min-h-0 flex-col gap-4 ${className}`}>
      {!hideToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-sm font-semibold ${isDark ? "text-slate-50" : "text-slate-800"}`}>{title}</h2>
            {description && (
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{description}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${isDark ? "bg-slate-900/80 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
              <span>Search</span>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (onPageChange) onPageChange(1);
                  else setInternalPage(1);
                }}
                placeholder="Type to filter"
                className={`h-6 w-28 rounded bg-transparent px-1 text-[11px] outline-none ${isDark ? "text-slate-100" : "text-slate-900"}`}
              />
            </label>
            <label className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${isDark ? "bg-slate-900/80 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
              <span className="whitespace-nowrap">Rows</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const v = e.target.value;
                  setPageSize(v === "all" ? 0 : Number(v));
                  if (onPageChange) onPageChange(1);
                  else setInternalPage(1);
                }}
                className={`h-7 min-w-[4rem] cursor-pointer rounded-md border px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-medical/30 ${
                  isDark
                    ? "border-slate-600 bg-slate-800 text-slate-100"
                    : "border-slate-300 bg-white text-slate-800"
                }`}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size} className={isDark ? "bg-slate-800 text-slate-100" : "bg-white text-slate-800"}>
                    {size.toLocaleString()}
                  </option>
                ))}
                <option value={0} className={isDark ? "bg-slate-800 text-slate-100" : "bg-white text-slate-800"}>
                  {filteredRows.length > MAX_SAFE_PAGE_SIZE ? `All (max ${MAX_SAFE_PAGE_SIZE.toLocaleString()})` : "All"}
                </option>
              </select>
            </label>
          </div>
        </div>
      )}

      <div className={`flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border ${theme.tableWrap}`}>
        <div className={`min-h-0 flex-1 overflow-auto ${tableScrollClassName}`}>
          <table className={`min-w-max divide-y text-xs ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
            <thead className={`sticky top-0 z-10 ${theme.thead}`}>
              <tr>
                {editable && editColumnFirst && (
                  <th className={`px-3 py-2 text-left font-semibold whitespace-nowrap ${theme.th}`} style={{ minWidth: 100 }}>
                    Edit
                  </th>
                )}
                {columns.map((col) => {
                  const isSorted = sortKey === col.accessorKey;
                  const baseWidth =
                    col.minWidth ??
                    (typeof col.header === "string" && col.header.length > 14
                      ? 160
                      : 120);
                  return (
                    <th
                      key={col.accessorKey}
                      scope="col"
                      onClick={() => handleHeaderClick(col.accessorKey)}
                      className={`cursor-pointer px-3 py-2 text-left font-semibold whitespace-nowrap ${theme.th}`}
                      style={{
                        minWidth: baseWidth,
                        maxWidth: col.maxWidth,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {isSorted && (
                          <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`} title={sortDir === "asc" ? "Ascending – click for descending" : "Descending – click for ascending"}>
                            {sortDir === "asc" ? "▲ Asc" : "▼ Desc"}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                {editable && !editColumnFirst && (
                  <th className={`px-3 py-2 text-left font-semibold ${theme.th}`}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.tbody}`}>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (editable ? 1 : 0)}
                    className={`px-3 py-8 text-center text-xs ${theme.empty}`}
                  >
                    No records to display.
                  </td>
                </tr>
              ) : (
                pageRows.map((row, rowIndex) => (
                  <tr key={row.id ?? row.Id ?? row.rec_id ?? rowIndex}>
                    {editable && editColumnFirst && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onEditRow?.(row)}
                          className={`rounded-lg border px-2 py-1 text-[11px] ${theme.editBtn}`}
                        >
                          Edit
                        </button>
                      </td>
                    )}
                    {columns.map((col) => {
                      const baseWidth =
                        col.minWidth ??
                        (typeof col.header === "string" && col.header.length > 14
                          ? 160
                          : 120);
                      const accessorKey = col.accessorKey;
                      const timeSeconds =
                        accessorKey === "duration" || accessorKey === "LoggedInTime"
                          ? durationToSeconds(row[accessorKey])
                          : NaN;
                      const timeShouldHighlight =
                        (accessorKey === "duration" || accessorKey === "LoggedInTime") &&
                        Number.isFinite(timeSeconds) &&
                        (timeSeconds < 8 * 3600 || timeSeconds > 10 * 3600);
                      return (
                        <td
                          key={col.accessorKey}
                          className={`px-3 py-2 text-[11px] whitespace-nowrap ${theme.td}`}
                          style={{
                            minWidth: baseWidth,
                            maxWidth: col.maxWidth,
                          }}
                        >
                          {accessorKey === "duration" || accessorKey === "LoggedInTime" ? (
                            <span
                              className={`inline-flex items-center rounded px-1.5 py-0.5 ${
                                timeShouldHighlight
                                  ? isDark
                                    ? "bg-pink-500/15 text-slate-100"
                                    : "bg-pink-200/60 text-pink-900"
                                  : ""
                              }`}
                            >
                              {row[accessorKey]}
                            </span>
                          ) : accessorKey === "notes" ? (
                            (() => {
                              const raw = row[col.accessorKey];
                              const text = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
                              const hasNotes = text.trim().length > 0;
                              if (!hasNotes) return "";
                              return (
                                <button
                                  type="button"
                                  onClick={() => openNotesView(text)}
                                  className={`rounded-lg p-1 ${isDark ? "text-slate-300 hover:bg-slate-800 hover:text-slate-100" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"}`}
                                  aria-label="View notes"
                                  title="View notes"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                              );
                            })()
                          ) : (
                            row[accessorKey]
                          )}
                        </td>
                      );
                    })}
                    {editable && !editColumnFirst && (
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => onEditRow?.(row)}
                          className={`rounded-lg border px-2 py-1 text-[11px] ${theme.editBtn}`}
                        >
                          Edit / Comment
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!hidePagination && (
          <div className={`flex items-center gap-4 border-t px-3 py-2 text-[11px] ${theme.paginationBar}`}>
            <span className="font-medium">
              Page {currentPage} of {totalPages} • {filteredRows.length} rows
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${theme.prevNext}`}
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${theme.prevNext}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {notesViewOpen && (
        <>
          <div
            className="fixed inset-0 z-[10000] bg-slate-950"
            aria-hidden
            onClick={() => setNotesViewOpen(false)}
          />
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              className={`relative w-full max-w-lg rounded-xl border px-4 py-3 shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900 text-slate-100"
                  : "border-slate-300 bg-white text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <h3 className="text-sm font-semibold">Notes</h3>
                <button
                  type="button"
                  onClick={() => setNotesViewOpen(false)}
                  className={`rounded-lg p-1 ${isDark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                  aria-label="Close notes popup"
                >
                  ×
                </button>
              </div>
              <div className="mt-3 max-h-[60vh] overflow-auto whitespace-pre-wrap text-xs">
                {notesViewText}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

