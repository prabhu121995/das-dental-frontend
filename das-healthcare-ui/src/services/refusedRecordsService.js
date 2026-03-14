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
 * Fetch refused data (POST body: start_date, end_date, page, page_size).
 * Response: { status, message, total_rows, data: RefusedRecord[] }
 * RefusedRecord includes: Id, StartTime, EndTime, Agent, AgentId, Accepted, Rejected, Presented,
 * AcceptedPercent, RejectedPercent, AverageHandlingTime, AverageWrapUpTime, AverageBusyTime,
 * CreatedDate, agent_name
 */
export async function getRefusedData({
  start_date,
  end_date,
  page = 1,
  page_size = 100,
}) {
  const url = `${API_BASE_URL}/get-refused-data`;
  const res = await axios.post(
    url,
    { start_date, end_date, page, page_size },
    { headers: getAuthHeaders() },
  );
  return res.data;
}

/**
 * Upload Refused Data Excel (sheet: Refused Data_).
 * POST multipart/form-data to upload-excel-refused/ with file.
 * Response: { status, message, data: { total, inserted, failed } }
 */
export async function uploadRefusedExcel(file) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("No auth token");
  const url = `${API_BASE_URL}/upload-excel-refused/`;
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
