import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./AuthContext";

export function ProtectedRoute() {
  const { loading, session } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-mist text-ink" aria-live="polite">
        <div className="flex items-center gap-3 text-sm font-medium">
          <span className="h-3 w-3 animate-pulse rounded-full bg-coral" />
          Restoring your private space…
        </div>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
