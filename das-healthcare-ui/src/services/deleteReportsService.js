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
    accept: "application/json",
  };
}

/**
 * Delete reports for a given shift date.
 * @param {{ shiftdate: string, reports: string[] }} body - shiftdate "YYYY-MM-DD", reports e.g. ["login", "break"]
 * @returns {Promise<{ status, message, data: { result: Array<{ report, start_date, end_date, message }> } }>}
 */
export async function deleteReports({ shiftdate, reports }) {
  const url = `${API_BASE_URL}/delete-reports`;
  const res = await axios.delete(url, {
    data: { shiftdate, reports },
    headers: getAuthHeaders(),
  });
  return res.data;
}
