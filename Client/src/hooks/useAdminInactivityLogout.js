import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { clearAdminAuth, getAdminTokenFor } from "../utils/adminAuth";
import { LOGIN_ROUTES } from "../utils/authRouting";

const DEFAULT_IDLE_MS = 60 * 60 * 1000;

export default function useAdminInactivityLogout({
  role,
  apiBase,
  idleMs = DEFAULT_IDLE_MS,
}) {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const isLoggingOutRef = useRef(false);

  const forceLogout = useCallback(async () => {
    if (!role || isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    const token = getAdminTokenFor(role);
    try {
      if (token) {
        await fetch(`${apiBase}/api/auth/admins/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Ignore presence update failures during forced logout.
    }
    try {
      await fetch(`${apiBase}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore backend logout failures; clear local auth anyway.
    }
    clearAdminAuth(role);
    navigate(LOGIN_ROUTES.admin, {
      replace: true,
      state: { forcedLogoutMessage: "You have been logged out due to inactivity for security reasons." },
    });
  }, [apiBase, navigate, role]);

  const resetTimer = useCallback(() => {
    if (!role) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      forceLogout();
    }, idleMs);
  }, [forceLogout, idleMs, role]);

  useEffect(() => {
    if (!role) return undefined;
    const events = ["mousemove", "click", "scroll", "keypress", "app_api_activity"];
    events.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });
    resetTimer();
    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetTimer, role]);
}
