import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AppLayout from "./layout/AppLayout";
import AppOverview from "./pages/AppOverview";
import LoginRecordsPage from "./pages/LoginRecordsPage";
import BreakRecordsPage from "./pages/BreakRecordsPage";
import TimeOnStatusRecordsPage from "./pages/TimeOnStatusRecordsPage";
import TransactionRecordsPage from "./pages/TransactionRecordsPage";
import FormSubmissionRecordsPage from "./pages/FormSubmissionRecordsPage";
import ModMedRecordsPage from "./pages/ModMedRecordsPage";
import NextechRecordsPage from "./pages/NextechRecordsPage";
import RefusedRecordsPage from "./pages/RefusedRecordsPage";
import DeleteReportsPage from "./pages/DeleteReportsPage";

function ProtectedRoute({ children }) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AppOverview />} />
          <Route path="login" element={<LoginRecordsPage />} />
          <Route path="break" element={<BreakRecordsPage />} />
          <Route path="time-on-status" element={<TimeOnStatusRecordsPage />} />
          <Route path="transactions" element={<TransactionRecordsPage />} />
          <Route
            path="form-submissions"
            element={<FormSubmissionRecordsPage />}
          />
          <Route path="modmed" element={<ModMedRecordsPage />} />
          <Route path="nextech" element={<NextechRecordsPage />} />
          <Route path="refused" element={<RefusedRecordsPage />} />
          <Route path="delete-records" element={<DeleteReportsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
