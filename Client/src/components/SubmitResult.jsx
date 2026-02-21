import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import { FaArrowLeft, FaClipboardCheck, FaHourglassHalf, FaSearch, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import trophyAnimation from "../../public/Lottie/Trophy.json";
import { clearAuth, getToken, getUser } from "../utils/auth";
import { getAdminTokenFor, getAdminUserFor } from "../utils/adminAuth";
import { capitalizeWords } from "../utils/format";
import { convertFullNameToGujarati, convertVillageToGujarati } from "../utils/nameConverter";
import GujaratiInput from "./GujaratiInput";
import CustomSelect from "./CustomSelect";
import { getResultStatusMeta, getSubmittedByLabel } from "../utils/resultStatus";
import { VILLAGE_OPTIONS } from "../constants/villageOptions";

const INITIAL_FORM_DATA = {
  studentName: "",
  fatherName: "",
  fullName: "",
  mobile: "",
  email: "",
  standard: "",
  standardOther: "",
  semester: "",
  totalMarks: "",
  obtainMarks: "",
  percentage: "",
  medium: "",
  village: "",
  villageOther: "",
  result_details: "",
  photo: null,
};

const FIELD_CLASS =
  "w-full max-w-fullbox-border p-3 rounded-lg border border-[#7a1f1f]/30 bg-white/50 focus:bg-white focus:border-[#7a1f1f] focus:ring-1 focus:ring-[#7a1f1f] focus:outline-none transition-all duration-200 placeholder-[#7a1f1f]/40 text-[#7a1f1f]";
const FILE_CLASS =
  "w-full p-2 rounded-lg border border-[#7a1f1f]/30 bg-white/50 focus:border-[#7a1f1f] focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#7a1f1f]/10 file:text-[#7a1f1f] hover:file:bg-[#7a1f1f]/20";

const STANDARD_OPTIONS = [
  "J.K.G",
  "S.K.G",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th (Science)",
  "11th (Commerce)",
  "11th (Arts)",
  "12th (Science)",
  "12th (Commerce)",
  "12th (Arts)",
  "Diploma",
  "B.A",
  "B.Com",
  "B.Sc",
  "BSc IT",
  "BBA",
  "BCA",
  "M.A",
  "M.Com",
  "M.Sc",
  "MSc IT",
  "MBA",
  "MCA",
  "Other",
];

const COLLEGE_STANDARDS = new Set([
  "Diploma",
  "B.A",
  "B.Com",
  "B.Sc",
  "BSc IT",
  "BBA",
  "BCA",
  "M.A",
  "M.Com",
  "M.Sc",
  "MSc IT",
  "MBA",
  "MCA",
]);

const SEMESTER_OPTIONS = ["2", "4", "6", "8", "10", "Degree"];
const STEP_LABELS = {
  submitted: "Submitted",
  pending: "Pending",
  reviewed: "Reviewed",
  accepted: "Accepted",
  rejected: "Rejected",
};
const STEP_ICONS = {
  submitted: FaClipboardCheck,
  pending: FaHourglassHalf,
  reviewed: FaSearch,
  accepted: FaCheckCircle,
  rejected: FaTimesCircle,
};
const STEP_COLORS = {
  submitted: "#7c3aed",
  pending: "#d97706",
  reviewed: "#2563eb",
  accepted: "#16a34a",
  rejected: "#dc2626",
};

const getResultTimeMs = (item) => {
  const created = new Date(item?.createdAt || 0).getTime();
  if (!Number.isNaN(created) && created > 0) return created;
  const updated = new Date(item?.updatedAt || 0).getTime();
  if (!Number.isNaN(updated) && updated > 0) return updated;
  return 0;
};

const validateForm = (data, requiresSemester) => {
  const missing = [];
  if (!data.studentName.trim()) missing.push("Student Name");
  if (!data.fatherName.trim()) missing.push("Father Name");
  if (!data.mobile.trim()) missing.push("Mobile Number");
  if (!data.email.trim()) missing.push("Email");
  if (!data.standard) missing.push("Standard");
  if (data.standard === "Other" && !data.standardOther.trim()) missing.push("Custom Standard");
  if (requiresSemester && !data.semester) missing.push("Semester");
  if (!data.totalMarks.trim()) missing.push("Total Marks");
  if (!data.obtainMarks.trim()) missing.push("Obtain Marks");
  if (!data.percentage.trim()) missing.push("Percentage");
  if (!data.medium) missing.push("Medium");
  if (!data.village.trim()) missing.push("Village");
  if (data.village === "other" && !data.villageOther.trim()) missing.push("Custom Village");
  if (!data.photo) missing.push("Photo");

  if (missing.length) return missing;

  if (!/^[0-9]{10}$/.test(data.mobile)) {
    return ["Mobile number 10 digits ka hona chahiye"];
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return ["Valid email enter karo"];
  }

  const totalMarks = Number.parseFloat(data.totalMarks);
  const obtainMarks = Number.parseFloat(data.obtainMarks);
  if (Number.isNaN(totalMarks) || totalMarks <= 0) {
    return ["Valid total marks enter karo"];
  }
  if (Number.isNaN(obtainMarks) || obtainMarks < 0) {
    return ["Valid obtain marks enter karo"];
  }
  if (obtainMarks > totalMarks) {
    return ["Obtain marks total marks se jyada nahi ho sakta"];
  }

  const percentage = Number.parseFloat(data.percentage);
  if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
    return ["Percentage 0-100 ke beech hona chahiye"];
  }

  return [];
};

