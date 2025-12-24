import { Routes, Route, Navigate } from "react-router-dom";
import PublicQuote from "./pages/PublicQuote";
import StaffQuote from "./pages/StaffQuote";
import StaffLogin from "./pages/StaffLogin";

function RequireStaff({ children }) {
  const token = localStorage.getItem("staff_token");
  if (!token) return <Navigate to="/staff/login" replace />;
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
