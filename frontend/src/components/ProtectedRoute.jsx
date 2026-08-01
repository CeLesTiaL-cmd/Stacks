import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute({ children }) {
  const { firebaseUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="px-4 py-20 text-center text-muted">Loading…</div>;

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function ModeratorRoute({ children }) {
  const { firebaseUser, isModerator, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="px-4 py-20 text-center text-muted">Loading…</div>;

  if (!firebaseUser) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isModerator) return <Navigate to="/" replace />;

  return children;
}
