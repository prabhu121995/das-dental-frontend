import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* login page is the landing route */}
        <Route path="/" element={<Login />} />

        {/* additional routes can go here, e.g. dashboards */}

        {/* catch-all: redirect unknown paths back to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
