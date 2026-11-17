import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { PageSkeleton } from "./ui/feedback.jsx";

export function ProtectedRoute({ children }) {
  const { firebaseUser, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageSkeleton />;
  if (!firebaseUser) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
export function ModeratorRoute({ children }) {
  const { firebaseUser, profile, isModerator, loading } = useAuth();
  const location = useLocation();
  if (loading || (firebaseUser && !profile)) return <PageSkeleton />;
  if (!firebaseUser) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isModerator) return <Navigate to="/" replace />;
  return children;
}
