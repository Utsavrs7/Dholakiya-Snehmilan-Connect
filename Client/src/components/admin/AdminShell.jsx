import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  clearAdminAuth,
  getAdminUserFor,
  getAdminTokenFor,
  setActiveAdminRole,
} from "../../utils/adminAuth";
import { FaMoon, FaSun } from "react-icons/fa";
import { getSocket } from "../../utils/realtime";

const FORCED_LOGOUT_MESSAGE_KEY = "admin_forced_logout_message";

export default function AdminShell({ title, roleLabel, children, actions }) {
  const SCROLL_CLOSE_GUARD_MS = 6000;
  const THEME_KEY = "admin_theme";
  const location = useLocation();
  const navigate = useNavigate();
  // Track dropdown open state
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || "light";
    } catch {
      return "light";
    }
  });
  // Dropdown ref for outside click handling
  const dropdownRef = useRef(null);
  const openedAtRef = useRef(0);
  const forcedLogoutRef = useRef(false);

  // Resolve role based on route for correct admin profile
  const role = location.pathname.startsWith("/admin/super")
    ? "super_admin"
    : location.pathname.startsWith("/admin/village")
    ? "village_admin"
    : null;
  // Read logged-in admin profile for dropdown
  const [user, setUser] = useState(role ? getAdminUserFor(role) : null);
  // Build initials for avatar circle
  const initials = useMemo(() => {
    const name = user?.name || "Admin";
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user]);

  // Logout handler for admin dropdown
  const handleLogout = async () => {
    // Update presence on logout
    if (role) {
      try {
        const token = getAdminTokenFor(role);
        await fetch(`${import.meta.env.VITE_API_URL}/api/auth/admins/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore logout presence errors
      }
    }
    clearAdminAuth(role);
    navigate("/admin/login", { replace: true });
  };

  const forceRelogin = (message) => {
    if (forcedLogoutRef.current) return;
    forcedLogoutRef.current = true;
    try {
      sessionStorage.setItem(FORCED_LOGOUT_MESSAGE_KEY, message);
    } catch {
      // Ignore storage errors
    }
    clearAdminAuth(role);
    navigate("/admin/login", {
      replace: true,
      state: { forcedLogoutMessage: message },
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleScrollLike = () => {
      if (Date.now() - openedAtRef.current < SCROLL_CLOSE_GUARD_MS) return;
      setIsOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("scroll", handleScrollLike, true);
      window.addEventListener("wheel", handleScrollLike, { passive: true });
      window.addEventListener("touchmove", handleScrollLike, { passive: true });
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScrollLike, true);
      window.removeEventListener("wheel", handleScrollLike);
      window.removeEventListener("touchmove", handleScrollLike);
    };
  }, [isOpen]);

  // Route change pe profile menu auto-close.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Keep admin profile in sync across refresh/storage changes
  useEffect(() => {
    const refresh = () => {
      if (!role) return;
      setActiveAdminRole(role);
      setUser(getAdminUserFor(role));
    };
    refresh();
    window.addEventListener("admin_auth_changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("admin_auth_changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [role]);

  // Send heartbeat to keep admin active
  useEffect(() => {
    if (!role) return;
    const sendHeartbeat = async () => {
      try {
        const token = getAdminTokenFor(role);
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/admins/heartbeat`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok && res.status === 401) {
          const data = await res.json().catch(() => ({}));
          forceRelogin(
            data.message || "Your admin session expired due to Super Admin changes. Please login again."
          );
        }
      } catch {
        // Ignore heartbeat errors
      }
    };
    sendHeartbeat();
    const id = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(id);
  }, [role]);

  useEffect(() => {
    if (!role) return;
    const current = getAdminUserFor(role);
    const currentId = String(current?.id || "");
    if (!currentId) return;

    const socket = getSocket();
    const handler = (payload = {}) => {
      const targets = Array.isArray(payload.targetAdminIds)
        ? payload.targetAdminIds.map((id) => String(id))
        : [];
      if (!targets.includes(currentId)) return;

      const reasonByAction = {
        deleted: "Your admin account was removed by Super Admin. Contact Super Admin.",
        bulk_deleted: "Your admin account was removed by Super Admin. Contact Super Admin.",
        updated: "Your admin access was changed by Super Admin. Please login again.",
      };
      forceRelogin(
        reasonByAction[payload.action] ||
          payload.message ||
          "Your admin session expired due to Super Admin changes. Please login again."
      );
    };

    socket.on("admin-session:update", handler);
    return () => {
      socket.off("admin-session:update", handler);
    };
  }, [role]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  return (
    <section
      className={`min-h-screen ${
        theme === "dark"
          ? "admin-theme-dark bg-[#0c1530] text-[#e6e8ee]"
          : "bg-[#f6efe3] text-[#2d1b1b]"
      }`}
    >
      <style>{`
        @keyframes adminFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes adminPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .admin-fade-up { animation: adminFadeUp 0.5s ease-out both; }
        .admin-fade-up-2 { animation: adminFadeUp 0.6s ease-out both; }
        .admin-card { border: 1px solid #e6d5c0; box-shadow: 0 8px 24px rgba(58, 31, 31, 0.08); }
        .admin-pulse { animation: adminPulse 2.2s ease-in-out infinite; }
        .theme-switch-track { transition: background-color 250ms ease, border-color 250ms ease; }
        .theme-switch-knob { transition: transform 280ms ease, background-color 280ms ease, color 280ms ease, box-shadow 280ms ease; }
        .admin-theme-dark .modal-backdrop {
          background: rgba(3, 6, 14, 0.78) !important;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Header stays on top for dropdown layering */}
        <div className="relative z-40 flex flex-col md:flex-row md:items-center md:justify-between gap-4 admin-fade-up">
          <div>
            <p className={`text-xs uppercase tracking-[0.25em] ${theme === "dark" ? "text-[#d2ddf7]" : "text-[#7a1f1f]/70"}`}>
              {roleLabel}
            </p>
            <h1 className={`text-2xl md:text-4xl font-semibold ${theme === "dark" ? "text-[#f8fbff]" : "text-[#7a1f1f]"}`}>
              {title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <button
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              className="theme-switch-track relative h-9 w-[86px] rounded-full border border-[#e6d5c0] bg-white px-1"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span
                className={`absolute left-2 top-1/2 -translate-y-1/2 text-[11px] ${
                  theme === "dark" ? "text-[#f59e0b]" : "text-[#f59e0b]"
                }`}
              >
                <FaSun />
              </span>
              <span
                className={`absolute right-2 top-1/2 -translate-y-1/2 text-[11px] ${
                  theme === "dark" ? "text-[#334155]" : "text-[#9ca3af]"
                }`}
              >
                <FaMoon />
              </span>
              <span
                className={`theme-switch-knob absolute top-[3px] flex h-7 w-7 items-center justify-center rounded-full shadow-md ${
                  theme === "dark"
                    ? "translate-x-[47px] bg-[#1e293b] text-[#e2e8f0]"
                    : "translate-x-0 bg-[#fff7e8] text-[#f59e0b]"
                }`}
              >
                {theme === "dark" ? <FaMoon className="text-[11px]" /> : <FaSun className="text-[11px]" />}
              </span>
            </button>
            {/* Profile dropdown */}
            <div className="relative ml-auto" ref={dropdownRef}>
              <button
                onClick={() => {
                  setIsOpen((prev) => {
                    const next = !prev;
                    if (next) openedAtRef.current = Date.now();
                    return next;
                  });
                }}
                className={`relative w-11 h-11 rounded-full border font-bold shadow-sm transition hover:shadow-md hover:scale-[1.03] ${
                  theme === "dark"
                    ? "border-white bg-gradient-to-br from-[#1a2742] to-[#223559] text-[#e6efff]"
                    : "border-black bg-gradient-to-br from-white to-[#fff6e5] text-[#7a1f1f]"
                }`}
                aria-label="Open profile menu"
              >
                {initials}
                {/* Active status dot */}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#16a34a] border-2 ${
                    theme === "dark" ? "border-[#16223a]" : "border-white"
                  }`}
                />
              </button>
              {isOpen && (
                <div
                  className={`absolute right-0 mt-2 w-72 rounded-2xl z-50 overflow-hidden transition-all duration-200 origin-top-right hover:-translate-y-0.5 ${
                    theme === "dark"
                      ? "border border-[#445b87] bg-gradient-to-b from-[#16233b] to-[#1e2f4d] shadow-[0_18px_45px_rgba(4,10,24,0.62)] hover:shadow-[0_22px_50px_rgba(4,10,24,0.72)]"
                      : "border border-[#ead8c4] bg-gradient-to-b from-white to-[#fff8ee] shadow-[0_18px_45px_rgba(58,31,31,0.22)] hover:shadow-[0_22px_50px_rgba(58,31,31,0.28)]"
                  }`}
                >
                  {/* Profile info */}
                  <div
                    className={`px-5 py-4 border-b text-left transition-colors duration-200 ${
                      theme === "dark"
                        ? "border-[#334a73] hover:bg-[#243755]"
                        : "border-[#f1e4d3] hover:bg-[#fff3e1]"
                    }`}
                  >
                    <p
                      className={`text-[11px] uppercase tracking-[0.2em] font-semibold ${
                        theme === "dark" ? "text-[#bcd0f5]/80" : "text-[#7a1f1f]/55"
                      }`}
                    >
                      Signed In As
                    </p>
                    <p
                      className={`mt-1 text-base font-extrabold tracking-[0.01em] ${
                        theme === "dark" ? "text-[#f2f7ff]" : "text-[#7a1f1f]"
                      }`}
                    >
                      {user?.name || "Admin"}
                    </p>
                    <p
                      className={`mt-0.5 text-xs font-semibold tracking-wide ${
                        theme === "dark" ? "text-[#c6d8fb]/90" : "text-[#7a1f1f]/72"
                      }`}
                    >
                      {user?.role || "admin"}
                    </p>
                    {user?.email && (
                      <p
                        className={`mt-2 text-xs font-medium break-all ${
                          theme === "dark" ? "text-[#d7e4ff]/85" : "text-[#7a1f1f]/68"
                        }`}
                      >
                        {user.email}
                      </p>
                    )}
                  </div>
                  {/* Logout action */}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className={`w-full text-left px-5 py-3.5 text-sm font-bold tracking-wide rounded-b-2xl transition-all duration-200 hover:tracking-[0.06em] hover:pl-6 ${
                      theme === "dark"
                        ? "text-[#f6f9ff] hover:bg-[#2a3f62]"
                        : "text-[#7a1f1f] hover:bg-[#fff0da]"
                    }`}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 admin-fade-up-2">{children}</div>
      </div>
    </section>
  );
}
