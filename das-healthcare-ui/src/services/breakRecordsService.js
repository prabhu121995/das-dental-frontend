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
 * Fetch break data (POST body: start_date, end_date, page, page_size).
 * Response: { status, message, total_rows, data: BreakRecord[] }
 */
export async function getBreakData({
  start_date,
  end_date,
  page = 1,
  page_size = 100,
}) {
  const url = `${API_BASE_URL}/get-break-data`;
  const res = await axios.post(
    url,
    { start_date, end_date, page, page_size },
    { headers: getAuthHeaders() },
  );
  return res.data;
}

/**
 * Update break record. PUT body: id, StartTime, EndTime, Status, StatusCodeItem,
 * StatusCodeList, TimeValue, TimePercentage, LoggedInTime, Notes, updated_by.
 * Response: { status, message, data: { message } }
 */
export async function updateBreakData(body) {
  const url = `${API_BASE_URL}/update-break-data`;
  const res = await axios.put(url, body, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Upload Daily Break Data Excel file. POST multipart/form-data.
 * Response: { status, message, data: { total, inserted, failed } }
 */
export async function uploadBreakExcel(file) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("No auth token");
  const url = `${API_BASE_URL}/upload-excel-daily-breakData/`;
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
