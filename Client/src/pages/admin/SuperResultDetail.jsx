import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminShell from "../../components/admin/AdminShell";
import { useAdminData } from "../../context/AdminDataContext";
import GujaratiInput from "../../components/GujaratiInput";
import { getResultStatusMeta, getSubmittedByLabel } from "../../utils/resultStatus";

export default function SuperResultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    results,
    updateResult,
    loading: resultsLoading,
    error: resultsError,
    refresh: refreshResults,
  } = useAdminData();

  const result = useMemo(
    () => results.find((r) => String(r.id) === String(id)),
    [id, results]
  );
  const [formData, setFormData] = useState(result || null);
  const [isEditing, setIsEditing] = useState(false);
  const [initialRetryDone, setInitialRetryDone] = useState(false);
  const [showRejectNote, setShowRejectNote] = useState(false);
  const rejectNoteRef = useRef(null);
  const DASHBOARD_STATE_KEY = "super_admin_dashboard_state";

  useEffect(() => {
    if (result) setFormData(result);
  }, [result]);

  useEffect(() => {
    if (result || resultsLoading || initialRetryDone) return;
    setInitialRetryDone(true);
    refreshResults();
  }, [result, resultsLoading, initialRetryDone, refreshResults]);

  useEffect(() => {
    if (!showRejectNote || !rejectNoteRef.current) return;
    rejectNoteRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => rejectNoteRef.current?.focus(), 220);
  }, [showRejectNote]);

  const markReviewedIfPending = async () => {
    if (!formData || String(formData.status || "").toLowerCase() !== "pending") return;
    await updateResult(formData.id, { status: "reviewed", reject_note: "" });
    setFormData((prev) => (prev ? { ...prev, status: "reviewed" } : prev));
  };

  const goBack = async () => {
    await markReviewedIfPending();
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/admin/super");
  };

  const redirectToResultsPanel = () => {
    let saved = {};
    try {
      saved = JSON.parse(sessionStorage.getItem(DASHBOARD_STATE_KEY) || "{}");
    } catch {
      saved = {};
    }
    navigate("/admin/super", {
      state: {
        returnState: {
          ...saved,
          selectedVillage: saved.selectedVillage || formData?.village || "",
        },
      },
    });
  };

  const handleStatusChange = async (status) => {
    if (!formData) return;
    if (status === "rejected") {
      setShowRejectNote(true);
      return;
    }
    if (status === "pending") {
      await updateResult(formData.id, { status: "reviewed", reject_note: "" });
      setFormData((prev) => ({ ...prev, status: "reviewed" }));
      setTimeout(redirectToResultsPanel, 150);
      return;
    }
    const effectiveStatus = status === "reviewed" ? "pending" : status;
    await updateResult(formData.id, { status: effectiveStatus, reject_note: "" });
    setFormData((prev) => ({ ...prev, status: effectiveStatus }));
    setTimeout(redirectToResultsPanel, 150);
  };

  const handleRejectWithNote = async () => {
    if (!formData) return;
    await updateResult(formData.id, {
      status: "rejected",
      reject_note: formData.reject_note || "",
    });
    setFormData((prev) => ({ ...prev, status: "rejected" }));
    setShowRejectNote(false);
    setTimeout(redirectToResultsPanel, 150);
  };

  const handleEditSave = async () => {
    if (!formData) return;
    await updateResult(formData.id, formData);
    setIsEditing(false);
  };

  if (!formData) {
    return (
      <AdminShell title="Result Details" roleLabel="Super Admin">
        <div className="admin-card bg-white rounded-2xl p-6">
          {resultsLoading && (
            <p className="text-[#7a1f1f] font-semibold">Loading result...</p>
          )}
          {/* Results load error banner (temporary debug) */}
          {resultsError && (
            <div className="mb-3 rounded-xl border border-[#f0d4d4] bg-[#fff1f1] px-4 py-3 text-sm text-[#7a1f1f]">
              Failed to load results: {resultsError}
              <button
                onClick={refreshResults}
                className="ml-3 rounded-full border border-[#e7d3bd] px-3 py-1 text-xs"
              >
                Refresh Results
              </button>
            </div>
          )}
          {!resultsLoading && (
            <p className="text-[#7a1f1f] font-semibold">Result not found.</p>
          )}
          <button
            onClick={() => {
              goBack().catch(() => {});
            }}
            className="mt-4 px-4 py-2 rounded-full border border-[#ead8c4]"
          >
            Back to Results
          </button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Result Review"
      roleLabel="Super Admin"
      actions={
        <button
          onClick={() => {
            goBack().catch(() => {});
          }}
          className="admin-card px-4 py-2 rounded-full bg-white text-[#7a1f1f] hover:shadow-md transition"
        >
          Back
        </button>
      }
    >
      <style>{`
        .admin-theme-dark .super-result-page {
          color: #1f2937;
        }
        .admin-theme-dark .super-result-page .admin-card {
          background: #f8fafc !important;
          border-color: #d5deeb !important;
        }
        .admin-theme-dark .super-result-page [class*="text-[#7a1f1f"] {
          color: #1f2937 !important;
        }
        .admin-theme-dark .super-result-page input,
        .admin-theme-dark .super-result-page select,
        .admin-theme-dark .super-result-page textarea {
          background: #ffffff !important;
          color: #111827 !important;
          border-color: #cbd5e1 !important;
        }
      `}</style>
      <div className="super-result-page grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="admin-card bg-white rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#7a1f1f]/60">
                Full Name
              </p>
              {isEditing ? (
                <GujaratiInput
                  name="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#ead8c4] px-3 py-2 text-[#7a1f1f]"
                />
              ) : (
                <p className="text-2xl font-semibold text-[#7a1f1f]">
                  {formData.full_name}
                </p>
              )}
            </div>
            <span
              className={`px-3 py-1 text-xs rounded-full border ${getResultStatusMeta(formData.status).badgeClass}`}
            >
              {getResultStatusMeta(formData.status).label}
            </span>
          </div>
          <div className="rounded-xl border border-[#eddcc7] p-4 bg-[#fffaf0]">
            <p className="text-xs text-[#7a1f1f]/60">Submitted By</p>
            <p className="font-medium">
              {getSubmittedByLabel(formData.submitted_by_role)}
              {formData.submitted_by_name ? ` (${formData.submitted_by_name})` : ""}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["Mobile", "mobile"],
              ["Email", "email"],
              ["Standard", "standard"],
              ["Semester", "semester"],
              ["Percentage", "percentage"],
              ["Medium", "medium"],
              ["Village", "village"],
            ].map(([label, key]) => (
              <div key={label} className="rounded-xl border border-[#eddcc7] p-4">
                <p className="text-xs text-[#7a1f1f]/60">{label}</p>
                {isEditing ? (
                  <input
                    value={formData[key] || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#ead8c4] px-3 py-2"
                  />
                ) : (
                  <p className="font-medium">
                    {key === "percentage"
                      ? formData[key] ? `${formData[key]}%` : "N/A"
                      : formData[key] || "N/A"}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#eddcc7] p-4 bg-[#fffaf0]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a1f1f]/60">
              Extra Details
            </p>
            {isEditing ? (
              <textarea
                value={formData.result_details}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    result_details: e.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-[#ead8c4] px-3 py-2 text-sm"
                rows={4}
              />
            ) : (
              <p className="text-sm text-[#7a1f1f]/80 mt-2">
                {formData.result_details || "No extra details submitted."}
              </p>
            )}
          </div>
        </div>

        <div className="admin-card bg-white rounded-2xl p-6 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a1f1f]/60">
              Uploaded Photo
            </p>
            <a
              href={formData.photo || "#"}
              target="_self"
              rel="noreferrer"
              className="mt-3 block rounded-2xl border border-[#eddcc7] overflow-hidden"
            >
              <img
                src={formData.photo}
                alt="Uploaded"
                className="w-full h-64 object-contain bg-[#fff6e5] cursor-pointer"
              />
            </a>
            {isEditing && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = URL.createObjectURL(file);
                  setFormData((prev) => ({
                    ...prev,
                    photo: url,
                    photoFile: file,
                  }));
                }}
                className="mt-3 w-full rounded-lg border border-[#ead8c4] px-3 py-2 text-sm"
              />
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => (isEditing ? handleEditSave() : setIsEditing(true))}
              className="w-full rounded-full border border-[#ead8c4] py-3 font-semibold text-[#7a1f1f] hover:bg-[#fff6e5] transition"
            >
              {isEditing ? "Save Changes" : "Edit Result"}
            </button>
            <button
              onClick={() => handleStatusChange("accepted")}
              className="w-full rounded-full bg-[#15803d] text-white py-3 font-semibold hover:opacity-90 transition"
            >
              Accept Result
            </button>
            <button
              onClick={() => handleStatusChange("rejected")}
              className="w-full rounded-full bg-[#b91c1c] text-white py-3 font-semibold hover:opacity-90 transition"
            >
              Reject Result
            </button>
            <button
              onClick={() => handleStatusChange("pending")}
              className="w-full rounded-full border border-[#ead8c4] py-3 font-semibold text-[#7a1f1f]"
            >
              Keep as Pending
            </button>
          </div>

          {showRejectNote && (
            <div className="rounded-2xl border border-[#f5c2c2] bg-gradient-to-b from-[#fff6f6] to-[#fff1f1] p-4 space-y-3 shadow-[0_8px_20px_rgba(185,28,28,0.08)]">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#b91c1c] text-white text-xs font-bold">
                  !
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#7a1f1f]">
                    Reject Note (student ko directly dikhega)
                  </p>
                  <p className="text-xs text-[#7a1f1f]/70 mt-0.5">
                    Clear aur respectful reason likho, taki student ko samajh aaye.
                  </p>
                </div>
              </div>
              <textarea
                ref={rejectNoteRef}
                value={formData.reject_note || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reject_note: e.target.value }))
                }
                className="w-full rounded-xl border border-[#efc3c3] bg-white px-3 py-2.5 text-sm text-[#7a1f1f] placeholder:text-[#7a1f1f]/40 focus:outline-none focus:ring-2 focus:ring-[#b91c1c]/20 focus:border-[#b91c1c]/40"
                rows={4}
                maxLength={300}
                placeholder="Example: Marksheet photo blur hai, please clear image ke saath dubara submit karo."
              />
              <div className="flex items-center justify-between text-xs text-[#7a1f1f]/65">
                <span>Tip: short, specific reason likho.</span>
                <span>{(formData.reject_note || "").length}/300</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRejectWithNote}
                  className="flex-1 rounded-full bg-[#b91c1c] text-white py-2.5 font-semibold hover:bg-[#991b1b] transition"
                >
                  Confirm Reject
                </button>
                <button
                  onClick={() => setShowRejectNote(false)}
                  className="flex-1 rounded-full border border-[#e8cfcf] bg-white py-2.5 font-semibold text-[#7a1f1f] hover:bg-[#fff8f8] transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
