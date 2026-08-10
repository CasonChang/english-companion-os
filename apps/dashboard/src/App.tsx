import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sessions" element={<PlaceholderPage kind="sessions" />} />
          <Route path="/items" element={<PlaceholderPage kind="items" />} />
          <Route path="/mistakes" element={<PlaceholderPage kind="mistakes" />} />
          <Route path="/progress" element={<PlaceholderPage kind="progress" />} />
          <Route path="/review" element={<PlaceholderPage kind="review" />} />
          <Route path="/weekly" element={<PlaceholderPage kind="weekly" />} />
          <Route path="/more" element={<PlaceholderPage kind="more" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
