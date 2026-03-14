import axios from "axios";

// In dev use /api so Vite proxy forwards to 127.0.0.1:8001 (avoids CORS). Set VITE_API_BASE_URL for production or override.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "/api" : "http://127.0.0.1:8001"))
  .toString()
  .replace(/\/+$/, "");

function getAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new Error("No auth token");
  }
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * GET /teams — fetch all teams.
 * Response: { status, message, total_rows, data: [{ id, name }, ...] }
 */
export async function getTeams() {
  const url = `${API_BASE_URL}/teams`;
  const res = await axios.get(url, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * GET /teams/:id — fetch one team by id.
 * Response: { status, message, total_rows, data: [{ id, name }] }
 */
export async function getTeamById(id) {
  const url = `${API_BASE_URL}/teams/${id}`;
  const res = await axios.get(url, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * POST /teams — create team. Body: { name }.
 * Response: { status, message, total_rows, data: [{ name }] }
 */
export async function createTeam({ name }) {
  const url = `${API_BASE_URL}/teams`;
  const res = await axios.post(url, { name }, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * PUT /teams/:id — update team. Body: { id, name } (some backends require id in body for 422).
 * Response: { status, message, total_rows, data: [{ id, name }] }
 */
export async function updateTeam(id, { name }) {
  const url = `${API_BASE_URL}/teams/${id}`;
  const body = { id: Number(id), name };
  const res = await axios.put(url, body, { headers: getAuthHeaders() });
  return res.data;
}
