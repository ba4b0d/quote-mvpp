import { Routes, Route, Navigate } from "react-router-dom";
import PublicQuote from "./pages/PublicQuote";
import StaffQuote from "./pages/StaffQuote";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicQuote />} />
      <Route path="/staff/*" element={<StaffQuote />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
