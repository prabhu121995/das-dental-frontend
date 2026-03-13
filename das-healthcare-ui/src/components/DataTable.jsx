import { useMemo, useState } from "react";

export default function DataTable({
  title,
  description,
  columns,
  rows,
  editable = false,
  onEditRow,
  className = "",
  tableScrollClassName = "max-h-[60vh]",
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(columns[0]?.accessorKey ?? "");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

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
      data = [...data].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (av === bv) return 0;
        return av > bv ? 1 : -1;
      });
      if (sortDir === "desc") data.reverse();
    }

    return data;
  }, [rows, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const handleHeaderClick = (accessorKey) => {
    if (sortKey === accessorKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(accessorKey);
      setSortDir("asc");
    }
  };

  return (
    <div className={`space-y-4 w-full ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">{title}</h2>
          {description && (
            <p className="text-xs text-slate-400">{description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-1 rounded-lg bg-slate-900/80 px-2 py-1 text-slate-300">
            <span>Search</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Type to filter"
              className="h-6 rounded bg-transparent px-1 text-[11px] outline-none"
            />
          </label>
          <label className="flex items-center gap-1 rounded-lg bg-slate-900/80 px-2 py-1 text-slate-300">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-6 rounded bg-transparent text-[11px] outline-none"
            >
              {[25, 50, 100, 200].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950">
        <div className={`${tableScrollClassName} overflow-auto`}>
          <table className="min-w-max divide-y divide-slate-800 text-xs">
            <thead className="sticky top-0 z-10 bg-slate-900/95">
              <tr>
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
                      className="cursor-pointer px-3 py-2 text-left font-semibold text-slate-300 whitespace-nowrap"
                      style={{
                        minWidth: baseWidth,
                        maxWidth: col.maxWidth,
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>{col.header}</span>
                        {isSorted && (
                          <span className="text-[9px] text-slate-400">
                            {sortDir === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                {editable && (
                  <th className="px-3 py-2 text-left font-semibold text-slate-300">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/80">
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (editable ? 1 : 0)}
                    className="px-3 py-8 text-center text-xs text-slate-500"
                  >
                    No records to display.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id ?? JSON.stringify(row)}>
                    {columns.map((col) => {
                      const baseWidth =
                        col.minWidth ??
                        (typeof col.header === "string" && col.header.length > 14
                          ? 160
                          : 120);
                      return (
                        <td
                          key={col.accessorKey}
                          className="px-3 py-2 text-[11px] text-slate-200 whitespace-nowrap"
                          style={{
                            minWidth: baseWidth,
                            maxWidth: col.maxWidth,
                          }}
                        >
                          {row[col.accessorKey]}
                        </td>
                      );
                    })}
                    {editable && (
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => onEditRow?.(row)}
                          className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-medical hover:text-medical"
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

        <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-900 px-3 py-2 text-[11px] text-slate-300">
          <div>
            Page {currentPage} of {totalPages} • {filteredRows.length} rows
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-700 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-700 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

