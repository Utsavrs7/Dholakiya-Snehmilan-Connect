import { Navigate } from "react-router-dom";
import {
  getAdminSession,
  getLoginRouteForAllowedRoles,
  isAdminRole,
  normalizeRole,
  getUserSession,
} from "../../utils/authRouting";
import { setActiveAdminRole } from "../../utils/adminAuth";

const getAdminHomeByRole = (role) =>
  normalizeRole(role) === "super_admin" ? "/admin/super" : "/admin/village";

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const normalizedAllowed = allowedRoles.map((role) => normalizeRole(role));
  const allowsAdmin = normalizedAllowed.some((role) => isAdminRole(role));
  const allowsUser = normalizedAllowed.includes("user");
  const userSession = allowsUser ? getUserSession() : null;
  const adminSession = allowsAdmin ? getAdminSession(normalizedAllowed) : null;
  const session = allowsUser ? (userSession || adminSession) : adminSession;

  if (!session) {
    return <Navigate to={getLoginRouteForAllowedRoles(normalizedAllowed)} replace />;
  }

  const sessionRole = normalizeRole(session.user?.role || session.role);
  if (!normalizedAllowed.includes(sessionRole)) {
    if (isAdminRole(sessionRole)) return <Navigate to={getAdminHomeByRole(sessionRole)} replace />;
    return <Navigate to="/dashboard" replace />;
  }

  if (isAdminRole(sessionRole)) {
    setActiveAdminRole(sessionRole);
  }

  return children;
}
