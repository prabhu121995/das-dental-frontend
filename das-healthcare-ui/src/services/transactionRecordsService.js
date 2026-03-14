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
 * Fetch transaction data (POST body: start_date, end_date, page, page_size).
 * Response: { status, message, total_rows, data: TransactionRecord[] }
 */
export async function getTransactionData({
  start_date,
  end_date,
  page = 1,
  page_size = 100,
}) {
  const url = `${API_BASE_URL}/get-transaction-data`;
  const res = await axios.post(
    url,
    { start_date, end_date, page, page_size },
    { headers: getAuthHeaders() },
  );
  return res.data;
}

/**
 * Upload Transaction Data Excel file (sheet: Transaction Data_).
 * POST multipart/form-data to upload-excel-transaction_data/
 * Response: { status, message, data: { total, inserted, failed } }
 */
export async function uploadTransactionExcel(file) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("No auth token");
  const url = `${API_BASE_URL}/upload-excel-transaction_data/`;
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
