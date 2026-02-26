import { Link, useLocation, useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import signInAnimation from "../../public/Lottie/Login Leady.json";
import { useRef, useState } from "react";
import { setAuth } from "../utils/auth";
import { apiUrl } from "../utils/api";

export default function Login() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^\d{10}$/;
  const navigate = useNavigate();
  const location = useLocation();
  const [loginWith, setLoginWith] = useState("mobile");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [registrationMessage] = useState(location.state?.registrationMessage || "");
  const [logoutMessage] = useState(location.state?.logoutMessage || "");
  const identifierRef = useRef(null);
  const passwordRef = useRef(null);
  const focusField = (ref) => {
    if (!ref?.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    ref.current.focus({ preventScroll: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError("");

    // Field-wise validation + focus on first invalid input.
    const nextErrors = {};
    if (!identifier.trim()) {
      nextErrors.identifier = loginWith === "mobile" ? "Mobile required hai." : "Email required hai.";
    }
    if (!password.trim()) nextErrors.password = "Password required hai.";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.identifier) focusField(identifierRef);
      else if (nextErrors.password) focusField(passwordRef);
      return;
    }

    if (loginWith === "email" && !emailRegex.test(identifier.trim())) {
      setFieldErrors({ identifier: "Valid email address enter karo." });
      focusField(identifierRef);
      return;
    }

    if (loginWith === "mobile") {
      if (!mobileRegex.test(identifier)) {
        setFieldErrors({ identifier: "મોબાઇલ નંબર ચોક્કસ 10 અંકનો હોવો જોઈએ." });
        focusField(identifierRef);
        return;
      }
    }

    setLoading(true);
    try {
      const submitIdentifier = loginWith === "mobile" ? identifier.replace(/\D/g, "").slice(0, 10) : identifier.trim();
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ loginWith, identifier: submitIdentifier, password, remember, loginPortal: "user" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      setAuth(data.token, data.user, remember);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err.message || "Login failed";
      if (msg.toLowerCase().includes("password")) {
        setFieldErrors((prev) => ({ ...prev, password: msg }));
        focusField(passwordRef);
      } else if (msg.toLowerCase().includes("account not found") || msg.toLowerCase().includes("email") || msg.toLowerCase().includes("mobile")) {
        setFieldErrors((prev) => ({ ...prev, identifier: msg }));
        focusField(identifierRef);
      } else {
        setFormError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-72px)] bg-[#fff6e5] flex items-center justify-center px-4 py-12">
      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 rgba(253,224,71,0.0); }
          50% { box-shadow: 0 0 24px rgba(253,224,71,0.35); }
          100% { box-shadow: 0 0 0 rgba(253,224,71,0.0); }
        }
        @keyframes shimmerLine {
          0% { transform: translateX(-40%); opacity: 0.2; }
          50% { transform: translateX(20%); opacity: 0.6; }
          100% { transform: translateX(80%); opacity: 0.2; }
        }
      `}</style>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left panel */}
        <div className="relative hidden md:flex flex-col justify-center rounded-3xl border border-[#7a1f1f]/20 bg-white/90 p-10 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 -left-16 h-52 w-52 rounded-full bg-yellow-300/20 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-[#7a1f1f]/15 blur-3xl" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-serif text-[#7a1f1f] tracking-wide">
              Welcome Back
            </h2>
            <p className="mt-3 text-[#7a1f1f]/80">
              Dholakiya Parivar portal ma login karo ane community updates ni
              full access lo.
            </p>
            <div className="mt-4">
              <Lottie
                animationData={signInAnimation}
                loop={true}
                className="w-52 h-52"
              />
            </div>
            <div className="mt-4 h-3 w-28 bg-yellow-400/80 rounded-full" />
          </div>
        </div>

        {/* Form */}
        <div className="rounded-3xl bg-white p-8 md:p-10 border border-[#7a1f1f]/15 shadow-2xl animate-[pulseGlow_6s_ease-in-out_infinite] relative overflow-hidden">
          <div className="absolute -top-10 left-0 h-1 w-full bg-yellow-400/60 animate-[shimmerLine_6s_ease-in-out_infinite]" />
          <h3 className="text-2xl font-semibold text-[#7a1f1f]">Login</h3>
          <p className="mt-1 text-sm text-[#7a1f1f]/70">
            Continue to your account
          </p>
          {registrationMessage && (
            <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {registrationMessage}
            </div>
          )}
          {logoutMessage && (
            <div className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {logoutMessage}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-[#7a1f1f]/80">
                Login With
              </label>
              <select
                value={loginWith}
                onChange={(e) => {
                  setLoginWith(e.target.value);
                  setIdentifier("");
                  setFieldErrors({});
                  setFormError("");
                }}
                className="mt-2 w-full rounded-xl border border-[#7a1f1f]/20 bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40"
              >
                <option value="mobile">Mobile (Default)</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#7a1f1f]/80">
                {loginWith === "mobile" ? "Mobile Number" : "Email"}
              </label>
              {loginWith === "mobile" ? (
                <div className={`mt-2 flex items-center rounded-xl border bg-[#fff6e5]/60 ${fieldErrors.identifier ? "border-red-500" : "border-[#7a1f1f]/20"} focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-300/40`}>
                  <span className="px-3 text-[#7a1f1f]/80 font-medium border-r border-[#7a1f1f]/15">+91</span>
                  <input
                    ref={identifierRef}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="9XXXXXXXXX"
                    value={identifier}
                    maxLength={10}
                    onChange={(e) => setIdentifier(String(e.target.value || "").replace(/\D/g, "").slice(0, 10))}
                    className="w-full rounded-r-xl bg-transparent px-4 py-3 outline-none"
                  />
                </div>
              ) : (
                <input
                  ref={identifierRef}
                  type="email"
                  placeholder="you@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className={`mt-2 w-full rounded-xl border bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40 ${fieldErrors.identifier ? "border-red-500" : "border-[#7a1f1f]/20"
                    }`}
                />
              )}
              {fieldErrors.identifier && <p className="mt-1 text-xs text-red-600">{fieldErrors.identifier}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-[#7a1f1f]/80">
                Password
              </label>
              <input
                ref={passwordRef}
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-2 w-full rounded-xl border bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40 ${fieldErrors.password ? "border-red-500" : "border-[#7a1f1f]/20"
                  }`}
              />
              {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[#7a1f1f]/70">
                <input
                  type="checkbox"
                  className="accent-[#7a1f1f]"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-[#7a1f1f] hover:text-yellow-500 cursor-pointer">
                Forgot password?
              </Link>
            </div>

            {formError && <div className="text-sm text-red-600">{formError}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#7a1f1f] text-white py-3 font-semibold transition hover:translate-y-[-1px] hover:shadow-[0_10px_20px_rgba(122,31,31,0.25)]"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-sm text-[#7a1f1f]/70">
            New here?{" "}
            <Link to="/register" className="text-[#7a1f1f] font-semibold hover:text-yellow-500">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
