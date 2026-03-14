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
 * Fetch Nextech data (POST body: start_date, end_date, page, page_size).
 * Response: { status, message, total_rows, data: NextechRecord[] }
 */
export async function getNextechData({
  start_date,
  end_date,
  page = 1,
  page_size = 100,
}) {
  const url = `${API_BASE_URL}/get-nextech-data`;
  const res = await axios.post(
    url,
    { start_date, end_date, page, page_size },
    { headers: getAuthHeaders() },
  );
  return res.data;
}

/**
 * Upload Nextech Excel (sheet: nextech).
 * POST multipart/form-data to upload-excel-nextech/ with file.
 * Response: { status, message, data: { total, inserted, failed } }
 */
export async function uploadNextechExcel(file) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("No auth token");
  const url = `${API_BASE_URL}/upload-excel-nextech/`;
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