export default function SubmitResult({ adminModeRole = "" }) {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const isAdminMode = adminModeRole === "village_admin" || adminModeRole === "super_admin";
  const adminProfile = isAdminMode ? getAdminUserFor(adminModeRole) : null;
  const isVillageAdminMode = adminModeRole === "village_admin";
  const adminTheme = useMemo(() => {
    if (!isAdminMode) return "light";
    try {
      return localStorage.getItem("admin_theme") || "light";
    } catch {
      return "light";
    }
  }, [isAdminMode]);
  const REJECTED_LOGOUT_MESSAGE =
    "Aapka account reject kiya gaya hai. Kripya sahi details ke saath naya account banakar phir se apply karo.";
  const DELETED_LOGOUT_MESSAGE =
    "Aapka account remove kar diya gaya hai. Kripya sahi details ke saath naya account banakar phir se apply karo.";

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [myResults, setMyResults] = useState([]);
  const [selectedResultId, setSelectedResultId] = useState("");
  const [tracking, setTracking] = useState(null);
  const [forceFormMode, setForceFormMode] = useState(false);
  const forceFormModeRef = useRef(false);
  const [accountStatus, setAccountStatus] = useState(
    isAdminMode ? "active" : (getUser()?.accountStatus || "active").toLowerCase()
  );

  const getAuthContext = () => {
    if (isAdminMode) {
      return {
        token: getAdminTokenFor(adminModeRole),
      };
    }
    return {
      token: getToken(),
    };
  };

  useEffect(() => {
    forceFormModeRef.current = forceFormMode;
  }, [forceFormMode]);

  // Calculate Gujarati full name
  const gujaratiFullName = useMemo(() => {
    // Since names are now directly in Gujarati (or mixed), we pass them directly
    if (formData.studentName && formData.fatherName) {
      return convertFullNameToGujarati(
        formData.studentName,
        formData.fatherName
      );
    }
    return "";
  }, [formData.studentName, formData.fatherName]);

  // Auto-calculate percentage when marks change
  useEffect(() => {
    const totalMarks = Number.parseFloat(formData.totalMarks);
    const obtainMarks = Number.parseFloat(formData.obtainMarks);

    if (!isNaN(totalMarks) && !isNaN(obtainMarks) && totalMarks > 0) {
      const percentage = (obtainMarks / totalMarks) * 100;
      setFormData(prev => ({
        ...prev,
        percentage: percentage.toFixed(2)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        percentage: ""
      }));
    }
  }, [formData.totalMarks, formData.obtainMarks]);

  const showSemester = useMemo(
    () => COLLEGE_STANDARDS.has(formData.standard),
    [formData.standard]
  );

  const showStandardOther = useMemo(
    () => formData.standard === "Other",
    [formData.standard]
  );

  const showVillageOther = useMemo(
    () => formData.village === "other",
    [formData.village]
  );

  const forceLogoutToLogin = (message) => {
    clearAuth();
    navigate("/login", {
      replace: true,
      state: { logoutMessage: message },
    });
  };

  useEffect(() => {
    const { token } = getAuthContext();
    if (!token) {
      navigate(isAdminMode ? "/admin/login" : "/login");
      return;
    }

  }, [API, navigate, adminModeRole]);

  useEffect(() => {
    const onBack = () => {
      if (isAdminMode) {
        navigate(adminModeRole === "super_admin" ? "/admin/super" : "/admin/village", { replace: true });
        return;
      }
      navigate("/#announcements", { replace: true });
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [navigate, isAdminMode, adminModeRole]);

  useEffect(() => {
    if (!isVillageAdminMode) return;
    const assignedVillage = String(adminProfile?.village || "").trim();
    if (!assignedVillage) return;
    setFormData((prev) => {
      if (prev.village === assignedVillage && prev.villageOther === "") return prev;
      return {
        ...prev,
        village: assignedVillage,
        villageOther: "",
      };
    });
  }, [isVillageAdminMode, adminProfile?.village]);

  useEffect(() => {
    if (isAdminMode) return;
    const token = getToken();
    if (!token) return;
    const refreshMe = async () => {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403 || res.status === 404) {
            forceLogoutToLogin(DELETED_LOGOUT_MESSAGE);
          }
          return;
        }
        const me = await res.json();
        const nextStatus = String(me?.accountStatus || "active").toLowerCase();
        if (nextStatus === "rejected") {
          forceLogoutToLogin(REJECTED_LOGOUT_MESSAGE);
          return;
        }
        setAccountStatus(nextStatus);
      } catch {
        // ignore
      }
    };
    refreshMe();
    const id = setInterval(refreshMe, 12000);
    return () => clearInterval(id);
  }, [API, isAdminMode]);

  useEffect(() => {
    const checkExistingSubmission = async () => {
      if (isAdminMode) return;
      const { token } = getAuthContext();
      if (!token) return;

      try {
        await fetchMyResults(token);
      } catch {
        // Ignore network errors
      }
    };

    checkExistingSubmission();
  }, [API, adminModeRole, isAdminMode]);

  const fetchMyResults = async (tokenArg) => {
    const token = tokenArg || getAuthContext().token;
    if (!token) return;
    const res = await fetch(`${API}/api/results/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) {
      const sorted = [...data].sort((a, b) => getResultTimeMs(b) - getResultTimeMs(a));
      setMyResults(sorted);
      if (!forceFormModeRef.current) {
        setShowSuccess(sorted.length > 0);
      }
      if (!selectedResultId && sorted[0]?._id) {
        setSelectedResultId(sorted[0]._id);
      }
      if (selectedResultId && !sorted.some((r) => r._id === selectedResultId) && sorted[0]?._id) {
        setSelectedResultId(sorted[0]._id);
      }
    }
  };

  const fetchTracking = async (resultId, tokenArg) => {
    if (!resultId) return;
    const token = tokenArg || getAuthContext().token;
    if (!token) return;
    const res = await fetch(`${API}/api/results/me/${resultId}/tracking`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setTracking(data);
  };

  useEffect(() => {
    const { token } = getAuthContext();
    if (!token) return;
    fetchMyResults(token);
    const id = setInterval(() => fetchMyResults(token), 10000);
    return () => clearInterval(id);
  }, [API, forceFormMode, selectedResultId, adminModeRole]);

  useEffect(() => {
    const { token } = getAuthContext();
    if (!token || !selectedResultId) return;
    fetchTracking(selectedResultId, token);
    const id = setInterval(() => fetchTracking(selectedResultId, token), 8000);
    return () => clearInterval(id);
  }, [API, selectedResultId, adminModeRole]);

  useEffect(() => {
    if (!tracking?.resultId) return;
    setMyResults((prev) =>
      prev.map((item) =>
        String(item._id) === String(tracking.resultId)
          ? {
              ...item,
              status: tracking.status || item.status,
              reject_note: tracking.reject_note || "",
            }
          : item
      )
    );
  }, [tracking]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "photo") {
      const nextPhoto = files?.[0] || null;
      setFormData((prev) => ({ ...prev, photo: nextPhoto }));
      if (preview) URL.revokeObjectURL(preview);
      setPreview(nextPhoto ? URL.createObjectURL(nextPhoto) : null);
      return;
    }

    setFormData((prev) => {
      // Skip capitalization for Gujarati fields or if value is already Gujarati
      if (["villageOther", "standardOther", "result_details"].includes(name)) {
        return { ...prev, [name]: capitalizeWords(value) };
      }
      if (name === "studentName" || name === "fatherName") {
        // Direct update for these as they are now handled by GujaratiInput which might return Gujarati
        return { ...prev, [name]: value };
      }
      if (name === "mobile") {
        return { ...prev, [name]: value.replace(/\D/g, "").slice(0, 10) };
      }
      if (name === "totalMarks" || name === "obtainMarks") {
        return { ...prev, [name]: value.replace(/[^0-9.]/g, "") };
      }
      return { ...prev, [name]: value };
    });

    if (name === "standard" && !COLLEGE_STANDARDS.has(value)) {
      setFormData((prev) => ({ ...prev, semester: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError([]);
    setShowSuccess(false);

    const validationErrors = validateForm(formData, showSemester);
    if (validationErrors.length > 0) {
      setError(validationErrors);
      return;
    }

    const { token } = getAuthContext();
    if (!token) {
      navigate(isAdminMode ? "/admin/login" : "/login");
      return;
    }
    if (!isAdminMode && accountStatus !== "active") {
      setError([
        accountStatus === "rejected"
          ? "તમારું એકાઉન્ટ નામંજૂર થયું છે. કૃપા કરીને એડમિનનો સંપર્ક કરો."
          : "તમારું એકાઉન્ટ એડમિન મંજૂરી માટે બાકી છે. મંજૂરી બાદ જ પરિણામ સબમિટ કરી શકશો.",
      ]);
      return;
    }

    // Prepare the final data
    const finalVillage = formData.village === "other"
      ? convertVillageToGujarati(formData.villageOther)
      : formData.village;

    const finalStandard = formData.standard === "Other"
      ? formData.standardOther
      : formData.standard;

    // Create full name in Gujarati format
    const fullNameInGujarati = gujaratiFullName;

    setLoading(true);
    try {
      const body = new FormData();
      body.append("full_name", fullNameInGujarati);
      body.append("mobile", formData.mobile);
      body.append("email", formData.email);
      body.append("standard", finalStandard);
      body.append("semester", showSemester ? formData.semester : "");
      body.append("total_marks", formData.totalMarks);
      body.append("obtain_marks", formData.obtainMarks);
      body.append("percentage", String(formData.percentage));
      body.append("medium", formData.medium);
      body.append("village", finalVillage);
      body.append("result_details", formData.result_details || "");
      if (formData.photo) body.append("photo", formData.photo);

      const res = await fetch(`${API}/api/results`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submit failed");

      if (!isAdminMode) {
        localStorage.setItem("result_submitted", "true");
        sessionStorage.setItem("result_submitted", "true");
      }
      setForceFormMode(false);
      setShowSuccess(true);
      fetchMyResults(token);
      setFormData(INITIAL_FORM_DATA);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
    } catch (err) {
      setError([err.message || "Submission failed"]);
    } finally {
      setLoading(false);
    }
  };

  const goToAnnouncements = () => {
    if (isAdminMode) {
      navigate(adminModeRole === "super_admin" ? "/admin/super" : "/admin/village");
      return;
    }
    navigate("/#announcements");
  };

  const submitAnother = () => {
    if (!isAdminMode) {
      localStorage.removeItem("result_submitted");
      sessionStorage.removeItem("result_submitted");
    }
    setForceFormMode(true);
    setShowSuccess(false);
  };

  const goBackToAdminDashboard = () => {
    if (!isAdminMode) return;
    navigate(adminModeRole === "super_admin" ? "/admin/super" : "/admin/village");
  };

  if (showSuccess) {
    if (isAdminMode) {
      return (
        <section
          className={`min-h-screen px-4 md:px-6 py-10 md:py-14 ${
            adminTheme === "dark" ? "bg-[#0b1324]" : "bg-[#fff6e5]"
          }`}
        >
          <div
            className={`max-w-3xl mx-auto rounded-3xl border p-6 md:p-8 text-center ${
              adminTheme === "dark"
                ? "bg-[#101a30] border-[#2d3b5f] text-[#edf4ff]"
                : "bg-white border-[#7a1f1f]/10 text-[#7a1f1f]"
            }`}
          >
            <div className="flex justify-center">
              <Lottie animationData={trophyAnimation} loop className="w-56 h-56" />
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold">Result submitted successfully.</h2>
            <p className={`mt-3 ${adminTheme === "dark" ? "text-[#b8c7e8]" : "text-[#7a1f1f]/70"}`}>
              Student ka result save ho gaya hai.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={goBackToAdminDashboard}
                className={`px-6 py-3 rounded-full font-semibold transition ${
                  adminTheme === "dark"
                    ? "bg-[#284b88] text-white hover:bg-[#3560aa]"
                    : "bg-[#7a1f1f] text-white hover:opacity-90"
                }`}
              >
                Back to Dashboard
              </button>
              <button
                onClick={submitAnother}
                className={`px-6 py-3 rounded-full border font-semibold transition ${
                  adminTheme === "dark"
                    ? "border-[#4a5f8f] text-[#edf4ff] hover:bg-[#1a2a49]"
                    : "border-[#7a1f1f]/20 text-[#7a1f1f] hover:bg-[#fff6e5]"
                }`}
              >
                Submit Another
              </button>
            </div>
          </div>
        </section>
      );
    }
    return (
      <section className="min-h-screen bg-[#fff6e5] px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="w-full bg-white rounded-3xl shadow-2xl border border-[#7a1f1f]/10 p-6 md:p-8 text-center">
          <div className="flex justify-center">
            <Lottie animationData={trophyAnimation} loop className="w-56 h-56" />
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-[#7a1f1f]">
            તમારું પરિણામ સફળતાપૂર્વક સબમિટ થયું છે.
          </h2>
          <p className="mt-3 text-[#7a1f1f]/70">
            તમારું પરિણામ હાલ સમીક્ષા પ્રક્રિયામાં છે.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={goToAnnouncements}
              className="px-6 py-3 rounded-full bg-[#7a1f1f] text-white font-semibold hover:opacity-90 transition"
            >
              જાહેરાત વિભાગમાં જાઓ
            </button>
            <button
              onClick={submitAnother}
              className="px-6 py-3 rounded-full border border-[#7a1f1f]/20 text-[#7a1f1f] font-semibold hover:bg-[#fff6e5] transition"
            >
              બીજું પરિણામ સબમિટ કરો
            </button>
          </div>
          </div>

          <div className="w-full bg-white rounded-3xl shadow-xl border border-[#7a1f1f]/10 p-4 md:p-6 text-left">
            <p className="text-sm font-semibold text-[#7a1f1f] mb-3">
              ટ્રેક કરવા માટે પરિણામ પસંદ કરો
            </p>
            <div className="overflow-hidden rounded-2xl border border-[#f0e2d2]">
              <div className="max-h-56 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#fff3e0] sticky top-0">
                    <tr className="text-[#7a1f1f]/80">
                      <th className="text-left px-3 py-2">નામ</th>
                      <th className="text-left px-3 py-2">ધોરણ</th>
                      <th className="text-left px-3 py-2">સ્થિતિ</th>
                    </tr>
                  </thead>
                  <tbody>
            {myResults.map((item) => {
              const meta = getResultStatusMeta(item.status);
              const isActive = selectedResultId === item._id;
              return (
                        <tr
                          key={item._id}
                          onClick={() => setSelectedResultId(item._id)}
                          className={`cursor-pointer border-t border-[#f4e7d8] ${isActive ? "bg-[#fff9ef]" : "hover:bg-[#fffaf3]"}`}
                        >
                          <td className="px-3 py-2 font-medium text-[#7a1f1f]">{item.full_name}</td>
                          <td className="px-3 py-2 text-[#7a1f1f]/75">{item.standard}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 rounded-full border text-xs font-semibold ${meta.badgeClass}`}>
                              {meta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {tracking && Array.isArray(tracking.steps) && tracking.steps.length > 0 && (
            <div className="w-full rounded-3xl border border-[#ead8c4] bg-gradient-to-b from-[#fffaf0] to-[#fff6ea] p-4 md:p-8 shadow-[0_12px_35px_rgba(122,31,31,0.08)]">
              <style>{`
                @keyframes trackPulse {
                  0% { box-shadow: 0 0 0 0 rgba(199, 40, 40, 0.35); }
                  70% { box-shadow: 0 0 0 10px rgba(199, 40, 40, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(199, 40, 40, 0); }
                }
                @keyframes trackBounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-4px); }
                }
                @keyframes rejectShake {
                  0%, 100% { transform: translateX(0); }
                  20% { transform: translateX(-2px); }
                  40% { transform: translateX(2px); }
                  60% { transform: translateX(-2px); }
                  80% { transform: translateX(2px); }
                }
                @keyframes rejectGlow {
                  0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.45); }
                  70% { box-shadow: 0 0 0 12px rgba(220, 38, 38, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
                }
              `}</style>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm md:text-base text-[#7a1f1f]/70 mb-1">પ્રગતિ ટ્રેકિંગ</p>
                  <p className="text-xl md:text-2xl font-bold text-[#7a1f1f] leading-tight">
                    {tracking.full_name}
                  </p>
                </div>
                <div className="inline-flex items-center self-start md:self-auto rounded-full border border-[#e8d8c5] bg-white/70 px-3 py-1.5 text-xs md:text-sm font-semibold text-[#7a1f1f]">
                  Current Status: {STEP_LABELS[tracking.status] || tracking.status}
                </div>
              </div>
              {isAdminMode && (
                <div className="mt-2 text-xs text-[#7a1f1f]/70">
                  Submitted By: {getSubmittedByLabel(tracking.submitted_by_role)}{tracking.submitted_by_name ? ` (${tracking.submitted_by_name})` : ""}
                </div>
              )}
              <div className="mt-6 w-full">
                <div
                  className="grid items-start gap-0"
                  style={{ gridTemplateColumns: `repeat(${tracking.steps.length * 2 - 1}, minmax(0, 1fr))` }}
                >
                  {tracking.steps.map((step, index) => {
                    const Icon = STEP_ICONS[step.status] || FaClipboardCheck;
                    const nodeColor = STEP_COLORS[step.status] || "#7c3aed";
                    const activeIndex = Math.max(0, tracking.steps.findIndex((s) => s.active));
                    const segmentDone = index < activeIndex;
                    const stepCol = index * 2 + 1;
                    return (
                      <Fragment key={step.status}>
                        <div style={{ gridColumn: `${stepCol} / ${stepCol + 1}` }} className="text-center">
                          <div
                            className={`mx-auto h-9 w-9 md:h-12 md:w-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                              step.completed
                                ? "text-white"
                                : "bg-[#f3f4f6] border-[#c4c4cc] text-[#8e8e95]"
                            }`}
                            style={{
                              backgroundColor: step.completed ? nodeColor : undefined,
                              borderColor: step.completed ? nodeColor : undefined,
                              boxShadow: step.completed ? `0 10px 20px ${nodeColor}55` : undefined,
                              animation: step.active
                                ? tracking.status === "rejected"
                                  ? "rejectGlow 1.4s infinite, rejectShake 0.45s ease-in-out infinite"
                                  : "trackPulse 1.8s infinite, trackBounce 1.4s ease-in-out infinite"
                                : "none",
                            }}
                          >
                            <Icon className="text-xs md:text-lg" />
                          </div>
                          <p className={`mt-1.5 text-[10px] md:text-xs font-semibold leading-tight ${step.completed ? "text-[#7a1f1f]" : "text-[#a58d74]"}`}>
                            {STEP_LABELS[step.status] || step.status}
                          </p>
                        </div>
                        {index < tracking.steps.length - 1 && (
                          <div
                            style={{ gridColumn: `${stepCol + 1} / ${stepCol + 2}` }}
                            className="px-1 md:px-2 pt-[16px] md:pt-[22px]"
                          >
                            <div className="h-1.5 md:h-2 w-full rounded-full bg-[#d9d9de] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: segmentDone ? "100%" : "0%",
                                  backgroundColor: nodeColor,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              </div>
              {tracking.status === "rejected" && tracking.reject_note && (
                <p className="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  નામંજૂરી નોંધ: {tracking.reject_note}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center py-8 px-4 overflow-x-hidden ${
        isAdminMode && adminTheme === "dark"
          ? "bg-[#0b1324]"
          : "bg-[#fff8ee] bg-[url('/pattern-bg.png')]"
      }`}
    >
      {isAdminMode && adminTheme === "dark" && (
        <style>{`
          .admin-submit-dark label,
          .admin-submit-dark p {
            color: #d6e4ff !important;
          }
          .admin-submit-dark input,
          .admin-submit-dark textarea {
            background: #0f1c34 !important;
            border-color: #425782 !important;
            color: #eef4ff !important;
          }
          .admin-submit-dark input::placeholder,
          .admin-submit-dark textarea::placeholder {
            color: #9eb2d6 !important;
          }
        `}</style>
      )}
      <form
        className={`p-5 md:p-10 rounded-2xl md:rounded-3xl w-full max-w-[90vw] md:max-w-4xl space-y-5 md:space-y-6 border backdrop-blur-sm mx-auto ${
          isAdminMode && adminTheme === "dark"
            ? "admin-submit-dark bg-[#101a30]/95 border-[#2d3b5f] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.55)]"
            : "shadow-[0_10px_30px_-10px_rgba(122,31,31,0.15)] md:shadow-[0_20px_60px_-15px_rgba(122,31,31,0.15)] border-[#e6d5c3] bg-white/80"
        }`}
        onSubmit={handleSubmit}
      >
        {isAdminMode && (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={goBackToAdminDashboard}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                adminTheme === "dark"
                  ? "border-[#4a5f8f] text-[#edf4ff] hover:bg-[#1a2a49]"
                  : "border-[#ead8c4] text-[#7a1f1f] hover:bg-[#fff4e5]"
              }`}
            >
              <FaArrowLeft />
              Back
            </button>
          </div>
        )}
        <div className="text-center mb-6 md:mb-10">
          <h2
            className={`text-3xl md:text-4xl font-bold mb-2 font-serif ${
              isAdminMode && adminTheme === "dark" ? "text-[#edf4ff]" : "text-[#7a1f1f]"
            }`}
          >
            {isAdminMode ? "Admin Result Submission" : "Student Result Submission"}
          </h2>
          <p
            className={`font-medium ${
              isAdminMode && adminTheme === "dark" ? "text-[#b8c7e8]" : "text-[#7a1f1f]/60"
            }`}
          >
            {isAdminMode
              ? `Submitting on behalf of student as ${getSubmittedByLabel(adminModeRole)}`
              : "Snehmilan result data form filling"}
          </p>
        </div>

        {error.length > 0 && (
          <div className="text-sm text-red-600">
            {error.length === 1 && !error[0].includes("Name") ? (
              <p>* {error[0]}</p>
            ) : (
              <>
                <p className="font-semibold">Ye fields khali hain:</p>
                <ul>
                  {error.map((item) => (
                    <li key={item}>* {item}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
        {accountStatus !== "active" && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
            {accountStatus === "rejected"
              ? "તમારું એકાઉન્ટ નામંજૂર છે. પરિણામ સબમિટ કરવાની સુવિધા બંધ છે."
              : "તમારું એકાઉન્ટ મંજૂરી માટે બાકી છે. એડમિન મંજૂર કર્યા પછી જ સબમિટ ખુલશે."}
          </div>
        )}

        {/* Student Name and Father Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Student Name (English)</label>
            <GujaratiInput
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
              placeholder="e.g. Rahul"
              className={FIELD_CLASS}
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Father Name (English)</label>
            <GujaratiInput
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
              placeholder="e.g. Ramesh"
              className={FIELD_CLASS}
              required
              minLength={2}
            />
          </div>
        </div>

        {/* Full Name Preview (Gujarati) */}
        <div className="bg-[#7a1f1f]/5 p-6 rounded-xl border border-[#7a1f1f]/10">
          <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Full Name (Gujarati Preview)</label>
          <input
            type="text"
            name="fullName"
            value={gujaratiFullName}
            readOnly
            placeholder="Full name will appear here in Gujarati"
            className={`${FIELD_CLASS} !bg-transparent font-bold !border-none !p-0 !text-xl !text-[#7a1f1f] focus:!ring-0`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: ધોળકિયા + Student Name + Father Name
          </p>
        </div>

        {/* Mobile and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Mobile Number</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              className={FIELD_CLASS}
              required
              maxLength={10}
            />
          </div>

          <div>
            <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Valid email"
              className={FIELD_CLASS}
              required
            />
          </div>
        </div>

        {/* Standard */}
        <div>
          <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Standard</label>
          <CustomSelect
            name="standard"
            value={formData.standard}
            options={STANDARD_OPTIONS}
            onChange={handleChange}
            placeholder="Select Standard"
            className={FIELD_CLASS}
            required
          />
        </div>

        {/* Standard Other (if Other is selected) */}
        {
          showStandardOther && (
            <div>
              <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Enter Custom Standard/Course</label>
              <input
                type="text"
                name="standardOther"
                value={formData.standardOther}
                onChange={handleChange}
                placeholder="Enter standard or course name"
                className={FIELD_CLASS}
                required
              />
            </div>
          )
        }

        {/* Semester (for college standards) */}
        {
          showSemester && (
            <div>
              <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Semester</label>
              <CustomSelect
                name="semester"
                value={formData.semester}
                options={SEMESTER_OPTIONS}
                onChange={handleChange}
                placeholder="Select Semester"
                className={FIELD_CLASS}
                required
              />
            </div>
          )
        }

        {/* Total Marks and Obtain Marks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Total Marks</label>
            <input
              type="text"
              name="totalMarks"
              value={formData.totalMarks}
              onChange={handleChange}
              placeholder="Enter total marks"
              className={FIELD_CLASS}
              required
            />
          </div>

          <div>
            <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Obtain Marks</label>
            <input
              type="text"
              name="obtainMarks"
              value={formData.obtainMarks}
              onChange={handleChange}
              placeholder="Enter obtain marks"
              className={FIELD_CLASS}
              required
            />
          </div>

          <div>
            <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Percentage</label>
            <input
              type="text"
              name="percentage"
              value={formData.percentage}
              readOnly
              placeholder="Auto-calculated"
              className={`${FIELD_CLASS} bg-gray-100 cursor-not-allowed`}
            />
          </div>
        </div>

        {/* Medium */}
        <div>
          <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Medium</label>
          <CustomSelect
            name="medium"
            value={formData.medium}
            options={["English", "Gujarati"]}
            onChange={handleChange}
            placeholder="Select Medium"
            className={FIELD_CLASS}
            required
          />
        </div>


        {/* Village Dropdown */}
        <div>
          <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Village</label>
          {isVillageAdminMode ? (
            <input
              type="text"
              name="village"
              value={formData.village}
              readOnly
              className={`${FIELD_CLASS} bg-gray-100 cursor-not-allowed`}
            />
          ) : (
            <CustomSelect
              name="village"
              value={formData.village}
              options={VILLAGE_OPTIONS}
              onChange={handleChange}
              placeholder="Select Village"
              className={FIELD_CLASS}
              required
            />
          )}
        </div>

        {/* Village Other (if Other is selected) */}
        {
          showVillageOther && (
            <div>
              <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Enter Custom Village Name</label>
              <input
                type="text"
                name="villageOther"
                value={formData.villageOther}
                onChange={handleChange}
                placeholder="Enter village name"
                className={FIELD_CLASS}
                required
              />
            </div>
          )
        }

        {/* Extra Details */}
        <div>
          <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Extra Details (optional)</label>
          <textarea
            name="result_details"
            value={formData.result_details}
            onChange={handleChange}
            placeholder="Extra result details..."
            className={FIELD_CLASS}
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block font-bold text-[#7a1f1f]/80 mb-2 text-sm tracking-wide uppercase">Upload Photo</label>
          <input
            type="file"
            name="photo"
            accept="image/*"
            onChange={handleChange}
            className={FILE_CLASS}
            required
          />
          {preview && (
            <img src={preview} alt="Preview" className="mt-2 max-w-xs rounded-lg shadow-md" />
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || accountStatus !== "active"}
          className="w-full bg-[#7a1f1f] text-yellow-100 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#902424] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 active:shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-4"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

