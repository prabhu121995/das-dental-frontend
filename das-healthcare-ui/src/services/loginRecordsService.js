import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://192.168.1.3:8000")
  .toString()
  .replace(/\/+$/, "");

function getAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new Error("No auth token");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Fetch agent login records (POST body: start_date, end_date, page, page_size).
 * Response: { status, message, total_rows, data: AgentLoginResponse[] }
 */
export async function getAgentLogin({ start_date, end_date, page = 1, page_size = 100 }) {
  const url = `${API_BASE_URL}/get-agent-login`;
  const res = await axios.post(
    url,
    { start_date, end_date, page, page_size },
    { headers: getAuthHeaders() },
  );
  return res.data;
}

/**
 * Update login record. Request: { id, Login_Time, Logout_Time, Duration, Notes, updated_by }.
 * Response: { status, message, data: { message } }
 */
export async function updateLoginTime(body) {
  const url = `${API_BASE_URL}/update-login-time`;
  const res = await axios.put(url, body, { headers: getAuthHeaders() });
  return res.data;
}

/** Current user id for updated_by (e.g. from localStorage or login response). */
export function getCurrentUserId() {
  if (typeof window === "undefined") return 1;
  const id = localStorage.getItem("user_id");
  if (id !== null && id !== "") {
    const n = Number(id);
    if (!Number.isNaN(n)) return n;
  }
  return 1;
}

/**
 * Upload Login Data Excel file. POST multipart/form-data.
 * Response: { status, message, data: { total, inserted, failed } }
 */
export async function uploadLoginExcel(file) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("No auth token");
  const url = `${API_BASE_URL}/upload-excel-loginData/`;
  const formData = new FormData();
  formData.append("file", file, file.name);
  const res = await axios.post(url, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return res.data;
}
