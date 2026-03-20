import { useState, useRef, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import {
  getAgentLogin,
  updateLoginTime,
  getCurrentUserId,
  uploadLoginExcel,
} from "../services/loginRecordsService";
import { getBreakData, uploadBreakExcel, updateBreakData } from "../services/breakRecordsService";
import {
  getTimeOnStatus,
  updateTimeOnStatus,
  uploadTimeOnStatusExcel,
} from "../services/timeOnStatusService";
import {
  getTransactionData,
  uploadTransactionExcel,
} from "../services/transactionRecordsService";
import { getModmedData, uploadModmedExcel } from "../services/modmedRecordsService";
import {
  getSubmissionData,
  uploadFormSubmissionExcel,
} from "../services/formSubmissionRecordsService";
import { getNextechData, uploadNextechExcel } from "../services/nextechRecordsService";
import { getRefusedData, uploadRefusedExcel } from "../services/refusedRecordsService";

const pad2 = (n) => String(n).padStart(2, "0");
const TODAY = new Date();

const CalendarIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const EyeIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/** Row dropdown options for tables with 5k–50k+ rows; 0 = "All" */
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

/** API datetime (ISO or "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD") → datetime-local value "YYYY-MM-DDTHH:mm" */
function toDateTimeLocal(val) {
  if (!val) return "";
  const s = String(val).trim().replace(" ", "T");
  const datePart = s.slice(0, 10);
  if (datePart.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return s.slice(0, 16);
  const timePart = s.slice(11, 16);
  return timePart.length >= 5 ? `${datePart}T${timePart}` : `${datePart}T00:00`;
}

/** datetime string → date-only "YYYY-MM-DD" (for <input type="date" />) */
function toDateInput(val) {
  const dt = toDateTimeLocal(val);
  return dt ? dt.slice(0, 10) : "";
}

/**
 * Compute duration "HH:MM:SS" from login and logout datetime strings
 * (datetime-local "YYYY-MM-DDTHH:mm" or ISO). Returns "00:00:00" if invalid.
 */
function computeDuration(loginVal, logoutVal) {
  if (!loginVal || !logoutVal) return "";
  const login = new Date(loginVal.replace(" ", "T").slice(0, 16));
  const logout = new Date(logoutVal.replace(" ", "T").slice(0, 16));
  if (Number.isNaN(login.getTime()) || Number.isNaN(logout.getTime())) return "";
  let sec = Math.round((logout - login) / 1000);
  if (sec < 0) return "00:00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

/**
 * Any datetime string (datetime-local "YYYY-MM-DDTHH:mm", ISO, or "YYYY-MM-DD HH:mm:ss")
 * → "MM-dd-yyyy HH:mm:ss" for display (no timezone conversion).
 */
function toMMDDYYYYHHMMSS(val) {
  if (!val) return "";
  const s = String(val).trim().replace("T", " ");
  const [datePart, timePart] = s.split(" ");
  if (!datePart) return "";
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return "";
  const hour = timePart ? String(timePart.slice(0, 2)).padStart(2, "0") : "00";
  const min = timePart && timePart.length >= 5 ? String(timePart.slice(3, 5)).padStart(2, "0") : "00";
  const sec = timePart && timePart.length >= 8 ? String(timePart.slice(6, 8)).padStart(2, "0") : "00";
  return `${m}-${d}-${y} ${hour}:${min}:${sec}`;
}

/**
 * datetime-local / ISO → "YYYY-MM-DD HH:mm:ss" for update-login-time API (matches curl).
 */
function toYYYYMMDDHHMMSS(val) {
  if (!val) return "";
  const s = String(val).trim().replace("T", " ");
  const [datePart, timePart] = s.split(" ");
  if (!datePart) return "";
  const hour = timePart ? String(timePart.slice(0, 2)).padStart(2, "0") : "00";
  const min = timePart && timePart.length >= 5 ? String(timePart.slice(3, 5)).padStart(2, "0") : "00";
  const sec = timePart && timePart.length >= 8 ? String(timePart.slice(6, 8)).padStart(2, "0") : "00";
  return `${datePart} ${hour}:${min}:${sec}`;
}

/** "MM-dd-yyyy HH:mm:ss" or "MM-dd-yyyy" → "YYYY-MM-DD HH:mm:ss" for API */
function fromMMDDYYYYHHMMSS(val) {
  if (!val) return "";
  const s = String(val).trim();
  const [datePart, timePart] = s.split(" ");
  if (!datePart) return "";
  const parts = datePart.split("-");
  if (parts.length !== 3) return "";
  const [m, d, y] = parts;
  const hour = timePart ? String(timePart.slice(0, 2)).padStart(2, "0") : "00";
  const min = timePart && timePart.length >= 5 ? String(timePart.slice(3, 5)).padStart(2, "0") : "00";
  const sec = timePart && timePart.length >= 8 ? String(timePart.slice(6, 8)).padStart(2, "0") : "00";
  return `${y}-${m}-${d} ${hour}:${min}:${sec}`;
}
const DEFAULT_DATE_INPUT = `${TODAY.getFullYear()}-${pad2(
  TODAY.getMonth() + 1,
)}-${pad2(TODAY.getDate())}`;
const DEFAULT_DATE_LABEL = `${pad2(TODAY.getMonth() + 1)}-${pad2(
  TODAY.getDate(),
)}-${TODAY.getFullYear()}`;

function apiKeyToHeader(apiKey) {
  if (apiKey === "day_abbr") return "Day";
  if (apiKey === "week_number") return "Week";
  if (apiKey === "month_abbr") return "Month";
  return apiKey;
}

function buildColumnsFromApiRows(apiRows, fallbackColumns = []) {
  const firstRow = Array.isArray(apiRows) ? apiRows[0] : null;
  if (!firstRow || typeof firstRow !== "object") return fallbackColumns;

  // Preserves the API object's key insertion order.
  return Object.keys(firstRow).map((apiKey) => {
    const col = { header: apiKeyToHeader(apiKey), accessorKey: apiKey };

    if (apiKey === "day_abbr") col.sortType = "weekday";
    if (apiKey === "week_number") col.sortType = "week";
    if (apiKey === "month_abbr") col.sortType = "month";

    return col;
  });
}

const COLUMNS_BY_TYPE = {
  login: [
    { header: "id", accessorKey: "id", sortType: "number" },
    { header: "agent", accessorKey: "agent" },
    { header: "agent id", accessorKey: "agent_id", sortType: "number" },
    { header: "login time", accessorKey: "login_time", sortType: "datetime" },
    { header: "logout time", accessorKey: "logout_time", sortType: "datetime" },
    { header: "duration", accessorKey: "duration", sortType: "duration" },
    { header: "shiftdate", accessorKey: "shiftdate", sortType: "date" },
    { header: "agent_name", accessorKey: "agentname" },
    { header: "notes", accessorKey: "notes" },
    { header: "Team", accessorKey: "Team" },
    { header: "Group", accessorKey: "Group" },
    { header: "Day", accessorKey: "day_abbr", sortType: "weekday" },
    { header: "Week", accessorKey: "week_number", sortType: "week" },
    { header: "Month", accessorKey: "month_abbr", sortType: "month" },
    { header: "createdAt", accessorKey: "CreatedAt", sortType: "date" },
    { header: "Createdby", accessorKey: "Createdby" },
    { header: "updated_at", accessorKey: "updated_at", sortType: "datetime" },
    { header: "updatedby", accessorKey: "updatedby", sortType: "number" },
  ],
  break: [
    // Column order matches the /get-break-data response
    { header: "Id", accessorKey: "Id", sortType: "number" },
    { header: "StartTime", accessorKey: "StartTime", sortType: "date" },
    { header: "EndTime", accessorKey: "EndTime", sortType: "date" },
    { header: "Agent", accessorKey: "Agent" },
    { header: "agentname", accessorKey: "agentname" },
    { header: "AgentId", accessorKey: "AgentId" },
    { header: "Status", accessorKey: "Status" },
    { header: "StatusCodeItem", accessorKey: "StatusCodeItem" },
    { header: "StatusCodeList", accessorKey: "StatusCodeList" },
    { header: "GroupName", accessorKey: "GroupName" },
    { header: "TimeValue", accessorKey: "TimeValue", sortType: "duration" },
    { header: "TimePercentage", accessorKey: "TimePercentage", sortType: "number" },
    { header: "LoggedInTime", accessorKey: "LoggedInTime", sortType: "duration" },
    { header: "notes", accessorKey: "notes" },
    { header: "Team", accessorKey: "Team" },
    { header: "Group", accessorKey: "Group" },
    { header: "Day", accessorKey: "day_abbr", sortType: "weekday" },
    { header: "Week", accessorKey: "week_number", sortType: "week" },
    { header: "Month", accessorKey: "month_abbr", sortType: "month" },
    { header: "CreatedAt", accessorKey: "CreatedAt", sortType: "date" },
    { header: "Createdby", accessorKey: "Createdby" },
    { header: "updatedby", accessorKey: "updatedby" },
    { header: "updated_at", accessorKey: "updated_at", sortType: "datetime" },
  ],
  "time-on-status": [
    { header: "Id", accessorKey: "Id" },
    { header: "StartTime", accessorKey: "StartTime" },
    { header: "EndTime", accessorKey: "EndTime" },
    { header: "Agent", accessorKey: "Agent" },
    { header: "agentname", accessorKey: "agentname" },
    { header: "AgentId", accessorKey: "AgentId" },
    { header: "AvailableTime", accessorKey: "AvailableTime" },
    { header: "AvailableTimePercent", accessorKey: "AvailableTimePercent" },
    { header: "HandlingTime", accessorKey: "HandlingTime" },
    { header: "HandlingTimePercent", accessorKey: "HandlingTimePercent" },
    { header: "WrapUpTime", accessorKey: "WrapUpTime" },
    { header: "WrapUpTimePercent", accessorKey: "WrapUpTimePercent" },
    { header: "WorkingOfflineTime", accessorKey: "WorkingOfflineTime" },
    {
      header: "WorkingOfflineTimePercent",
      accessorKey: "WorkingOfflineTimePercent",
    },
    { header: "OfferingTime", accessorKey: "OfferingTime" },
    { header: "OfferingTimePercent", accessorKey: "OfferingTimePercent" },
    { header: "OnBreakTime", accessorKey: "OnBreakTime" },
    { header: "OnBreakTimePercent", accessorKey: "OnBreakTimePercent" },
    { header: "BusyTime", accessorKey: "BusyTime" },
    { header: "BusyTimePercent", accessorKey: "BusyTimePercent" },
    { header: "LoggedInTime", accessorKey: "LoggedInTime" },
    { header: "notes", accessorKey: "notes" },
    { header: "Team", accessorKey: "Team" },
    { header: "Group", accessorKey: "Group" },
    { header: "Day", accessorKey: "day_abbr", sortType: "weekday" },
    { header: "Week", accessorKey: "week_number", sortType: "week" },
    { header: "Month", accessorKey: "month_abbr", sortType: "month" },
    { header: "CreatedDate", accessorKey: "CreatedDate" },
    { header: "Createdby", accessorKey: "Createdby" },
    { header: "updated_at", accessorKey: "updated_at" },
    { header: "updatedby", accessorKey: "updatedby" },
  ],
  transaction: [
    { header: "Id", accessorKey: "Id" },
    { header: "TimeFinished", accessorKey: "TimeFinished" },
    { header: "TransactionID", accessorKey: "TransactionID" },
    { header: "OriginalTransactionID", accessorKey: "OriginalTransactionID" },
    { header: "MediaType", accessorKey: "MediaType" },
    { header: "CreationTime", accessorKey: "CreationTime" },
    { header: "Direction", accessorKey: "Direction" },
    { header: "Type", accessorKey: "Type" },
    { header: "ChannelID", accessorKey: "ChannelID" },
    { header: "QueueName", accessorKey: "QueueName" },
    { header: "Origination", accessorKey: "Origination" },
    { header: "Destination", accessorKey: "Destination" },
    { header: "CustomerName", accessorKey: "CustomerName" },
    { header: "CaseNumber", accessorKey: "CaseNumber" },
    { header: "OutboundPhoneShortCode", accessorKey: "OutboundPhoneShortCode" },
    { header: "OutboundPhoneCodeText", accessorKey: "OutboundPhoneCodeText" },
    { header: "Participant", accessorKey: "Participant" },
    { header: "OfferActionTime", accessorKey: "OfferActionTime" },
    { header: "HandlingDuration", accessorKey: "HandlingDuration" },
    { header: "WrapUpDuration", accessorKey: "WrapUpDuration" },
    { header: "ProcessingDuration", accessorKey: "ProcessingDuration" },
    { header: "TimetoAbandon", accessorKey: "TimetoAbandon" },
    { header: "RecordingFilenames", accessorKey: "RecordingFilenames" },
    { header: "IVRTreatmentDuration", accessorKey: "IVRTreatmentDuration" },
    { header: "Hold", accessorKey: "Hold" },
    { header: "HoldDuration", accessorKey: "HoldDuration" },
    { header: "WrapUpCodeListID", accessorKey: "WrapUpCodeListID" },
    { header: "WrapUpCodeText", accessorKey: "WrapUpCodeText" },
    { header: "CreatedDate", accessorKey: "CreatedDate" },
    { header: "agent_name", accessorKey: "agent_name" },
  ],
  "form-submission": [
    { header: "Id", accessorKey: "Id" },
    { header: "rec_id", accessorKey: "rec_id" },
    { header: "Date", accessorKey: "Date" },
    { header: "Location", accessorKey: "Location" },
    { header: "Form", accessorKey: "Form" },
    { header: "SourceURL", accessorKey: "SourceURL" },
    { header: "Status", accessorKey: "Status" },
    { header: "Reason", accessorKey: "Reason" },
    { header: "FirstTouchDate", accessorKey: "FirstTouchDate" },
    { header: "FirstTouchUser", accessorKey: "FirstTouchUser" },
    { header: "TimetoFirstTouchmins", accessorKey: "TimetoFirstTouchmins" },
    { header: "LastTouchDate", accessorKey: "LastTouchDate" },
    { header: "LastTouchUser", accessorKey: "LastTouchUser" },
    { header: "CreatedDate", accessorKey: "CreatedDate" },
    { header: "agent_name", accessorKey: "agent_name" },
  ],
  modmed: [
    { header: "Id", accessorKey: "Id" },
    { header: "PatientName", accessorKey: "PatientName" },
    { header: "PatientDOB", accessorKey: "PatientDOB" },
    { header: "PatientPreferredPhone", accessorKey: "PatientPreferredPhone" },
    { header: "AppointmentCreatedDate", accessorKey: "AppointmentCreatedDate" },
    { header: "AppointmentCreatedBy", accessorKey: "AppointmentCreatedBy" },
    { header: "Location", accessorKey: "Location" },
    { header: "AppointmentType", accessorKey: "AppointmentType" },
    { header: "AppointmentDate", accessorKey: "AppointmentDate" },
    { header: "AppointmentTime", accessorKey: "AppointmentTime" },
    { header: "AppointmentStatus", accessorKey: "AppointmentStatus" },
    { header: "AppointmentRescheduled", accessorKey: "AppointmentRescheduled" },
    { header: "AppointmentCount", accessorKey: "AppointmentCount" },
    { header: "PrimaryProvider", accessorKey: "PrimaryProvider" },
    { header: "CreatedDate", accessorKey: "CreatedDate" },
    { header: "agent_name", accessorKey: "agent_name" },
  ],
  nextech: [
    { header: "Id", accessorKey: "Id" },
    { header: "InputDate", accessorKey: "InputDate" },
    { header: "CreatedbyLogin", accessorKey: "CreatedbyLogin" },
    { header: "PatientName", accessorKey: "PatientName" },
    { header: "ApptDate", accessorKey: "ApptDate" },
    { header: "StartTime", accessorKey: "StartTime" },
    { header: "Purpose", accessorKey: "Purpose" },
    { header: "WebSite", accessorKey: "WebSite" },
    { header: "Location", accessorKey: "Location" },
    { header: "user_name", accessorKey: "user_name" },
    { header: "CreatedDate", accessorKey: "CreatedDate" },
    { header: "agent_name", accessorKey: "agent_name" },
  ],
  refused: [
    { header: "Id", accessorKey: "Id" },
    { header: "StartTime", accessorKey: "StartTime" },
    { header: "EndTime", accessorKey: "EndTime" },
    { header: "Agent", accessorKey: "Agent" },
    { header: "AgentId", accessorKey: "AgentId" },
    { header: "Accepted", accessorKey: "Accepted" },
    { header: "Rejected", accessorKey: "Rejected" },
    { header: "Presented", accessorKey: "Presented" },
    { header: "AcceptedPercent", accessorKey: "AcceptedPercent" },
    { header: "RejectedPercent", accessorKey: "RejectedPercent" },
    { header: "AverageHandlingTime", accessorKey: "AverageHandlingTime" },
    { header: "AverageWrapUpTime", accessorKey: "AverageWrapUpTime" },
    { header: "AverageBusyTime", accessorKey: "AverageBusyTime" },
    { header: "CreatedDate", accessorKey: "CreatedDate" },
    { header: "agent_name", accessorKey: "agent_name" },
  ],
  delete: [
    { header: "report_name", accessorKey: "report_name" },
    { header: "start_date", accessorKey: "start_date" },
    { header: "end_date", accessorKey: "end_date" },
    { header: "status", accessorKey: "status" },
  ],
};

const CONFIG = {
  login: {
    title: "Login activity",
    editable: true,
  },
  break: {
    title: "Break logs",
    editable: true,
  },
  "time-on-status": {
    title: "Time on status",
    editable: true,
  },
  transaction: {
    title: "Transactions",
    editable: false,
  },
  "form-submission": {
    title: "Form submissions",
    editable: false,
  },
  modmed: {
    title: "ModMed",
    editable: false,
  },
  nextech: {
    title: "Nextech",
    editable: false,
  },
  refused: {
    title: "Refused",
    editable: false,
  },
  delete: {
    title: "Delete reports",
    editable: false,
  },
};

export default function RecordsPage({ type }) {
  const { activeMenu, isDark = false } = useOutletContext();
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState(DEFAULT_DATE_INPUT);
  const [dateTo, setDateTo] = useState(DEFAULT_DATE_INPUT);
  const [fileName, setFileName] = useState("");
  const [loginRows, setLoginRows] = useState([]);
  const [, setLoginTotalRows] = useState(null);
  const [breakRows, setBreakRows] = useState([]);
  const [, setBreakTotalRows] = useState(null);
  const [timeOnStatusRows, setTimeOnStatusRows] = useState([]);
  const [, setTimeOnStatusTotalRows] = useState(null);
  const [transactionRows, setTransactionRows] = useState([]);
  const [transactionTotalRows, setTransactionTotalRows] = useState(null);
  const [modmedRows, setModmedRows] = useState([]);
  const [modmedTotalRows, setModmedTotalRows] = useState(null);
  const [formSubmissionRows, setFormSubmissionRows] = useState([]);
  const [formSubmissionTotalRows, setFormSubmissionTotalRows] = useState(null);
  const [nextechRows, setNextechRows] = useState([]);
  const [nextechTotalRows, setNextechTotalRows] = useState(null);
  const [refusedRows, setRefusedRows] = useState([]);
  const [refusedTotalRows, setRefusedTotalRows] = useState(null);
  const [shiftDateForUpload, setShiftDateForUpload] = useState(DEFAULT_DATE_INPUT);
  const [loading, setLoading] = useState(false);
  const [filterError, setFilterError] = useState("");
  const [editRow, setEditRow] = useState(null);
  const [editDraft, setEditDraft] = useState({
    Login_Time: "",
    Logout_Time: "",
    Duration: "",
    Notes: "",
    StartTime: "",
    EndTime: "",
    Status: "",
    StatusCodeItem: "",
    StatusCodeList: "",
    TimeValue: "",
    TimePercentage: "",
    LoggedInTime: "",
    AvailableTime: "",
    AvailableTimePercent: "",
    HandlingTime: "",
    HandlingTimePercent: "",
    WrapUpTime: "",
    WrapUpTimePercent: "",
    WorkingOfflineTime: "",
    WorkingOfflineTimePercent: "",
    OfferingTime: "",
    OfferingTimePercent: "",
    OnBreakTime: "",
    OnBreakTimePercent: "",
    BusyTime: "",
    BusyTimePercent: "",
  });
  const [savingNote, setSavingNote] = useState(false);
  const [notesViewOpen, setNotesViewOpen] = useState(false);
  const [notesViewText, setNotesViewText] = useState("");
  const loginDateInputRef = useRef(null);
  const logoutDateInputRef = useRef(null);
  const breakStartDateInputRef = useRef(null);
  const breakEndDateInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(50);
  const [tablePagination, setTablePagination] = useState({
    totalPages: 1,
    currentPage: 1,
    totalRows: 0,
  });
  const hasAppliedTransaction = useRef(false);
  const hasAppliedModmed = useRef(false);
  const hasAppliedFormSubmission = useRef(false);
  const hasAppliedNextech = useRef(false);
  const hasAppliedRefused = useRef(false);
  // Prevents double-fetching after user clicks "Apply" for server-paginated tables,
  // while still allowing the next rows/page changes to refetch normally.
  // Keyed by the selected table params used by the manual "Apply" request.
  const manualFetchParamsRef = useRef({
    transaction: null,
    modmed: null,
    "form-submission": null,
    nextech: null,
    refused: null,
  });

  const cfg = CONFIG[type] ?? { title: activeMenu.label, editable: false };

  const rows =
    type === "login"
      ? loginRows
      : type === "break"
        ? breakRows
        : type === "time-on-status"
          ? timeOnStatusRows
          : type === "transaction"
            ? transactionRows
            : type === "modmed"
              ? modmedRows
              : type === "form-submission"
                ? formSubmissionRows
                : type === "nextech"
                  ? nextechRows
                  : type === "refused"
                    ? refusedRows
                    : [];

  const baseColumns =
    COLUMNS_BY_TYPE[type] ?? [
      { header: "Date", accessorKey: "date" },
      { header: "User", accessorKey: "user" },
      { header: "Status", accessorKey: "status" },
      { header: "Comments", accessorKey: "comments" },
    ];

  // For these report types, the backend adds computed fields like day/week/month.
  // Build columns from the API row keys so we keep *all* columns and preserve API order.
  const columns =
    type === "time-on-status" || type === "transaction"
      ? buildColumnsFromApiRows(rows, baseColumns)
      : baseColumns;

  const isServerPaginated = type === "transaction" || type === "modmed" || type === "form-submission" || type === "nextech" || type === "refused";
  const serverTotal =
    type === "transaction"
      ? transactionTotalRows
      : type === "modmed"
        ? modmedTotalRows
        : type === "form-submission"
          ? formSubmissionTotalRows
          : type === "nextech"
            ? nextechTotalRows
            : type === "refused"
              ? refusedTotalRows
              : null;
  const effectiveSize = tablePageSize === 0 && serverTotal != null ? serverTotal : tablePageSize;
  const serverTotalPages =
    serverTotal != null
      ? (effectiveSize ? Math.max(1, Math.ceil(serverTotal / effectiveSize)) : 1)
      : null;
  const displayPage =
    isServerPaginated && serverTotal != null
      ? (tablePageSize === 0 ? 1 : Math.max(1, tablePage))
      : (Number.isFinite(tablePagination.currentPage) ? Math.max(1, tablePagination.currentPage) : 1);
  const displayTotalPages =
    isServerPaginated && serverTotal != null
      ? (Number.isFinite(serverTotalPages) ? (serverTotalPages ?? 1) : 1)
      : (Number.isFinite(tablePagination.totalPages) ? Math.max(1, tablePagination.totalPages) : 1);
  const displayTotalRows =
    isServerPaginated && serverTotal != null ? Number(serverTotal) : tablePagination.totalRows;
  const paginationLabel =
    `Page ${displayPage} of ${displayTotalPages} • ${Number.isFinite(displayTotalRows) ? Number(displayTotalRows).toLocaleString() : 0} rows`;
  const safeTotalPages = isServerPaginated && serverTotal != null
    ? (serverTotalPages ?? 1)
    : (Number.isFinite(tablePagination.totalPages) ? Math.max(1, tablePagination.totalPages) : 1);
  const prevDisabled =
    isServerPaginated && serverTotal != null ? tablePage <= 1 : displayPage <= 1;
  const nextDisabled =
    isServerPaginated && serverTotal != null
      ? tablePage >= (serverTotalPages ?? 1)
      : displayPage >= safeTotalPages;
  const maxPage = isServerPaginated && serverTotal != null ? (serverTotalPages ?? 1) : safeTotalPages;

  // Refetch server-paginated data when user changes page or page size (after initial Apply).
  useEffect(() => {
    if (type === "transaction" && hasAppliedTransaction.current) {
      const manual = manualFetchParamsRef.current.transaction;
      if (
        manual &&
        manual.dateFrom === dateFrom &&
        manual.dateTo === dateTo &&
        manual.page === tablePage &&
        manual.pageSize === tablePageSize
      ) {
        manualFetchParamsRef.current.transaction = null;
        return;
      }
      const pageSize = tablePageSize === 0 ? (transactionTotalRows ?? 100000) : tablePageSize;
      const page = tablePageSize === 0 ? 1 : tablePage;
      setLoading(true);
      getTransactionData({ start_date: dateFrom, end_date: dateTo, page, page_size: pageSize })
        .then((res) => {
          const list = Array.isArray(res?.data) ? res.data : [];
          setTransactionRows(list);
          setTransactionTotalRows(typeof res?.total_rows === "number" ? res.total_rows : list.length);
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user_id");
            navigate("/", { replace: true });
            return;
          }
          setFilterError(err.response?.data?.message ?? err.message ?? "Failed to load transaction records.");
        })
        .finally(() => setLoading(false));
      return;
    }
    if (type === "modmed" && hasAppliedModmed.current) {
      const manual = manualFetchParamsRef.current.modmed;
      if (
        manual &&
        manual.dateFrom === dateFrom &&
        manual.dateTo === dateTo &&
        manual.page === tablePage &&
        manual.pageSize === tablePageSize
      ) {
        manualFetchParamsRef.current.modmed = null;
        return;
      }
      const pageSize = tablePageSize === 0 ? (modmedTotalRows ?? 100000) : tablePageSize;
      const page = tablePageSize === 0 ? 1 : tablePage;
      setLoading(true);
      getModmedData({ start_date: dateFrom, end_date: dateTo, page, page_size: pageSize })
        .then((res) => {
          const list = Array.isArray(res?.data) ? res.data : [];
          setModmedRows(list);
          setModmedTotalRows(typeof res?.total_rows === "number" ? res.total_rows : list.length);
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user_id");
            navigate("/", { replace: true });
            return;
          }
          setFilterError(err.response?.data?.message ?? err.message ?? "Failed to load Modmed records.");
        })
        .finally(() => setLoading(false));
      return;
    }
    if (type === "form-submission" && hasAppliedFormSubmission.current) {
      const manual = manualFetchParamsRef.current["form-submission"];
      if (
        manual &&
        manual.dateFrom === dateFrom &&
        manual.dateTo === dateTo &&
        manual.page === tablePage &&
        manual.pageSize === tablePageSize
      ) {
        manualFetchParamsRef.current["form-submission"] = null;
        return;
      }
      const pageSize = tablePageSize === 0 ? (formSubmissionTotalRows ?? 100000) : tablePageSize;
      const page = tablePageSize === 0 ? 1 : tablePage;
      setLoading(true);
      getSubmissionData({ start_date: dateFrom, end_date: dateTo, page, page_size: pageSize })
        .then((res) => {
          const list = Array.isArray(res?.data) ? res.data : [];
          setFormSubmissionRows(list);
          setFormSubmissionTotalRows(typeof res?.total_rows === "number" ? res.total_rows : list.length);
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user_id");
            navigate("/", { replace: true });
            return;
          }
          setFilterError(err.response?.data?.message ?? err.message ?? "Failed to load form submission records.");
        })
        .finally(() => setLoading(false));
      return;
    }
    if (type === "nextech" && hasAppliedNextech.current) {
      const manual = manualFetchParamsRef.current.nextech;
      if (
        manual &&
        manual.dateFrom === dateFrom &&
        manual.dateTo === dateTo &&
        manual.page === tablePage &&
        manual.pageSize === tablePageSize
      ) {
        manualFetchParamsRef.current.nextech = null;
        return;
      }
      const pageSize = tablePageSize === 0 ? (nextechTotalRows ?? 100000) : tablePageSize;
      const page = tablePageSize === 0 ? 1 : tablePage;
      setLoading(true);
      getNextechData({ start_date: dateFrom, end_date: dateTo, page, page_size: pageSize })
        .then((res) => {
          const list = Array.isArray(res?.data) ? res.data : [];
          setNextechRows(list);
          setNextechTotalRows(typeof res?.total_rows === "number" ? res.total_rows : list.length);
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user_id");
            navigate("/", { replace: true });
            return;
          }
          setFilterError(err.response?.data?.message ?? err.message ?? "Failed to load Nextech records.");
        })
        .finally(() => setLoading(false));
      return;
    }
    if (type === "refused" && hasAppliedRefused.current) {
      const manual = manualFetchParamsRef.current.refused;
      if (
        manual &&
        manual.dateFrom === dateFrom &&
        manual.dateTo === dateTo &&
        manual.page === tablePage &&
        manual.pageSize === tablePageSize
      ) {
        manualFetchParamsRef.current.refused = null;
        return;
      }
      const pageSize = tablePageSize === 0 ? (refusedTotalRows ?? 100000) : tablePageSize;
      const page = tablePageSize === 0 ? 1 : tablePage;
      setLoading(true);
      getRefusedData({ start_date: dateFrom, end_date: dateTo, page, page_size: pageSize })
        .then((res) => {
          const list = Array.isArray(res?.data) ? res.data : [];
          setRefusedRows(list);
          setRefusedTotalRows(typeof res?.total_rows === "number" ? res.total_rows : list.length);
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user_id");
            navigate("/", { replace: true });
            return;
          }
          setFilterError(err.response?.data?.message ?? err.message ?? "Failed to load refused records.");
        })
        .finally(() => setLoading(false));
    }
  // Intentionally omit *TotalRows from deps to avoid refetch loops when state updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, dateFrom, dateTo, tablePage, tablePageSize, navigate]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      if (type === "modmed") {
        setUploadMessage("Please select 2 files: Modmed - DTRC first, Modmed - Florida second.");
      }
      return;
    }
    if (type === "login") {
      setUploadMessage("");
      setUploading(true);
      try {
        const res = await uploadLoginExcel(file);
        setFileName(file.name);
        const d = res?.data;
        const detail =
          d && typeof d.total === "number"
            ? ` Total: ${d.total}, inserted: ${d.inserted ?? 0}, failed: ${d.failed ?? 0}.`
            : "";
        setUploadMessage((res?.message || "Login data uploaded successfully.") + detail);
      } catch (err) {
        setUploadMessage(
          err.response?.data?.message ?? err.message ?? "Upload failed.",
        );
      } finally {
        setUploading(false);
        event.target.value = "";
      }
      return;
    }
    if (type === "break") {
      setUploadMessage("");
      setUploading(true);
      try {
        const res = await uploadBreakExcel(file);
        setFileName(file.name);
        const d = res?.data;
        const detail =
          d && typeof d.total === "number"
            ? ` Total: ${d.total}, inserted: ${d.inserted ?? 0}, failed: ${d.failed ?? 0}.`
            : "";
        setUploadMessage((res?.message || "Break data uploaded successfully.") + detail);
      } catch (err) {
        setUploadMessage(
          err.response?.data?.message ?? err.message ?? "Upload failed.",
        );
      } finally {
        setUploading(false);
        event.target.value = "";
      }
      return;
    }
    if (type === "time-on-status") {
      setUploadMessage("");
      setUploading(true);
      try {
        const res = await uploadTimeOnStatusExcel(file);
        setFileName(file.name);
        const d = res?.data;
        const detail =
          d && typeof d.total === "number"
            ? ` Total: ${d.total}, inserted: ${d.inserted ?? 0}, failed: ${d.failed ?? 0}.`
            : "";
        setUploadMessage((res?.message || "Time on status uploaded successfully.") + detail);
      } catch (err) {
        setUploadMessage(
          err.response?.data?.message ?? err.message ?? "Upload failed.",
        );
      } finally {
        setUploading(false);
        event.target.value = "";
      }
      return;
    }
    if (type === "transaction") {
      setUploadMessage("");
      setUploading(true);
      try {
        const res = await uploadTransactionExcel(file);
        setFileName(file.name);
        const d = res?.data;
        const detail =
          d && typeof d.total === "number"
            ? ` Total: ${d.total}, inserted: ${d.inserted ?? 0}, failed: ${d.failed ?? 0}.`
            : "";
        setUploadMessage((res?.message || "Transaction data uploaded successfully.") + detail);
      } catch (err) {
        setUploadMessage(
          err.response?.data?.message ?? err.message ?? "Upload failed.",
        );
      } finally {
        setUploading(false);
        event.target.value = "";
      }
      return;
    }
    if (type === "modmed") {
      const files = event.target.files;
      if (!files || files.length < 2) {
        setUploadMessage("Please select 2 files: Modmed - DTRC first, Modmed - Florida second.");
        return;
      }
      setUploadMessage("");
      setUploading(true);
      try {
        const res = await uploadModmedExcel(files[0], files[1]);
        setFileName(`${files[0].name}, ${files[1].name}`);
        const d = res?.data;
        const detail =
          d && typeof d.total === "number"
            ? ` Total: ${d.total}, inserted: ${d.inserted ?? 0}, failed: ${d.failed ?? 0}.`
            : "";
        setUploadMessage((res?.message || "Modmed reports uploaded successfully.") + detail);
      } catch (err) {
        setUploadMessage(
          err.response?.data?.message ?? err.message ?? "Upload failed.",
        );
      } finally {
        setUploading(false);
        event.target.value = "";
      }
      return;
    }
    if (type === "form-submission") {
      setUploadMessage("");
      setUploading(true);
      try {
        const res = await uploadFormSubmissionExcel(file, shiftDateForUpload);
        setFileName(file.name);
        const d = res?.data;
        const detail =
          d && typeof d.total === "number"
            ? ` Total: ${d.total}, inserted: ${d.inserted ?? 0}, failed: ${d.failed ?? 0}.`
            : "";
        setUploadMessage((res?.message || "Reports uploaded successfully.") + detail);
      } catch (err) {
        setUploadMessage(
          err.response?.data?.message ?? err.message ?? "Upload failed.",
        );
      } finally {
        setUploading(false);
        event.target.value = "";
      }
      return;
    }
    if (type === "nextech") {
      setUploadMessage("");
      setUploading(true);
      try {
        const res = await uploadNextechExcel(file);
        setFileName(file.name);
        const d = res?.data;
        const detail =
          d && typeof d.total === "number"
            ? ` Total: ${d.total}, inserted: ${d.inserted ?? 0}, failed: ${d.failed ?? 0}.`
            : "";
        setUploadMessage((res?.message || "Reports uploaded successfully.") + detail);
      } catch (err) {
        setUploadMessage(
          err.response?.data?.message ?? err.message ?? "Upload failed.",
        );
      } finally {
        setUploading(false);
        event.target.value = "";
      }
      return;
    }
    if (type === "refused") {
      setUploadMessage("");
      setUploading(true);
      try {
        const res = await uploadRefusedExcel(file);
        setFileName(file.name);
        const d = res?.data;
        const detail =
          d && typeof d.total === "number"
            ? ` Total: ${d.total}, inserted: ${d.inserted ?? 0}, failed: ${d.failed ?? 0}.`
            : "";
        setUploadMessage((res?.message || "Reports uploaded successfully.") + detail);
      } catch (err) {
        setUploadMessage(
          err.response?.data?.message ?? err.message ?? "Upload failed.",
        );
      } finally {
        setUploading(false);
        event.target.value = "";
      }
      return;
    }
    setFileName(file.name);
  };

  const handleEditRow = (row) => {
    if (type === "login") {
      setEditRow(row);
      setEditDraft((d) => ({
        ...d,
        Login_Time: toDateTimeLocal(row.login_time),
        Logout_Time: toDateTimeLocal(row.logout_time),
        Duration: row.duration ?? "",
        Notes: row.notes ?? "",
      }));
    } else if (type === "break") {
      setEditRow(row);
      setEditDraft((d) => ({
        ...d,
        StartTime: toDateInput(row.StartTime),
        EndTime: toDateInput(row.EndTime),
        Status: row.Status ?? "",
        StatusCodeItem: row.StatusCodeItem ?? "",
        StatusCodeList: row.StatusCodeList ?? "",
        TimeValue: row.TimeValue ?? "",
        TimePercentage: row.TimePercentage ?? "",
        LoggedInTime: row.LoggedInTime ?? "",
        Notes: row.notes ?? "",
      }));
    } else if (type === "time-on-status") {
      setEditRow(row);
      setEditDraft((d) => ({
        ...d,
        StartTime: toMMDDYYYYHHMMSS(row.StartTime),
        EndTime: toMMDDYYYYHHMMSS(row.EndTime),
        AvailableTime: row.AvailableTime ?? "",
        AvailableTimePercent: row.AvailableTimePercent ?? "",
        HandlingTime: row.HandlingTime ?? "",
        HandlingTimePercent: row.HandlingTimePercent ?? "",
        WrapUpTime: row.WrapUpTime ?? "",
        WrapUpTimePercent: row.WrapUpTimePercent ?? "",
        WorkingOfflineTime: row.WorkingOfflineTime ?? "",
        WorkingOfflineTimePercent: row.WorkingOfflineTimePercent ?? "",
        OfferingTime: row.OfferingTime ?? "",
        OfferingTimePercent: row.OfferingTimePercent ?? "",
        OnBreakTime: row.OnBreakTime ?? "",
        OnBreakTimePercent: row.OnBreakTimePercent ?? "",
        BusyTime: row.BusyTime ?? "",
        BusyTimePercent: row.BusyTimePercent ?? "",
        LoggedInTime: row.LoggedInTime ?? "",
        Notes: row.notes ?? "",
      }));
    } else {
      alert(`Edit/comment for row: ${JSON.stringify(row, null, 2)}`);
    }
  };

  const fetchAllForDateRange = async (fetchPageFn, { normalizeFn } = {}) => {
    // Fetch in chunks so we don't rely on a single huge `page_size`.
    const CHUNK_SIZE = 1000;
    const MAX_PAGES = 10000; // Safety guard in case backend misbehaves.

    let page = 1;
    let all = [];
    let totalRows = null;

    while (page <= MAX_PAGES) {
      const res = await fetchPageFn({
        start_date: dateFrom,
        end_date: dateTo,
        page,
        page_size: CHUNK_SIZE,
      });

      const list = Array.isArray(res?.data) ? res.data : [];
      if (typeof res?.total_rows === "number") totalRows = res.total_rows;

      all = all.concat(list);

      // Stop when we have reached the backend total.
      if (totalRows != null && all.length >= totalRows) break;

      // If backend doesn't send `total_rows`, stop when we receive a short page.
      if (!list.length || list.length < CHUNK_SIZE) break;

      page += 1;
    }

    const normalized = typeof normalizeFn === "function" ? all.map(normalizeFn) : all;
    const finalTotal =
      typeof totalRows === "number" ? Math.min(totalRows, normalized.length) : normalized.length;

    return { data: normalized, totalRows: finalTotal };
  };

  const handleFilter = async () => {
    if (type === "login") {
      setFilterError("");
      // Clear immediately so the table doesn't look like results are appending.
      setLoginRows([]);
      setLoginTotalRows(null);
      setTablePage(1);
      setLoading(true);
      try {
        const { data, totalRows } = await fetchAllForDateRange(getAgentLogin);
        setLoginRows(data);
        setLoginTotalRows(totalRows);
        setTablePage(1);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user_id");
          navigate("/", { replace: true });
          return;
        }
        setFilterError(err.response?.data?.message ?? err.message ?? "Failed to load login records.");
        setLoginRows([]);
        setLoginTotalRows(null);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (type === "break") {
      setFilterError("");
      setBreakRows([]);
      setBreakTotalRows(null);
      setTablePage(1);
      setLoading(true);
      try {
        const { data, totalRows } = await fetchAllForDateRange(getBreakData, {
          normalizeFn: (row) => ({
            ...row,
            // Normalize a couple of backend key-name variants for display.
            // (Example: backend may send `agent_name` instead of `agentname`.)
            agentname: row.agentname ?? row.agent_name,
          }),
        });
        setBreakRows(data);
        setBreakTotalRows(totalRows);
        setTablePage(1);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user_id");
          navigate("/", { replace: true });
          return;
        }
        setFilterError(err.response?.data?.message ?? err.message ?? "Failed to load break records.");
        setBreakRows([]);
        setBreakTotalRows(null);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (type === "time-on-status") {
      setFilterError("");
      setTimeOnStatusRows([]);
      setTimeOnStatusTotalRows(null);
      setTablePage(1);
      setLoading(true);
      try {
        const { data, totalRows } = await fetchAllForDateRange(getTimeOnStatus, {
          normalizeFn: (row) => ({
            ...row,
            // Backend may send either `agentname` or `agent_name`; normalize for the table.
            agentname: row.agentname ?? row.agent_name,
          }),
        });
        setTimeOnStatusRows(data);
        setTimeOnStatusTotalRows(totalRows);
        setTablePage(1);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user_id");
          navigate("/", { replace: true });
          return;
        }
        setFilterError(err.response?.data?.message ?? err.message ?? "Failed to load time on status records.");
        setTimeOnStatusRows([]);
        setTimeOnStatusTotalRows(null);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (type === "transaction") {
      hasAppliedTransaction.current = true;
      manualFetchParamsRef.current.transaction = {
        dateFrom,
        dateTo,
        page: 1,
        pageSize: tablePageSize,
      };
      setTransactionRows([]);
      setTransactionTotalRows(null);
      setTablePage(1);
      setFilterError("");
      setLoading(true);
      try {
        const pageSize = tablePageSize === 0 ? (transactionTotalRows ?? 100000) : tablePageSize;
        const res = await getTransactionData({
          start_date: dateFrom,
          end_date: dateTo,
          page: 1,
          page_size: pageSize,
        });
        const list = Array.isArray(res?.data) ? res.data : [];
        setTransactionRows(list);
        setTransactionTotalRows(typeof res?.total_rows === "number" ? res.total_rows : list.length);
        setTablePage(1);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user_id");
          navigate("/", { replace: true });
          return;
        }
        setFilterError(err.response?.data?.message ?? err.message ?? "Failed to load transaction records.");
        setTransactionRows([]);
        setTransactionTotalRows(null);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (type === "modmed") {
      hasAppliedModmed.current = true;
      manualFetchParamsRef.current.modmed = {
        dateFrom,
        dateTo,
        page: 1,
        pageSize: tablePageSize,
      };
      setModmedRows([]);
      setModmedTotalRows(null);
      setTablePage(1);
      setFilterError("");
      setLoading(true);
      try {
        const pageSize = tablePageSize === 0 ? (modmedTotalRows ?? 100000) : tablePageSize;
        const res = await getModmedData({
          start_date: dateFrom,
          end_date: dateTo,
          page: 1,
          page_size: pageSize,
        });
        const list = Array.isArray(res?.data) ? res.data : [];
        setModmedRows(list);
        setModmedTotalRows(typeof res?.total_rows === "number" ? res.total_rows : list.length);
        setTablePage(1);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user_id");
          navigate("/", { replace: true });
          return;
        }
        setFilterError(err.response?.data?.message ?? err.message ?? "Failed to load Modmed records.");
        setModmedRows([]);
        setModmedTotalRows(null);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (type === "form-submission") {
      hasAppliedFormSubmission.current = true;
      manualFetchParamsRef.current["form-submission"] = {
        dateFrom,
        dateTo,
        page: 1,
        pageSize: tablePageSize,
      };
      setFormSubmissionRows([]);
      setFormSubmissionTotalRows(null);
      setTablePage(1);
      setFilterError("");
      setLoading(true);
      try {
        const pageSize = tablePageSize === 0 ? (formSubmissionTotalRows ?? 100000) : tablePageSize;
        const res = await getSubmissionData({
          start_date: dateFrom,
          end_date: dateTo,
          page: 1,
          page_size: pageSize,
        });
        const list = Array.isArray(res?.data) ? res.data : [];
        setFormSubmissionRows(list);
        setFormSubmissionTotalRows(typeof res?.total_rows === "number" ? res.total_rows : list.length);
        setTablePage(1);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user_id");
          navigate("/", { replace: true });
          return;
        }
        setFilterError(err.response?.data?.message ?? err.message ?? "Failed to load form submission records.");
        setFormSubmissionRows([]);
        setFormSubmissionTotalRows(null);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (type === "refused") {
      hasAppliedRefused.current = true;
      manualFetchParamsRef.current.refused = {
        dateFrom,
        dateTo,
        page: 1,
        pageSize: tablePageSize,
      };
      setRefusedRows([]);
      setRefusedTotalRows(null);
      setTablePage(1);
      setFilterError("");
      setLoading(true);
      try {
        const pageSize = tablePageSize === 0 ? (refusedTotalRows ?? 100000) : tablePageSize;
        const res = await getRefusedData({
          start_date: dateFrom,
          end_date: dateTo,
          page: 1,
          page_size: pageSize,
        });
        const list = Array.isArray(res?.data) ? res.data : [];
        setRefusedRows(list);
        setRefusedTotalRows(typeof res?.total_rows === "number" ? res.total_rows : list.length);
        setTablePage(1);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user_id");
          navigate("/", { replace: true });
          return;
        }
        setFilterError(err.response?.data?.message ?? err.message ?? "Failed to load refused records.");
        setRefusedRows([]);
        setRefusedTotalRows(null);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (type === "nextech") {
      hasAppliedNextech.current = true;
      manualFetchParamsRef.current.nextech = {
        dateFrom,
        dateTo,
        page: 1,
        pageSize: tablePageSize,
      };
      setNextechRows([]);
      setNextechTotalRows(null);
      setTablePage(1);
      setFilterError("");
      setLoading(true);
      try {
        const pageSize = tablePageSize === 0 ? (nextechTotalRows ?? 100000) : tablePageSize;
        const res = await getNextechData({
          start_date: dateFrom,
          end_date: dateTo,
          page: 1,
          page_size: pageSize,
        });
        const list = Array.isArray(res?.data) ? res.data : [];
        setNextechRows(list);
        setNextechTotalRows(typeof res?.total_rows === "number" ? res.total_rows : list.length);
        setTablePage(1);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user_id");
          navigate("/", { replace: true });
          return;
        }
        setFilterError(err.response?.data?.message ?? err.message ?? "Failed to load Nextech records.");
        setNextechRows([]);
        setNextechTotalRows(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExcelDownload = () => {
    const rowsToExport =
      type === "login"
        ? loginRows
        : type === "break"
          ? breakRows
          : type === "time-on-status"
            ? timeOnStatusRows
            : type === "transaction"
              ? transactionRows
            : [];

    if (!Array.isArray(rowsToExport) || rowsToExport.length === 0) {
      alert("No data to download. Click Apply first for the selected date range.");
      return;
    }

    // Export columns in the same order as the API response keys.
    const cols = buildColumnsFromApiRows(rowsToExport, COLUMNS_BY_TYPE[type] ?? columns);

    const escapeCsvValue = (v) => {
      if (v === null || v === undefined) return "";
      if (typeof v === "object") return JSON.stringify(v);
      const s = String(v);
      if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const headerLine = cols.map((c) => escapeCsvValue(c.header)).join(",");
    const dataLines = rowsToExport.map((row) =>
      cols
        .map((c) => escapeCsvValue(row?.[c.accessorKey]))
        .join(","),
    );

    // UTF-8 BOM helps Excel open the CSV with correct encoding.
    const csv = `\uFEFF${[headerLine, ...dataLines].join("\r\n")}`;

    const safeType = String(type).replace(/[^a-z0-9_-]+/gi, "_");
    const safeFrom = String(dateFrom).replace(/[^0-9-]+/g, "");
    const safeTo = String(dateTo).replace(/[^0-9-]+/g, "");
    const fileName = `${safeType}_${safeFrom}_to_${safeTo}.csv`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const closeEditOffcanvas = () => {
    setEditRow(null);
    setNotesViewOpen(false);
    setNotesViewText("");
    setEditDraft({
      Login_Time: "",
      Logout_Time: "",
      Duration: "",
      Notes: "",
      StartTime: "",
      EndTime: "",
      Status: "",
      StatusCodeItem: "",
      StatusCodeList: "",
      TimeValue: "",
      TimePercentage: "",
      LoggedInTime: "",
      AvailableTime: "",
      AvailableTimePercent: "",
      HandlingTime: "",
      HandlingTimePercent: "",
      WrapUpTime: "",
      WrapUpTimePercent: "",
      WorkingOfflineTime: "",
      WorkingOfflineTimePercent: "",
      OfferingTime: "",
      OfferingTimePercent: "",
      OnBreakTime: "",
      OnBreakTimePercent: "",
      BusyTime: "",
      BusyTimePercent: "",
    });
  };

  const handleSaveLoginEdit = async () => {
    if (!editRow || savingNote) return;
    setSavingNote(true);
    try {
      const body = {
        id: editRow.id,
        Login_Time: toYYYYMMDDHHMMSS(editDraft.Login_Time),
        Logout_Time: toYYYYMMDDHHMMSS(editDraft.Logout_Time),
        Duration: editDraft.Duration || "00:00:00",
        Notes: editDraft.Notes,
        updated_by: getCurrentUserId(),
      };
      await updateLoginTime(body);
      setLoginRows((prev) =>
        prev.map((r) =>
          r.id === editRow.id
            ? {
                ...r,
                login_time: body.Login_Time,
                logout_time: body.Logout_Time,
                duration: body.Duration,
                notes: body.Notes,
              }
            : r,
        ),
      );
      closeEditOffcanvas();
    } catch (err) {
      alert(err.response?.data?.message ?? err.message ?? "Failed to update record.");
    } finally {
      setSavingNote(false);
    }
  };

  const handleSaveBreakEdit = async () => {
    if (!editRow || savingNote) return;
    setSavingNote(true);
    try {
      const rawStart = toYYYYMMDDHHMMSS(editDraft.StartTime) || editRow.StartTime || "";
      const rawEnd = toYYYYMMDDHHMMSS(editDraft.EndTime) || editRow.EndTime || "";
      const toFullDatetime = (v) => {
        if (!v || typeof v !== "string") return "";
        const s = v.trim();
        if (s.length >= 19) return s.slice(0, 19);
        if (s.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s} 00:00:00`;
        return s;
      };
      const body = {
        id: editRow.Id,
        StartTime: toFullDatetime(rawStart),
        EndTime: toFullDatetime(rawEnd),
        Status: editDraft.Status ?? "",
        StatusCodeItem: editDraft.StatusCodeItem ?? "",
        StatusCodeList: editDraft.StatusCodeList ?? "",
        TimeValue: editDraft.TimeValue || "00:00:00",
        TimePercentage: Number(editDraft.TimePercentage) || 0,
        LoggedInTime: editDraft.LoggedInTime || "00:00:00",
        Notes: editDraft.Notes ?? "",
        updated_by: getCurrentUserId(),
      };
      await updateBreakData(body);
      setBreakRows((prev) =>
        prev.map((r) =>
          r.Id === editRow.Id
            ? {
                ...r,
                StartTime: body.StartTime,
                EndTime: body.EndTime,
                Status: body.Status,
                StatusCodeItem: body.StatusCodeItem,
                StatusCodeList: body.StatusCodeList,
                TimeValue: body.TimeValue,
                TimePercentage: body.TimePercentage,
                LoggedInTime: body.LoggedInTime,
                notes: body.Notes,
              }
            : r,
        ),
      );
      closeEditOffcanvas();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((e) => `${e.loc?.join(".") ?? ""}: ${e.msg}`).join("\n")
        : err.response?.data?.message ?? err.message ?? "Failed to update break record.";
      alert(msg);
    } finally {
      setSavingNote(false);
    }
  };

  const handleSaveTimeOnStatusEdit = async () => {
    if (!editRow || savingNote) return;
    setSavingNote(true);
    try {
      const toFullDatetime = (v) => {
        if (!v || typeof v !== "string") return "";
        const s = v.trim();
        if (s.length >= 19) return s.slice(0, 19);
        if (s.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s} 00:00:00`;
        return s;
      };
      const rawStart = fromMMDDYYYYHHMMSS(editDraft.StartTime) || editRow.StartTime || "";
      const rawEnd = fromMMDDYYYYHHMMSS(editDraft.EndTime) || editRow.EndTime || "";
      const body = {
        Id: editRow.Id,
        StartTime: toFullDatetime(rawStart),
        EndTime: toFullDatetime(rawEnd),
        AvailableTime: editDraft.AvailableTime || "00:00:00",
        AvailableTimePercent: String(editDraft.AvailableTimePercent ?? ""),
        HandlingTime: editDraft.HandlingTime || "00:00:00",
        HandlingTimePercent: String(editDraft.HandlingTimePercent ?? ""),
        WrapUpTime: editDraft.WrapUpTime || "00:00:00",
        WrapUpTimePercent: String(editDraft.WrapUpTimePercent ?? ""),
        WorkingOfflineTime: editDraft.WorkingOfflineTime || "00:00:00",
        WorkingOfflineTimePercent: String(editDraft.WorkingOfflineTimePercent ?? ""),
        OfferingTime: editDraft.OfferingTime || "00:00:00",
        OfferingTimePercent: String(editDraft.OfferingTimePercent ?? ""),
        OnBreakTime: editDraft.OnBreakTime || "00:00:00",
        OnBreakTimePercent: String(editDraft.OnBreakTimePercent ?? ""),
        BusyTime: editDraft.BusyTime || "00:00:00",
        BusyTimePercent: String(editDraft.BusyTimePercent ?? ""),
        LoggedInTime: editDraft.LoggedInTime || "00:00:00",
        Notes: editDraft.Notes ?? "",
        updated_by: getCurrentUserId(),
      };
      await updateTimeOnStatus(body);
      const updatedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
      setTimeOnStatusRows((prev) =>
        prev.map((r) =>
          r.Id === editRow.Id
            ? {
                ...r,
                StartTime: body.StartTime,
                EndTime: body.EndTime,
                AvailableTime: body.AvailableTime,
                AvailableTimePercent: body.AvailableTimePercent,
                HandlingTime: body.HandlingTime,
                HandlingTimePercent: body.HandlingTimePercent,
                WrapUpTime: body.WrapUpTime,
                WrapUpTimePercent: body.WrapUpTimePercent,
                WorkingOfflineTime: body.WorkingOfflineTime,
                WorkingOfflineTimePercent: body.WorkingOfflineTimePercent,
                OfferingTime: body.OfferingTime,
                OfferingTimePercent: body.OfferingTimePercent,
                OnBreakTime: body.OnBreakTime,
                OnBreakTimePercent: body.OnBreakTimePercent,
                BusyTime: body.BusyTime,
                BusyTimePercent: body.BusyTimePercent,
                LoggedInTime: body.LoggedInTime,
                notes: body.Notes,
                updatedby: body.updated_by,
                updated_at: updatedAt,
              }
            : r,
        ),
      );
      closeEditOffcanvas();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((e) => `${e.loc?.join(".") ?? ""}: ${e.msg}`).join("\n")
        : err.response?.data?.message ?? err.message ?? "Failed to update time on status.";
      alert(msg);
    } finally {
      setSavingNote(false);
    }
  };

  const theme = {
    bar: isDark ? "border-slate-800/80 bg-slate-950/80" : "border-slate-200 bg-white/95",
    input: isDark ? "border-slate-700 bg-slate-950 text-slate-100" : "border-slate-300 bg-white text-slate-900",
    label: isDark ? "text-slate-400" : "text-slate-600",
    searchBox: isDark ? "bg-slate-900/80 text-slate-300" : "bg-slate-100 text-slate-700",
    pageInfo: isDark ? "text-slate-500" : "text-slate-600",
    prevNext: isDark
      ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
      : "border-slate-400 bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed",
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Report name always on first line */}
      <div className={`rounded-2xl border px-4 py-2 ${theme.bar}`}>
        <h1 className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
          Report: {type === "login" ? "Login activity" : type === "break" ? "Break logs" : type === "time-on-status" ? "Time on status" : type === "transaction" ? "Transactions" : type === "form-submission" ? "Form submissions" : type === "modmed" ? "ModMed" : type === "nextech" ? "Nextech" : type === "refused" ? "Form refused" : `${cfg.title} records`}
        </h1>
      </div>

      {(type === "login" || type === "break" || type === "time-on-status" || type === "transaction" || type === "modmed" || type === "form-submission" || type === "nextech" || type === "refused") ? (
        <div className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-2 text-xs ${theme.bar}`}>
          <span className={theme.label}>From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={`h-8 rounded-lg border px-2 text-[11px] outline-none ${theme.input}`}
          />
          <span className={theme.label}>To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={`h-8 rounded-lg border px-2 text-[11px] outline-none ${theme.input}`}
          />
          {type === "form-submission" && (
            <>
              <span className={theme.label}>Upload date</span>
              <input
                type="date"
                value={shiftDateForUpload}
                onChange={(e) => setShiftDateForUpload(e.target.value)}
                className={`h-8 rounded-lg border px-2 text-[11px] outline-none ${theme.input}`}
              />
            </>
          )}
          <button
            type="button"
            onClick={handleFilter}
            disabled={loading}
            className="h-8 rounded-lg border border-medical/60 bg-medical/10 px-3 text-[11px] font-semibold text-medical hover:bg-medical/20 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Apply"}
          </button>
          {(type === "login" || type === "break" || type === "time-on-status" || type === "transaction") && (
            <button
              type="button"
              onClick={handleExcelDownload}
              disabled={loading || rows.length === 0}
              className="h-8 rounded-lg border border-medical/60 bg-medical/10 px-3 text-[11px] font-semibold text-medical hover:bg-medical/20 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Download Excel"}
            </button>
          )}
          <label
            className={`flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-3 text-[11px] ${
              uploading
                ? isDark
                  ? "cursor-not-allowed border-slate-800 bg-slate-900 text-slate-500"
                  : "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500"
                : isDark
                  ? "border-slate-700 bg-slate-950 text-slate-200 hover:border-medical/60 hover:text-medical"
                  : "border-slate-300 bg-white text-slate-700 hover:border-medical/60 hover:text-medical"
            }`}
          >
            <span>{uploading ? "Uploading…" : type === "modmed" ? "Excel upload (2 files)" : "Excel upload"}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={uploading}
              multiple={type === "modmed"}
              onChange={handleUpload}
            />
          </label>
          {fileName && <span className={theme.label}>{fileName}</span>}
          <label className={`flex items-center gap-1 rounded-lg px-2 py-1.5 ${theme.searchBox}`}>
            <span className="text-[11px]">Search</span>
            <input
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setTablePage(1);
              }}
              placeholder="Type to filter"
              className={`h-6 w-28 rounded bg-transparent px-1 text-[11px] outline-none ${isDark ? "text-slate-100" : "text-slate-900"}`}
            />
          </label>
          <label className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${theme.searchBox}`}>
            <span className="text-[11px] whitespace-nowrap">Rows</span>
            <select
              value={tablePageSize}
              onChange={(e) => {
                const v = e.target.value;
                setTablePageSize(v === "all" ? 0 : Number(v));
                setTablePage(1);
              }}
              className={`h-7 min-w-[4rem] cursor-pointer rounded-md border px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-medical/30 ${
                isDark
                  ? "border-slate-600 bg-slate-800 text-slate-100"
                  : "border-slate-300 bg-white text-slate-800"
              }`}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size} className={isDark ? "bg-slate-800 text-slate-100" : "bg-white text-slate-800"}>
                  {size.toLocaleString()}
                </option>
              ))}
              <option value={0} className={isDark ? "bg-slate-800 text-slate-100" : "bg-white text-slate-800"}>
                All
              </option>
            </select>
          </label>
          <span className={`text-[11px] font-medium ${theme.pageInfo}`}>
            {paginationLabel}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTablePage((p) => Math.max(1, p - 1))}
              disabled={prevDisabled}
              className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${theme.prevNext}`}
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setTablePage((p) => Math.min(maxPage, p + 1))}
              disabled={nextDisabled}
              className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${theme.prevNext}`}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-2 text-xs ${theme.bar}`}>
          <span className={theme.label}>From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={`h-8 rounded-lg border px-2 text-[11px] outline-none ${theme.input}`}
          />
          <span className={theme.label}>To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={`h-8 rounded-lg border px-2 text-[11px] outline-none ${theme.input}`}
          />
          <button
            type="button"
            onClick={handleFilter}
            className="h-8 rounded-lg border border-medical/60 bg-medical/10 px-3 text-[11px] font-semibold text-medical hover:bg-medical/20"
          >
            Apply
          </button>
          <label
            className={`flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-3 text-[11px] ${
              isDark
                ? "border-slate-700 bg-slate-950 text-slate-200 hover:border-medical/60 hover:text-medical"
                : "border-slate-300 bg-white text-slate-700 hover:border-medical/60 hover:text-medical"
            }`}
          >
            <span>Excel upload</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
          {fileName && <span className={theme.label}>{fileName}</span>}
          <label className={`flex items-center gap-1 rounded-lg px-2 py-1.5 ${theme.searchBox}`}>
            <span className="text-[11px]">Search</span>
            <input
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setTablePage(1);
              }}
              placeholder="Type to filter"
              className={`h-6 w-28 rounded bg-transparent px-1 text-[11px] outline-none ${isDark ? "text-slate-100" : "text-slate-900"}`}
            />
          </label>
          <label className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${theme.searchBox}`}>
            <span className="text-[11px] whitespace-nowrap">Rows</span>
            <select
              value={tablePageSize}
              onChange={(e) => {
                const v = e.target.value;
                setTablePageSize(v === "all" ? 0 : Number(v));
                setTablePage(1);
              }}
              className={`h-7 min-w-[4rem] cursor-pointer rounded-md border px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-medical/30 ${
                isDark
                  ? "border-slate-600 bg-slate-800 text-slate-100"
                  : "border-slate-300 bg-white text-slate-800"
              }`}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size} className={isDark ? "bg-slate-800 text-slate-100" : "bg-white text-slate-800"}>
                  {size.toLocaleString()}
                </option>
              ))}
              <option value={0} className={isDark ? "bg-slate-800 text-slate-100" : "bg-white text-slate-800"}>
                All
              </option>
            </select>
          </label>
          <span className={`text-[11px] font-medium ${theme.pageInfo}`}>
            {paginationLabel}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTablePage((p) => Math.max(1, p - 1))}
              disabled={prevDisabled}
              className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${theme.prevNext}`}
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setTablePage((p) => Math.min(maxPage, p + 1))}
              disabled={nextDisabled}
              className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${theme.prevNext}`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {(type === "login" || type === "break" || type === "time-on-status" || type === "transaction" || type === "modmed" || type === "form-submission" || type === "nextech" || type === "refused") && uploadMessage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-result-title"
        >
          <div
            className={`relative max-w-sm w-full rounded-xl border px-5 py-4 shadow-xl ${
              uploadMessage.startsWith("Upload failed")
                ? "border-red-500/50 bg-red-950/90"
                : "border-green-500/50 bg-slate-900"
            }`}
          >
            <p
              id="upload-result-title"
              className={`text-sm font-medium ${
                uploadMessage.startsWith("Upload failed")
                  ? "text-red-200"
                  : "text-green-200"
              }`}
            >
              {uploadMessage.startsWith("Upload failed") ? "Upload failed" : "Success"}
            </p>
            <p className="mt-2 text-xs text-slate-300 whitespace-pre-wrap">
              {uploadMessage}
            </p>
            <button
              type="button"
              onClick={() => setUploadMessage("")}
              className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {(type === "login" || type === "break" || type === "time-on-status" || type === "transaction" || type === "modmed" || type === "form-submission" || type === "nextech" || type === "refused") && filterError && (
        <p className="rounded-lg border border-red-900/80 bg-red-950/50 px-3 py-2 text-xs text-red-300">
          {filterError}
        </p>
      )}

      <DataTable
        title={cfg.title}
        columns={columns}
        rows={rows}
        editable={cfg.editable}
        editColumnFirst={true}
        onEditRow={cfg.editable ? handleEditRow : undefined}
        className="flex-1 min-h-0"
        tableScrollClassName="h-full"
        isDark={isDark}
        searchValue={tableSearch}
        onSearchChange={setTableSearch}
        pageValue={tablePage}
        onPageChange={setTablePage}
        pageSizeValue={tablePageSize}
        onPageSizeChange={setTablePageSize}
        hideToolbar={true}
        hidePagination={true}
        onPaginationInfo={setTablePagination}
        maxPageSize={isServerPaginated ? null : undefined}
      />

      {type === "login" && editRow && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950"
            aria-hidden
            onClick={closeEditOffcanvas}
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-50">
                Edit login — {editRow.agentname ?? editRow.agent_name ?? editRow.agent ?? `ID ${editRow.id}`}
              </h2>
              <button
                type="button"
                onClick={closeEditOffcanvas}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {notesViewOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[10000] bg-slate-950"
                    aria-hidden
                    onClick={() => setNotesViewOpen(false)}
                  />
                  <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
                    <div
                      role="dialog"
                      aria-modal="true"
                      className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 shadow-xl"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h3 className="text-sm font-semibold text-slate-50">Notes</h3>
                        <button
                          type="button"
                          onClick={() => setNotesViewOpen(false)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                          aria-label="Close notes popup"
                        >
                          ×
                        </button>
                      </div>
                      <div className="mt-3 max-h-[60vh] overflow-auto whitespace-pre-wrap text-xs text-slate-200">
                        {notesViewText}
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">
                  Login time
                </label>
                <div className="relative">
                  <input
                    ref={loginDateInputRef}
                    type="datetime-local"
                    value={editDraft.Login_Time}
                    onChange={(e) => setEditDraft((d) => ({ ...d, Login_Time: e.target.value }))}
                    onBlur={() =>
                      setEditDraft((d) => ({
                        ...d,
                        Duration: computeDuration(d.Login_Time, d.Logout_Time) || d.Duration,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-10 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    onClick={() => {
                      const el = loginDateInputRef.current;
                      if (el && typeof el.showPicker === "function") el.showPicker();
                      else el?.focus?.();
                    }}
                    aria-label="Pick login date and time"
                    title="Pick date/time"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">
                  Logout time
                </label>
                <div className="relative">
                  <input
                    ref={logoutDateInputRef}
                    type="datetime-local"
                    value={editDraft.Logout_Time}
                    onChange={(e) => setEditDraft((d) => ({ ...d, Logout_Time: e.target.value }))}
                    onBlur={() =>
                      setEditDraft((d) => ({
                        ...d,
                        Duration: computeDuration(d.Login_Time, d.Logout_Time) || d.Duration,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-10 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    onClick={() => {
                      const el = logoutDateInputRef.current;
                      if (el && typeof el.showPicker === "function") el.showPicker();
                      else el?.focus?.();
                    }}
                    aria-label="Pick logout date and time"
                    title="Pick date/time"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">
                  Duration <span className="text-slate-500">(HH:MM:SS)</span>
                </label>
                <input
                  type="text"
                  value={editDraft.Duration}
                  onChange={(e) => setEditDraft((d) => ({ ...d, Duration: e.target.value }))}
                  placeholder="00:00:00"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="block text-[11px] font-medium text-slate-300">Notes</label>
                  {String(editDraft.Notes ?? "").trim().length > 0 && (
                    <button
                      type="button"
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      aria-label="View notes popup"
                      title="View notes"
                      onClick={() => {
                        setNotesViewText(editDraft.Notes ?? "");
                        setNotesViewOpen(true);
                      }}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <textarea
                  value={editDraft.Notes}
                  onChange={(e) => setEditDraft((d) => ({ ...d, Notes: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  placeholder="Add or edit notes…"
                />
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-800 px-4 py-3">
              <button
                type="button"
                onClick={handleSaveLoginEdit}
                disabled={savingNote}
                className="rounded-lg border border-medical/60 bg-medical/20 px-3 py-2 text-[11px] font-semibold text-medical hover:bg-medical/30 disabled:opacity-50"
              >
                {savingNote ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={closeEditOffcanvas}
                className="rounded-lg border border-slate-700 px-3 py-2 text-[11px] text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {type === "break" && editRow && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/70"
            aria-hidden
            onClick={closeEditOffcanvas}
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-50">
                Edit break — {editRow.agent_name ?? editRow.Agent ?? `ID ${editRow.Id}`}
              </h2>
              <button
                type="button"
                onClick={closeEditOffcanvas}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">Start date</label>
                <div className="relative">
                  <input
                    ref={breakStartDateInputRef}
                    type="date"
                    value={editDraft.StartTime}
                    onChange={(e) => setEditDraft((d) => ({ ...d, StartTime: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-10 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    onClick={() => {
                      const el = breakStartDateInputRef.current;
                      if (el && typeof el.showPicker === "function") el.showPicker();
                      else el?.focus?.();
                    }}
                    aria-label="Pick start date"
                    title="Pick date"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">End date</label>
                <div className="relative">
                  <input
                    ref={breakEndDateInputRef}
                    type="date"
                    value={editDraft.EndTime}
                    onChange={(e) => setEditDraft((d) => ({ ...d, EndTime: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-10 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    onClick={() => {
                      const el = breakEndDateInputRef.current;
                      if (el && typeof el.showPicker === "function") el.showPicker();
                      else el?.focus?.();
                    }}
                    aria-label="Pick end date"
                    title="Pick date"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">Status</label>
                <input
                  type="text"
                  value={editDraft.Status}
                  onChange={(e) => setEditDraft((d) => ({ ...d, Status: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">StatusCode item</label>
                <input
                  type="text"
                  value={editDraft.StatusCodeItem}
                  onChange={(e) => setEditDraft((d) => ({ ...d, StatusCodeItem: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">StatusCode list</label>
                <input
                  type="text"
                  value={editDraft.StatusCodeList}
                  onChange={(e) => setEditDraft((d) => ({ ...d, StatusCodeList: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">Time value (HH:MM:SS)</label>
                <input
                  type="text"
                  value={editDraft.TimeValue}
                  onChange={(e) => setEditDraft((d) => ({ ...d, TimeValue: e.target.value }))}
                  placeholder="00:00:00"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">Time percentage</label>
                <input
                  type="number"
                  step="any"
                  value={editDraft.TimePercentage}
                  onChange={(e) => setEditDraft((d) => ({ ...d, TimePercentage: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">Logged-in time</label>
                <input
                  type="text"
                  value={editDraft.LoggedInTime}
                  onChange={(e) => setEditDraft((d) => ({ ...d, LoggedInTime: e.target.value }))}
                  placeholder="HH:MM:SS"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">Notes</label>
                <textarea
                  value={editDraft.Notes}
                  onChange={(e) => setEditDraft((d) => ({ ...d, Notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  placeholder="Add or edit notes…"
                />
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-800 px-4 py-3">
              <button
                type="button"
                onClick={handleSaveBreakEdit}
                disabled={savingNote}
                className="rounded-lg border border-medical/60 bg-medical/20 px-3 py-2 text-[11px] font-semibold text-medical hover:bg-medical/30 disabled:opacity-50"
              >
                {savingNote ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={closeEditOffcanvas}
                className="rounded-lg border border-slate-700 px-3 py-2 text-[11px] text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {type === "time-on-status" && editRow && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/70"
            aria-hidden
            onClick={closeEditOffcanvas}
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-50">
                Edit time on status — {editRow.agentname ?? editRow.agent_name ?? editRow.Agent ?? `ID ${editRow.Id}`}
              </h2>
              <button
                type="button"
                onClick={closeEditOffcanvas}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">Start time</label>
                <input
                  type="text"
                  value={editDraft.StartTime}
                  onChange={(e) => setEditDraft((d) => ({ ...d, StartTime: e.target.value }))}
                  placeholder="MM-dd-yyyy HH:mm:ss"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">End time</label>
                <input
                  type="text"
                  value={editDraft.EndTime}
                  onChange={(e) => setEditDraft((d) => ({ ...d, EndTime: e.target.value }))}
                  placeholder="MM-dd-yyyy HH:mm:ss"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">Available time</label>
                  <input
                    type="text"
                    value={editDraft.AvailableTime}
                    onChange={(e) => setEditDraft((d) => ({ ...d, AvailableTime: e.target.value }))}
                    placeholder="HH:mm:ss"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">Available %</label>
                  <input
                    type="text"
                    value={editDraft.AvailableTimePercent}
                    onChange={(e) => setEditDraft((d) => ({ ...d, AvailableTimePercent: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">Handling time</label>
                  <input
                    type="text"
                    value={editDraft.HandlingTime}
                    onChange={(e) => setEditDraft((d) => ({ ...d, HandlingTime: e.target.value }))}
                    placeholder="HH:mm:ss"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">Handling %</label>
                  <input
                    type="text"
                    value={editDraft.HandlingTimePercent}
                    onChange={(e) => setEditDraft((d) => ({ ...d, HandlingTimePercent: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">Wrap-up time</label>
                  <input
                    type="text"
                    value={editDraft.WrapUpTime}
                    onChange={(e) => setEditDraft((d) => ({ ...d, WrapUpTime: e.target.value }))}
                    placeholder="HH:mm:ss"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">Wrap-up %</label>
                  <input
                    type="text"
                    value={editDraft.WrapUpTimePercent}
                    onChange={(e) => setEditDraft((d) => ({ ...d, WrapUpTimePercent: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">Working offline</label>
                  <input
                    type="text"
                    value={editDraft.WorkingOfflineTime}
                    onChange={(e) => setEditDraft((d) => ({ ...d, WorkingOfflineTime: e.target.value }))}
                    placeholder="HH:mm:ss"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">Working offline %</label>
                  <input
                    type="text"
                    value={editDraft.WorkingOfflineTimePercent}
                    onChange={(e) => setEditDraft((d) => ({ ...d, WorkingOfflineTimePercent: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">Offering time</label>
                  <input
                    type="text"
                    value={editDraft.OfferingTime}
                    onChange={(e) => setEditDraft((d) => ({ ...d, OfferingTime: e.target.value }))}
                    placeholder="HH:mm:ss"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">Offering %</label>
                  <input
                    type="text"
                    value={editDraft.OfferingTimePercent}
                    onChange={(e) => setEditDraft((d) => ({ ...d, OfferingTimePercent: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">On break time</label>
                  <input
                    type="text"
                    value={editDraft.OnBreakTime}
                    onChange={(e) => setEditDraft((d) => ({ ...d, OnBreakTime: e.target.value }))}
                    placeholder="HH:mm:ss"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">On break %</label>
                  <input
                    type="text"
                    value={editDraft.OnBreakTimePercent}
                    onChange={(e) => setEditDraft((d) => ({ ...d, OnBreakTimePercent: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">Busy time</label>
                  <input
                    type="text"
                    value={editDraft.BusyTime}
                    onChange={(e) => setEditDraft((d) => ({ ...d, BusyTime: e.target.value }))}
                    placeholder="HH:mm:ss"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">Busy %</label>
                  <input
                    type="text"
                    value={editDraft.BusyTimePercent}
                    onChange={(e) => setEditDraft((d) => ({ ...d, BusyTimePercent: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">Logged-in time</label>
                <input
                  type="text"
                  value={editDraft.LoggedInTime}
                  onChange={(e) => setEditDraft((d) => ({ ...d, LoggedInTime: e.target.value }))}
                  placeholder="HH:mm:ss"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">Notes</label>
                <textarea
                  value={editDraft.Notes}
                  onChange={(e) => setEditDraft((d) => ({ ...d, Notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-medical/60"
                  placeholder="Add or edit notes…"
                />
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-800 px-4 py-3">
              <button
                type="button"
                onClick={handleSaveTimeOnStatusEdit}
                disabled={savingNote}
                className="rounded-lg border border-medical/60 bg-medical/20 px-3 py-2 text-[11px] font-semibold text-medical hover:bg-medical/30 disabled:opacity-50"
              >
                {savingNote ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={closeEditOffcanvas}
                className="rounded-lg border border-slate-700 px-3 py-2 text-[11px] text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

