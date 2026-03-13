import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import DataTable from "../components/DataTable";

const pad2 = (n) => String(n).padStart(2, "0");
const TODAY = new Date();
const DEFAULT_DATE_INPUT = `${TODAY.getFullYear()}-${pad2(
  TODAY.getMonth() + 1,
)}-${pad2(TODAY.getDate())}`;
const DEFAULT_DATE_LABEL = `${pad2(TODAY.getMonth() + 1)}-${pad2(
  TODAY.getDate(),
)}-${TODAY.getFullYear()}`;

const COLUMNS_BY_TYPE = {
  login: [
    { header: "id", accessorKey: "id" },
    { header: "shiftdate", accessorKey: "shiftdate" },
    { header: "agent", accessorKey: "agent" },
    { header: "agent_id", accessorKey: "agent_id" },
    { header: "login_time", accessorKey: "login_time" },
    { header: "logout_time", accessorKey: "logout_time" },
    { header: "duration", accessorKey: "duration" },
    { header: "notes", accessorKey: "notes" },
    { header: "updatedby", accessorKey: "updatedby" },
    { header: "updated_at", accessorKey: "updated_at" },
  ],
  break: [
    { header: "Id", accessorKey: "Id" },
    { header: "StartTime", accessorKey: "StartTime" },
    { header: "EndTime", accessorKey: "EndTime" },
    { header: "Agent", accessorKey: "Agent" },
    { header: "AgentId", accessorKey: "AgentId" },
    { header: "Status", accessorKey: "Status" },
    { header: "StatusCodeItem", accessorKey: "StatusCodeItem" },
    { header: "StatusCodeList", accessorKey: "StatusCodeList" },
    { header: "GroupName", accessorKey: "GroupName" },
    { header: "TimeValue", accessorKey: "TimeValue" },
    { header: "TimePercentage", accessorKey: "TimePercentage" },
    { header: "LoggedInTime", accessorKey: "LoggedInTime" },
    { header: "notes", accessorKey: "notes" },
    { header: "updatedby", accessorKey: "updatedby" },
    { header: "updated_at", accessorKey: "updated_at" },
  ],
  "time-on-status": [
    { header: "Id", accessorKey: "Id" },
    { header: "StartTime", accessorKey: "StartTime" },
    { header: "EndTime", accessorKey: "EndTime" },
    { header: "Agent", accessorKey: "Agent" },
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
    { header: "updatedby", accessorKey: "updatedby" },
    { header: "updated_at", accessorKey: "updated_at" },
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
    { header: "Participant", accessorKey: "Participant" },
    { header: "OfferActionTime", accessorKey: "OfferActionTime" },
    { header: "HandlingDuration", accessorKey: "HandlingDuration" },
    { header: "WrapUpDuration", accessorKey: "WrapUpDuration" },
    { header: "ProcessingDuration", accessorKey: "ProcessingDuration" },
    { header: "TimetoAbandon", accessorKey: "TimetoAbandon" },
    { header: "WrapUpCodeText", accessorKey: "WrapUpCodeText" },
    { header: "createdDate", accessorKey: "createdDate" },
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
  const { activeMenu } = useOutletContext();
  const [dateFrom, setDateFrom] = useState(DEFAULT_DATE_INPUT);
  const [dateTo, setDateTo] = useState(DEFAULT_DATE_INPUT);
  const [fileName, setFileName] = useState("");

  const cfg = CONFIG[type] ?? { title: activeMenu.label, editable: false };

  const columns =
    COLUMNS_BY_TYPE[type] ?? [
      { header: "Date", accessorKey: "date" },
      { header: "User", accessorKey: "user" },
      { header: "Status", accessorKey: "status" },
      { header: "Comments", accessorKey: "comments" },
    ];

  const rows = [];

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    // TODO: call corresponding Swagger API for this menu with form-data
  };

  const handleEditRow = (row) => {
    // TODO: open drawer/modal to edit row + comments and POST to API
    // keeping placeholder implementation for now
    // eslint-disable-next-line no-alert
    alert(`Edit/comment for row: ${JSON.stringify(row, null, 2)}`);
  };

  const handleFilter = () => {
    // TODO: call GET API with dateFrom/dateTo + pagination
    // keeping UI-only for now
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold text-slate-50">
            {cfg.title} records
          </h1>
          <p className="text-xs text-slate-400">
            Filter by date range, upload excel, and review activity.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-300">
              From date
              <span className="ml-1 text-[10px] text-slate-500">
                (MM-dd-yyyy: {DEFAULT_DATE_LABEL})
              </span>
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 rounded-lg border border-slate-700 bg-slate-950 px-2 text-[11px] text-slate-100 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-300">
              To date
              <span className="ml-1 text-[10px] text-slate-500">
                (MM-dd-yyyy: {DEFAULT_DATE_LABEL})
              </span>
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 rounded-lg border border-slate-700 bg-slate-950 px-2 text-[11px] text-slate-100 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleFilter}
            className="h-8 rounded-lg border border-medical/60 bg-medical/10 px-3 text-[11px] font-semibold text-medical hover:bg-medical/20"
          >
            Apply
          </button>

          <label className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 text-[11px] text-slate-200 hover:border-medical/60 hover:text-medical">
            <span>Excel upload</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
          {fileName && (
            <span className="text-[11px] text-slate-400">{fileName}</span>
          )}
        </div>
      </div>

      <DataTable
        title={cfg.title}
        description="Client-side sort (asc/desc), search, and pagination are applied on the loaded page."
        columns={columns}
        rows={rows}
        editable={cfg.editable}
        onEditRow={cfg.editable ? handleEditRow : undefined}
        className="flex-1 min-h-0"
        tableScrollClassName="h-full"
      />
    </div>
  );
}

