import { Routes, Route, Navigate } from "react-router-dom";
import PublicQuote from "./pages/PublicQuote";
import StaffQuote from "./pages/StaffQuote";
import StaffLogin from "./pages/StaffLogin";
import AdminConfig from "./pages/AdminConfig";

function RequireStaff({ children }) {
  const token = localStorage.getItem("staff_token");
  if (!token) return <Navigate to="/staff/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem("staff_token");
  const role = localStorage.getItem("staff_role");
  if (!token) return <Navigate to="/staff/login" replace />;
  if (role !== "admin") return <Navigate to="/staff" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicQuote />} />
      <Route path="/staff/login" element={<StaffLogin />} />
      <Route
        path="/staff/*"
        element={
          <RequireStaff>
            <StaffQuote />
          </RequireStaff>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminConfig />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
