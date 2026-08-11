import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { SessionDetailPage } from "./pages/SessionDetailPage";
import { SessionsPage } from "./pages/SessionsPage";
import { LearningItemDetailPage } from "./pages/LearningItemDetailPage";
import { LearningItemsPage } from "./pages/LearningItemsPage";
import { MistakeCategoryPage } from "./pages/MistakeCategoryPage";
import { MistakesPage } from "./pages/MistakesPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
          <Route path="/items" element={<LearningItemsPage />} />
          <Route path="/items/:id" element={<LearningItemDetailPage />} />
          <Route path="/mistakes" element={<MistakesPage />} />
          <Route path="/mistakes/:category" element={<MistakeCategoryPage />} />
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
