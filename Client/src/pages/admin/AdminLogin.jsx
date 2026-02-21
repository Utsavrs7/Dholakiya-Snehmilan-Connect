import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import { setAdminAuth, clearAdminAuth, setActiveAdminRole } from "../../utils/adminAuth";
import signInAnimation from "../../../public/Lottie/sign in.json";
import profileAnimation from "../../../public/Lottie/profile.json";
import girlProfileAnimation from "../../../public/Lottie/girlProfile.json";
import loginLadyAnimation from "../../../public/Lottie/Login Leady.json";

const FORCED_LOGOUT_MESSAGE_KEY = "admin_forced_logout_message";
const ROLE_OPTIONS = [
  {
    value: "super_admin",
    label: "Super Admin",
    hint: "Full control over villages, results, approvals",
  },
  {
    value: "village_admin",
    label: "Village Admin",
    hint: "Village-specific dashboard and reviews",
  },
];

const preloadDashboardByRole = async (role) => {
  if (role === "super_admin") {
    await import("./SuperAdminDashboard");
    return;
  }
  if (role === "village_admin") {
    await import("./VillageAdminDashboard");
  }
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const API = import.meta.env.VITE_API_URL;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("super_admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedRoleMeta = useMemo(
    () => ROLE_OPTIONS.find((r) => r.value === selectedRole) || ROLE_OPTIONS[0],
    [selectedRole]
  );

  // Do not auto-redirect on load; always show login screen first
  useEffect(() => {
    const stateMessage = location.state?.forcedLogoutMessage;
    const storedMessage = sessionStorage.getItem(FORCED_LOGOUT_MESSAGE_KEY);
    const message = stateMessage || storedMessage;
    if (message) {
      setError(message);
      sessionStorage.removeItem(FORCED_LOGOUT_MESSAGE_KEY);
    }
    return () => {};
  }, [location.state?.forcedLogoutMessage]);

  useEffect(() => {
    const queryRole = new URLSearchParams(location.search).get("role");
    if (queryRole === "super_admin" || queryRole === "village_admin") {
      setSelectedRole(queryRole);
    }
  }, [location.search]);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    const params = new URLSearchParams(location.search);
    params.set("role", role);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          loginWith: "email",
          identifier: email.trim(),
          email: email.trim(),
          password,
          loginPortal: "admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      const role = String(data?.user?.role || "").toLowerCase();
      if (!["super_admin", "village_admin"].includes(role)) {
        clearAdminAuth();
        setError("Admin access denied.");
        return;
      }

      if (role !== selectedRole) {
        clearAdminAuth();
        setError(
          `Selected role ${selectedRoleMeta.label} hai, par account role ${role === "super_admin" ? "Super Admin" : "Village Admin"} hai.`
        );
        return;
      }

      // Save admin auth and redirect based on role
      await preloadDashboardByRole(role);
      setAdminAuth(data.token, data.user, true);
      setActiveAdminRole(role);
      if (role === "super_admin") {
        navigate("/admin/super", { replace: true });
        return;
      }
      if (role === "village_admin") {
        navigate("/admin/village", { replace: true });
        return;
      }

      // Block non-admin users from admin area
      clearAdminAuth();
      setError("Admin access denied.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#071427] px-4 py-8 md:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.24),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.2),transparent_42%)]" />
      <div className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-[#244267] bg-[#0a1b33]/92 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur-sm">
        <div className="grid md:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-gradient-to-b from-[#f2f8ff] to-[#e8f2ff] p-6 md:p-8">
            <p className="inline-flex rounded-full border border-[#6fa9df] bg-white px-3 py-1 text-[11px] tracking-[0.2em] text-[#2b5b8a]">
              ADMIN CONTROL
            </p>
            <h1 className="mt-4 text-3xl font-extrabold text-[#143a63] md:text-4xl">Secure Login</h1>
            <p className="mt-2 text-sm text-[#456d94]">Role select karo aur direct role dashboard pe jao.</p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleChange(role.value)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    selectedRole === role.value
                      ? "border-[#2b6fb0] bg-[#dff0ff] shadow-[0_8px_20px_rgba(43,111,176,0.2)]"
                      : "border-[#c2daf3] bg-white hover:border-[#2b6fb0]/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 overflow-hidden rounded-lg border border-[#c9ddf3] bg-white">
                      <Lottie
                        animationData={role.value === "super_admin" ? profileAnimation : girlProfileAnimation}
                        loop
                        className="h-full w-full"
                      />
                    </div>
                    <p className="text-sm font-semibold text-[#173d67]">{role.label}</p>
                  </div>
                  <p className="mt-1 text-xs text-[#456d94]">{role.hint}</p>
                </button>
              ))}
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-[#1c456f]">Email</label>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#c3d9f0] bg-white px-4 py-3 text-[#173d67] outline-none transition placeholder:text-[#7da0c4] focus:border-[#2b6fb0] focus:ring-2 focus:ring-[#2b6fb0]/20"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#1c456f]">Password</label>
                <input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#c3d9f0] bg-white px-4 py-3 text-[#173d67] outline-none transition placeholder:text-[#7da0c4] focus:border-[#2b6fb0] focus:ring-2 focus:ring-[#2b6fb0]/20"
                  required
                />
              </div>

              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#1d4f7e] via-[#2674b7] to-[#155ea1] py-3 font-semibold text-white transition hover:translate-y-[-1px] hover:shadow-[0_14px_28px_rgba(38,116,183,0.3)] disabled:opacity-70"
              >
                {loading ? "Signing in..." : `Sign in as ${selectedRoleMeta.label}`}
              </button>
            </form>
          </div>

          <div className="border-t border-[#244267] bg-gradient-to-b from-[#0c1d36] to-[#0a182c] p-6 md:border-l md:border-t-0 md:p-8">
            <div className="rounded-2xl border border-[#335b87] bg-[#112746] p-4">
              <div className="h-[280px] md:h-[360px]">
                <Lottie animationData={loginLadyAnimation} loop className="h-full w-full" />
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[#c6ddf3] bg-[#f1f8ff] p-3">
              <div className="h-24">
                <Lottie animationData={signInAnimation} loop className="h-full w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
