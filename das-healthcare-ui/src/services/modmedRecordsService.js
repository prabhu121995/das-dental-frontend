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
 * Fetch Modmed data (POST body: start_date, end_date, page, page_size).
 * Response: { status, message, total_rows, data: ModmedRecord[] }
 */
export async function getModmedData({
  start_date,
  end_date,
  page = 1,
  page_size = 100,
}) {
  const url = `${API_BASE_URL}/get-modmed-data`;
  const res = await axios.post(
    url,
    { start_date, end_date, page, page_size },
    { headers: getAuthHeaders() },
  );
  return res.data;
}

/**
 * Upload Modmed Excel files (two files: Modmed - DTRC, Modmed - Florida).
 * POST multipart/form-data to upload-excel-modmed/ with file1 and file2.
 * Response: { status, message, data: { total, inserted, failed } }
 */
export async function uploadModmedExcel(file1, file2) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("No auth token");
  const url = `${API_BASE_URL}/upload-excel-modmed/`;
  const formData = new FormData();
  if (file1) formData.append("file1", file1, file1.name);
  if (file2) formData.append("file2", file2, file2.name);
  const res = await axios.post(url, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return res.data;
}
