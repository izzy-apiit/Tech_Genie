import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allow = [] }) {
  const username = localStorage.getItem("username");
  const userRole = localStorage.getItem("role");

  // Not logged in
  if (!username || !userRole) {
    return <Navigate to="/login" replace />;
  }

  // Role not allowed
  if (allow.length > 0 && !allow.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // Access allowed
  return children;
}
