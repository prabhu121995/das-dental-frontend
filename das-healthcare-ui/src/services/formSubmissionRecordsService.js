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
 * Fetch form submission data (POST body: start_date, end_date, page, page_size).
 * Response: { status, message, total_rows, data: FormSubmissionRecord[] }
 */
export async function getSubmissionData({
  start_date,
  end_date,
  page = 1,
  page_size = 100,
}) {
  const url = `${API_BASE_URL}/get-submission-data`;
  const res = await axios.post(
    url,
    { start_date, end_date, page, page_size },
    { headers: getAuthHeaders() },
  );
  return res.data;
}

/**
 * Upload Form Submissions Excel (sheet: Form Submissions - Success Center).
 * POST multipart/form-data to upload-excel-form-submissions/ with file and shiftdate.
 * Response: { status, message, data: { total, inserted, failed } }
 */
export async function uploadFormSubmissionExcel(file, shiftdate) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("No auth token");
  const url = `${API_BASE_URL}/upload-excel-form-submissions/`;
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("shiftdate", shiftdate);
  const res = await axios.post(url, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return res.data;
}
