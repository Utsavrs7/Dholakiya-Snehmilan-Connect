import { Link, useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import signInAnimation from "../../public/Lottie/Login Leady.json";
import extraAnimation from "../../public/Lottie/sign in.json";
import { useRef, useState, useMemo } from "react";
import { capitalizeWords } from "../utils/format";
import { convertFullNameToGujarati, convertVillageToGujarati } from "../utils/nameConverter";
import GujaratiInput from "../components/GujaratiInput";
import { VILLAGE_OPTIONS } from "../constants/villageOptions";

export default function Register() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^(\+91\d{10}|\d{10})$/;
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const [firstName, setFirstName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [mobile, setMobile] = useState("");
  const [village, setVillage] = useState("");
  const [villageOther, setVillageOther] = useState("");
  const [gender, setGender] = useState("Male");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const firstNameRef = useRef(null);
  const fatherNameRef = useRef(null);
  const mobileRef = useRef(null);
  const villageRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  // Calculate Gujarati full name
  const gujaratiFullName = useMemo(() => {
    if (firstName && fatherName) {
      // Names might be in English or Gujarati (from GujaratiInput)
      // convertFullNameToGujarati handles both now
      return convertFullNameToGujarati(firstName, fatherName);
    }
    return "";
  }, [firstName, fatherName]);

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
    if (!firstName.trim()) nextErrors.firstName = "Your Name required hai.";
    if (!fatherName.trim()) nextErrors.fatherName = "Father Name required hai.";
    if (!mobile.trim()) nextErrors.mobile = "Mobile Number required hai.";
    if (!village.trim()) nextErrors.village = "Village required hai.";
    if (village === "other" && !villageOther.trim()) nextErrors.villageOther = "Custom Village name required hai.";
    if (!email.trim()) nextErrors.email = "Email required hai.";
    if (!password.trim()) nextErrors.password = "Password required hai.";
    if (!confirm.trim()) nextErrors.confirm = "Confirm Password required hai.";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.firstName) focusField(firstNameRef);
      else if (nextErrors.fatherName) focusField(fatherNameRef);
      else if (nextErrors.mobile) focusField(mobileRef);
      else if (nextErrors.village) focusField(villageRef);
      else if (nextErrors.villageOther) focusField(villageRef);
      else if (nextErrors.email) focusField(emailRef);
      else if (nextErrors.password) focusField(passwordRef);
      else if (nextErrors.confirm) focusField(confirmRef);
      return;
    }

    const compactMobile = mobile.trim().replace(/\s+/g, "");
    if (!mobileRegex.test(compactMobile)) {
      setFieldErrors({ mobile: "Mobile format: +91XXXXXXXXXX ya 10 digit number." });
      focusField(mobileRef);
      return;
    }

    if (!emailRegex.test(email.trim())) {
      setFieldErrors({ email: "Valid email address enter karo." });
      focusField(emailRef);
      return;
    }

    if (password.trim().length < 6) {
      setFieldErrors({ password: "Password minimum 6 characters ka hona chahiye." });
      focusField(passwordRef);
      return;
    }

    if (password !== confirm) {
      setFieldErrors({
        password: "Passwords match nahi ho rahe.",
        confirm: "Passwords match nahi ho rahe.",
      });
      focusField(confirmRef);
      return;
    }

    setLoading(true);
    try {
      // Prepare village in Gujarati
      const finalVillage = village === "other"
        ? convertVillageToGujarati(capitalizeWords(villageOther))
        : village;

      // Create full name in Gujarati format
      const fullName = gujaratiFullName;

      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          firstName,
          fatherName,
          email,
          password,
          mobile,
          gender,
          village: finalVillage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Register failed");
      navigate("/login", {
        state: {
          registrationMessage:
            data.message ||
            (data.accountStatus === "pending"
              ? "Account created. Your profile is pending admin approval."
              : "Account created. You can login now."),
        },
      });
    } catch (err) {
      const msg = err.message || "Register failed";
      if (msg.toLowerCase().includes("mobile")) {
        setFieldErrors((prev) => ({ ...prev, mobile: msg }));
        focusField(mobileRef);
      } else if (msg.toLowerCase().includes("email")) {
        setFieldErrors((prev) => ({ ...prev, email: msg }));
        focusField(emailRef);
      } else if (msg.toLowerCase().includes("password")) {
        setFieldErrors((prev) => ({ ...prev, password: msg }));
        focusField(passwordRef);
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
        {/* Form */}
        <div className="rounded-3xl bg-white p-8 md:p-10 border border-[#7a1f1f] shadow-2xl animate-[pulseGlow_6s_ease-in-out_infinite] relative">
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            <div className="absolute -top-10 left-0 h-1 w-full bg-yellow-400/60 animate-[shimmerLine_6s_ease-in-out_infinite]" />
          </div>
          <h3 className="text-2xl font-semibold text-[#7a1f1f]">Register</h3>
          <p className="mt-1 text-sm text-[#7a1f1f]/70">
            Create your community account
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-[#7a1f1f]/80">
                Your Name (English me likho, Gujarati aayega)
              </label>
              <div className="relative z-50">
                <GujaratiInput
                  inputRef={firstNameRef}
                  name="firstName"
                  placeholder="Your name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`mt-2 w-full rounded-xl border bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40 ${fieldErrors.firstName ? "border-red-500" : "border-[#7a1f1f]/20"
                    }`}
                />
              </div>
              {fieldErrors.firstName && <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-[#7a1f1f]/80">
                Father Name (English me likho, Gujarati aayega)
              </label>
              <div className="relative z-40">
                <GujaratiInput
                  inputRef={fatherNameRef}
                  name="fatherName"
                  placeholder="Father name"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className={`mt-2 w-full rounded-xl border bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40 ${fieldErrors.fatherName ? "border-red-500" : "border-[#7a1f1f]/20"
                    }`}
                />
              </div>
              {fieldErrors.fatherName && <p className="mt-1 text-xs text-red-600">{fieldErrors.fatherName}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-[#7a1f1f]/80">
                Full Name (Gujarati)
              </label>
              <input
                type="text"
                value={gujaratiFullName}
                readOnly
                placeholder="Full name will appear here in Gujarati"
                className="mt-2 w-full cursor-not-allowed rounded-xl border border-[#7a1f1f]/20 bg-[#fff6e5]/60 px-4 py-3 text-[#7a1f1f]/70"
              />
              <p className="mt-1 text-xs text-[#7a1f1f]/60">
                Format: ધોળકિયા + Name + Father Name
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-[#7a1f1f]/80">
                Mobile Number
              </label>
              <input
                ref={mobileRef}
                type="tel"
                placeholder="+91 9XXXXXXXXX"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className={`mt-2 w-full rounded-xl border bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40 ${fieldErrors.mobile ? "border-red-500" : "border-[#7a1f1f]/20"
                  }`}
              />
              {fieldErrors.mobile && <p className="mt-1 text-xs text-red-600">{fieldErrors.mobile}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-[#7a1f1f]/80 mb-2 block">
                Gender
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={gender === "Male"}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-5 h-5 text-[#7a1f1f] focus:ring-[#7a1f1f]"
                  />
                  <span className="text-[#7a1f1f]">Male</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={gender === "Female"}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-5 h-5 text-[#7a1f1f] focus:ring-[#7a1f1f]"
                  />
                  <span className="text-[#7a1f1f]">Female</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#7a1f1f]/80">
                Village (મૂળ વતન)
              </label>
              <select
                ref={villageRef}
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className={`mt-2 w-full rounded-xl border bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40 ${fieldErrors.village ? "border-red-500" : "border-[#7a1f1f]/20"
                  }`}
              >
                <option value="">Select Village</option>
                {VILLAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldErrors.village && <p className="mt-1 text-xs text-red-600">{fieldErrors.village}</p>}
            </div>

            {village === "other" && (
              <div>
                <label className="text-sm font-medium text-[#7a1f1f]/80">
                  Enter Custom Village Name
                </label>
                <input
                  type="text"
                  placeholder="Enter village name"
                  value={villageOther}
                  onChange={(e) => setVillageOther(capitalizeWords(e.target.value))}
                  className={`mt-2 w-full rounded-xl border bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40 ${fieldErrors.villageOther ? "border-red-500" : "border-[#7a1f1f]/20"
                    }`}
                />
                {fieldErrors.villageOther && <p className="mt-1 text-xs text-red-600">{fieldErrors.villageOther}</p>}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-[#7a1f1f]/80">
                Email
              </label>
              <input
                ref={emailRef}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-2 w-full rounded-xl border bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40 ${fieldErrors.email ? "border-red-500" : "border-[#7a1f1f]/20"
                  }`}
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-[#7a1f1f]/80">
                Password
              </label>
              <input
                ref={passwordRef}
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-2 w-full rounded-xl border bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40 ${fieldErrors.password ? "border-red-500" : "border-[#7a1f1f]/20"
                  }`}
              />
              {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-[#7a1f1f]/80">
                Confirm Password
              </label>
              <input
                ref={confirmRef}
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`mt-2 w-full rounded-xl border bg-[#fff6e5]/60 px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300/40 ${fieldErrors.confirm ? "border-red-500" : "border-[#7a1f1f]/20"
                  }`}
              />
              {fieldErrors.confirm && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirm}</p>}
            </div>

            {formError && <div className="text-sm text-red-600">{formError}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#7a1f1f] text-white py-3 font-semibold transition hover:translate-y-[-1px] hover:shadow-[0_10px_20px_rgba(122,31,31,0.25)]"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-sm text-[#7a1f1f]/70">
            Already have an account?{" "}
            <Link to="/login" className="text-[#7a1f1f] font-semibold hover:text-yellow-500">
              Sign in
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-[#7a1f1f]/70">
            <div className="rounded-xl border border-[#7a1f1f]/15 bg-[#fff6e5]/70 p-3 text-center">
              Safe & Secure
            </div>
            <div className="rounded-xl border border-[#7a1f1f]/15 bg-[#fff6e5]/70 p-3 text-center">
              Verified Access
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="relative hidden md:flex flex-col rounded-3xl border border-[#7a1f1f]/10 bg-white/90 p-14 shadow-xl overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -left-16 h-30 w-52 rounded-full bg-yellow-300/20 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-[#7a1f1f]/15 blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <h2 className="text-3xl font-serif text-[#7a1f1f] tracking-wide">
              Join the Family
            </h2>
            <p className="mt-3 text-[#7a1f1f]/80">
              Parivar ni ekta ne majboot banava tame pan amara sangathan no
              hissa bano.
            </p>
            <div className="mt-4">
              <Lottie
                animationData={signInAnimation}
                loop={true}
                className="w-52 h-52"
              />
            </div>
            <div className="mt-4 h-3 w-28 bg-yellow-400/80 rounded-full" />
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#7a1f1f]/15 bg-[#fff6e5]/70 p-3 text-sm text-[#7a1f1f]/80">
                Trusted Community
              </div>
              <div className="rounded-2xl border border-[#7a1f1f]/15 bg-[#fff6e5]/70 p-3 text-sm text-[#7a1f1f]/80">
                Secure Access
              </div>
            </div>
            <div className="mt-6 flex-1">
              <Lottie
                animationData={extraAnimation}
                loop={true}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

