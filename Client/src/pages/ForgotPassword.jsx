import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  // Step control: first request OTP, then verify OTP + reset password.
  const [step, setStep] = useState("request");
  const channel = "email";
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const identifierRef = useRef(null);
  const otpRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // Step-1 API call: request OTP to email.
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setError("");
    setSuccess("");

    if (!identifier.trim()) {
      const msg = "Email required hai.";
      setFieldErrors({ identifier: msg });
      identifierRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          identifier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP request failed");

      setSuccess(data.message || "OTP bhej diya gaya.");
      setStep("verify");
    } catch (err) {
      const msg = err.message || "OTP request failed";
      if (msg.toLowerCase().includes("account") || msg.toLowerCase().includes("email")) {
        setFieldErrors({ identifier: msg });
        identifierRef.current?.focus();
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step-2 API call: verify OTP and then reset password.
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setError("");
    setSuccess("");

    const nextErrors = {};
    if (!otp.trim()) nextErrors.otp = "OTP required hai.";
    if (!newPassword.trim()) nextErrors.newPassword = "New password required hai.";
    if (!confirmPassword.trim()) nextErrors.confirmPassword = "Confirm password required hai.";
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.otp) otpRef.current?.focus();
      else if (nextErrors.newPassword) newPasswordRef.current?.focus();
      else if (nextErrors.confirmPassword) confirmPasswordRef.current?.focus();
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldErrors({
        newPassword: "Passwords match nahi ho rahe.",
        confirmPassword: "Passwords match nahi ho rahe.",
      });
      confirmPasswordRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          identifier,
          otp,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password reset failed");

      setSuccess("Password reset ho gaya. Ab login karo.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const msg = err.message || "Password reset failed";
      if (msg.toLowerCase().includes("otp")) {
        setFieldErrors({ otp: msg });
        otpRef.current?.focus();
      } else if (msg.toLowerCase().includes("password")) {
        setFieldErrors({ newPassword: msg });
        newPasswordRef.current?.focus();
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-72px)] bg-[#fff6e5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 border border-[#7a1f1f]/15 shadow-2xl">
        <h3 className="text-2xl font-semibold text-[#7a1f1f]">Forgot Password</h3>
        <p className="mt-1 text-sm text-[#7a1f1f]/70">
          Pehle OTP verify karo, fir password reset hoga.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={step === "request" ? handleRequestOtp : handleResetPassword}
        >
          <div>
            <label className="text-sm font-medium text-[#7a1f1f]/80">
              Email
            </label>
            <input
              ref={identifierRef}
              type="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com"
              className={`mt-2 w-full rounded-xl border bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40 ${
                fieldErrors.identifier ? "border-red-500" : "border-[#7a1f1f]/20"
              }`}
            />
            {fieldErrors.identifier && <p className="mt-1 text-xs text-red-600">{fieldErrors.identifier}</p>}
          </div>

          {step === "verify" && (
            <>
              <div>
                <label className="text-sm font-medium text-[#7a1f1f]/80">OTP</label>
                <input
                  ref={otpRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className={`mt-2 w-full rounded-xl border bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40 ${
                    fieldErrors.otp ? "border-red-500" : "border-[#7a1f1f]/20"
                  }`}
                />
                {fieldErrors.otp && <p className="mt-1 text-xs text-red-600">{fieldErrors.otp}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-[#7a1f1f]/80">New Password</label>
                <input
                  ref={newPasswordRef}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`mt-2 w-full rounded-xl border bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40 ${
                    fieldErrors.newPassword ? "border-red-500" : "border-[#7a1f1f]/20"
                  }`}
                />
                {fieldErrors.newPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.newPassword}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-[#7a1f1f]/80">Confirm Password</label>
                <input
                  ref={confirmPasswordRef}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`mt-2 w-full rounded-xl border bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40 ${
                    fieldErrors.confirmPassword ? "border-red-500" : "border-[#7a1f1f]/20"
                  }`}
                />
                {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>}
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#7a1f1f] text-white py-3 font-semibold transition hover:translate-y-[-1px] hover:shadow-[0_10px_20px_rgba(122,31,31,0.25)]"
          >
            {loading
              ? "Please wait..."
              : step === "request"
              ? "Send OTP"
              : "Verify OTP & Reset Password"}
          </button>

          {step === "verify" && (
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
                setError("");
                setSuccess("");
                setFieldErrors({});
              }}
              className="w-full rounded-xl border border-[#7a1f1f]/30 text-[#7a1f1f] py-3 font-semibold transition hover:bg-[#fff6e5]"
            >
              Change Email
            </button>
          )}
        </form>

        <div className="mt-6 text-sm text-[#7a1f1f]/70">
          Back to{" "}
          <Link to="/login" className="text-[#7a1f1f] font-semibold hover:text-yellow-500">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
