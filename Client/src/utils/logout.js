import { clearAuth } from "./auth";
import { clearAdminAuth } from "./adminAuth";
import { getLoginRouteForRole, normalizeRole } from "./authRouting";

export const logoutByRole = async ({
  role,
  apiBase,
  adminRole,
}) => {
  const normalizedRole = normalizeRole(role || adminRole);
  const isAdmin = normalizedRole === "super_admin" || normalizedRole === "village_admin";

  try {
    if (isAdmin && adminRole) {
      const token =
        localStorage.getItem(`admin_${adminRole}_token`) ||
        sessionStorage.getItem(`admin_${adminRole}_token`);
      if (token) {
        await fetch(`${apiBase}/api/auth/admins/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
  } catch {
    // Ignore presence update errors.
  }

  try {
    await fetch(`${apiBase}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore API errors; still clear client-side session.
  }

  if (isAdmin) {
    clearAdminAuth(adminRole || normalizedRole);
  } else {
    clearAuth();
  }

  return getLoginRouteForRole(normalizedRole);
};
