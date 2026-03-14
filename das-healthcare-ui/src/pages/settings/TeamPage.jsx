import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Plus, Pencil } from "lucide-react";
import { getTeams, createTeam, updateTeam } from "../../services/teamsService";

export default function TeamPage() {
  const { isDark = false } = useOutletContext();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState("");
  /** Popup after create: show created team name */
  const [successPopup, setSuccessPopup] = useState(null);

  const theme = {
    bar: isDark ? "border-slate-800/80 bg-slate-950/80" : "border-slate-200 bg-white/95",
    text: isDark ? "text-slate-100" : "text-slate-800",
    muted: isDark ? "text-slate-400" : "text-slate-600",
    input: isDark ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-300 bg-white text-slate-900",
    label: isDark ? "text-slate-400" : "text-slate-600",
    row: isDark ? "border-slate-800/80 hover:bg-slate-900/60" : "border-slate-200 hover:bg-slate-50",
  };

  const fetchTeams = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getTeams();
      const list = Array.isArray(res?.data) ? res.data : [];
      setTeams(list);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
        navigate("/", { replace: true });
        return;
      }
      setError(err.response?.data?.message ?? err.message ?? "Failed to load teams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const openCreate = () => {
    setFormName("");
    setFormError("");
    setCreateModalOpen(true);
  };

  const openEdit = (team) => {
    const id = team.id != null ? Number(team.id) : team.id;
    if (id == null || id === "") {
      setFormError("Cannot edit: missing team id.");
      return;
    }
    setEditingId(id);
    setFormName(team.name ?? "");
    setFormError("");
    setEditModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = (formName ?? "").trim();
    if (!name) {
      setFormError("Name is required.");
      return;
    }
    setFormError("");
    setSubmitLoading(true);
    try {
      const res = await createTeam({ name });
      const createdName = Array.isArray(res?.data) && res.data.length > 0
        ? (res.data[0].name ?? name)
        : name;
      setCreateModalOpen(false);
      setSuccessPopup({ type: "create", name: createdName });
      await fetchTeams();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
        navigate("/", { replace: true });
        return;
      }
      setFormError(err.response?.data?.message ?? err.message ?? "Failed to create team.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const name = (formName ?? "").trim();
    if (!name) {
      setFormError("Name is required.");
      return;
    }
    if (editingId == null) return;
    setFormError("");
    setSubmitLoading(true);
    try {
      await updateTeam(editingId, { name });
      setEditModalOpen(false);
      setEditingId(null);
      await fetchTeams();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
        navigate("/", { replace: true });
        return;
      }
      setFormError(err.response?.data?.message ?? err.message ?? "Failed to update team.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className={`flex items-center justify-between rounded-2xl border px-4 py-2 ${theme.bar}`}>
        <h1 className={`text-sm font-semibold ${theme.text}`}>Settings — Team</h1>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg border border-medical/60 bg-medical/10 px-3 py-1.5 text-xs font-medium text-medical hover:bg-medical/20"
        >
          <Plus className="h-4 w-4" />
          Add team
        </button>
      </div>

      <div className={`flex-1 min-h-0 flex flex-col rounded-2xl border px-4 py-4 ${theme.bar}`}>
        {error && (
          <p className="rounded-lg border border-red-900/80 bg-red-950/50 px-3 py-2 text-xs text-red-300 mb-3">
            {error}
          </p>
        )}
        {loading ? (
          <p className={`text-xs ${theme.muted}`}>Loading teams…</p>
        ) : teams.length === 0 ? (
          <p className={`text-xs ${theme.muted}`}>No teams yet. Add one to get started.</p>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className={isDark ? "text-slate-400" : "text-slate-600"}>
                <tr>
                  <th className="pb-2 pr-4 font-medium w-16">Id</th>
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 w-20 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className={theme.text}>
                {teams.map((t) => (
                  <tr key={t.id} className={`border-b ${theme.row}`}>
                    <td className="py-2 pr-4 font-mono text-xs">{t.id ?? "—"}</td>
                    <td className="py-2 pr-4">{t.name ?? "—"}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium text-slate-500 hover:border-medical hover:text-medical"
                        aria-label={`Edit ${t.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-team-title"
        >
          <div className={`relative max-w-sm w-full rounded-xl border px-5 py-4 shadow-xl ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <h2 id="create-team-title" className={`text-sm font-semibold ${theme.text}`}>
              Create team
            </h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div>
                <label htmlFor="create-team-name" className={`mb-1 block text-[11px] font-medium ${theme.label}`}>
                  Name
                </label>
                <input
                  id="create-team-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-medical/40 ${theme.input}`}
                  placeholder="Team name"
                  autoFocus
                />
              </div>
              {formError && (
                <p className="text-xs text-red-400">{formError}</p>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setCreateModalOpen(false); setFormError(""); }}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium ${theme.muted}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-lg border border-medical/60 bg-medical/20 px-3 py-2 text-xs font-medium text-medical hover:bg-medical/30 disabled:opacity-50"
                >
                  {submitLoading ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-team-title"
        >
          <div className={`relative max-w-sm w-full rounded-xl border px-5 py-4 shadow-xl ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <h2 id="edit-team-title" className={`text-sm font-semibold ${theme.text}`}>
              Edit team
            </h2>
            <p className={`mt-1 text-[11px] ${theme.muted}`}>Where id = {editingId}</p>
            <form onSubmit={handleUpdate} className="mt-4 space-y-3">
              <div>
                <label htmlFor="edit-team-name" className={`mb-1 block text-[11px] font-medium ${theme.label}`}>
                  Name
                </label>
                <input
                  id="edit-team-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-medical/40 ${theme.input}`}
                  placeholder="Team name"
                  autoFocus
                />
              </div>
              {formError && (
                <p className="text-xs text-red-400">{formError}</p>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setEditingId(null); setFormError(""); }}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium ${theme.muted}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-lg border border-medical/60 bg-medical/20 px-3 py-2 text-xs font-medium text-medical hover:bg-medical/30 disabled:opacity-50"
                >
                  {submitLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success popup after create — show the created name */}
      {successPopup && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-popup-title"
        >
          <div className="relative max-w-sm w-full rounded-xl border border-green-500/50 px-5 py-4 shadow-xl bg-slate-900">
            <p id="success-popup-title" className="text-sm font-medium text-green-200">
              Team created successfully
            </p>
            <p className="mt-2 text-xs text-slate-300">
              <span className="font-medium text-slate-100">{successPopup.name}</span>
            </p>
            <button
              type="button"
              onClick={() => setSuccessPopup(null)}
              className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
