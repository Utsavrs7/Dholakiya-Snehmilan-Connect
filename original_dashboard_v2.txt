import { useMemo, useRef, useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import AdminShell from "../../components/admin/AdminShell";
import { useAdminData } from "../../context/AdminDataContext";
import { getAdminTokenFor, getAdminUserFor } from "../../utils/adminAuth";
import { getResultStatusMeta, getSubmittedByLabel } from "../../utils/resultStatus";

export default function VillageAdminDashboard() {
  // Use logged-in admin profile for display
  const profile = getAdminUserFor("village_admin") || {
    name: "Village Admin",
    village: "",
    email: "",
    mobile: "",
  };
  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const [statusFilter, setStatusFilter] = useState("All");
  const [submittedByFilter, setSubmittedByFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState("");
  const [pendingBulkBusy, setPendingBulkBusy] = useState(false);
  const pageSize = 6;
  const selectAllTopRef = useRef(null);
  const selectAllHeaderRef = useRef(null);
  const navigate = useNavigate();
  const { results: villageResults, updateResult, error: resultsError, refresh: refreshResults } = useAdminData();
  // Track viewed result IDs so "New Results" counter can decrease after visit
  const [visitedIds, setVisitedIds] = useState(() => {
    try {
      const raw = localStorage.getItem("village_admin_visited_results");
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.log(err)
      return [];
    }
  });

  const getSubmittedBadge = (result) => {
    const role = String(result?.submitted_by_role || "user").toLowerCase();
    if (role === "village_admin") return "You";
    if (role === "super_admin") return getSubmittedByLabel(role);
    return "";
  };

  const stats = useMemo(() => {
    const total = villageResults.length;
    const pending = villageResults.filter((r) => r.status === "pending").length;
    const reviewed = villageResults.filter((r) => r.status === "reviewed").length;
    const accepted = villageResults.filter((r) => r.status === "accepted").length;
    const rejected = villageResults.filter((r) => r.status === "rejected").length;
    return [
      { label: "Total Results", value: total, tone: "stat-total" },
      { label: "Pending", value: pending, tone: "stat-pending" },
      { label: "Reviewed", value: reviewed, tone: "stat-total" },
      { label: "Accepted", value: accepted, tone: "stat-accepted" },
      { label: "Rejected", value: rejected, tone: "stat-rejected" },
    ];
  }, [villageResults]);

  // Filter results using latest data + current filters
  const filteredResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    const statusValue = statusFilter === "All" ? "" : statusFilter.toLowerCase();
    return villageResults.filter((r) => {
      const submitRole = String(r.submitted_by_role || "user").toLowerCase();
      const matchesStatus =
        statusValue === "" ? true : r.status === statusValue;
      const matchesSubmittedBy =
        submittedByFilter === "all"
          ? true
          : submittedByFilter === "you"
          ? submitRole === "village_admin"
          : submitRole === submittedByFilter;
      const matchesSearch =
        term === ""
          ? true
          : [r.full_name, r.standard, r.medium, r.mobile]
              .join(" ")
              .toLowerCase()
              .includes(term);
      return matchesStatus && matchesSubmittedBy && matchesSearch;
    });
  }, [statusFilter, submittedByFilter, search, villageResults]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredResults.length / pageSize)),
    [filteredResults.length]
  );

  const pagedResults = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredResults.slice(start, start + pageSize);
  }, [filteredResults, page]);

  // Pending results are treated as NEW until viewed by village admin.
  const newResultsCount = useMemo(() => {
    return villageResults.filter((r) => r.status === "pending").length;
  }, [villageResults]);

  const pendingResults = useMemo(
    () => filteredResults.filter((r) => r.status === "pending"),
    [filteredResults]
  );
  const acceptedResults = useMemo(
    () => filteredResults.filter((r) => r.status === "accepted"),
    [filteredResults]
  );
  const selectableResults =
    statusFilter === "Pending"
      ? pendingResults
      : statusFilter === "Accepted"
      ? acceptedResults
      : [];

  useEffect(() => {
    if (statusFilter !== "Pending" && statusFilter !== "Accepted") {
      setSelectedIds([]);
    }
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    const total = selectableResults.length;
    const checked = selectedIds.length;
    const setCheckboxState = (el) => {
      if (!el) return;
      el.indeterminate = checked > 0 && checked < total;
      el.checked = total > 0 && checked === total;
    };
    setCheckboxState(selectAllTopRef.current);
    setCheckboxState(selectAllHeaderRef.current);
  }, [selectedIds, selectableResults]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    fetchPendingUsers();
    const id = setInterval(fetchPendingUsers, 15000);
    return () => clearInterval(id);
  }, []);

  // Persist visited IDs so refresh doesn't reset "New Results" counter
  useEffect(() => {
    try {
      localStorage.setItem(
        "village_admin_visited_results",
        JSON.stringify(visitedIds)
      );
    } catch (err) {
      // Ignore storage errors to avoid breaking UI
      console.log(err)
    }
  }, [visitedIds]);

  const toggleSelectAll = () => {
    if (selectableResults.length === 0) return;
    if (selectedIds.length === selectableResults.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableResults.map((r) => r.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const applyBulkStatus = async (status) => {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    setBulkError("");
    try {
      await Promise.all(selectedIds.map((id) => updateResult(id, { status })));
      setSelectedIds([]);
    } catch (err) {
      setBulkError(err.message || "Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const applySingleStatus = async (id, status) => {
    try {
      await updateResult(id, { status });
    } catch (err) {
      setBulkError(err.message || "Update failed");
    }
  };
  const fetchPendingUsers = async () => {
    setPendingLoading(true);
    setPendingError("");
    try {
      const token = getAdminTokenFor("village_admin");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/users/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load pending users");
      setPendingUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setPendingError(err.message || "Failed to load pending users");
    } finally {
      setPendingLoading(false);
    }
  };

  const handlePendingAction = async (id, action) => {
    if (!id || pendingBulkBusy) return;
    setPendingBulkBusy(true);
    setPendingError("");
    try {
      const token = getAdminTokenFor("village_admin");
      if (action === "approve") {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/users/${id}/approve`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to approve user");
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/users/${id}/reject`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to reject user");
      }
      fetchPendingUsers();
    } catch (err) {
      setPendingError(err.message || `Failed to ${action} user`);
    } finally {
      setPendingBulkBusy(false);
    }
  };
  // Mark result as visited and open details
  const openResult = (id) => {
    const selected = villageResults.find((item) => String(item.id) === String(id));
    setVisitedIds((prev) => {
      const nextId = String(id);
      return prev.includes(nextId) ? prev : [...prev, nextId];
    });
    if (selected?.status === "pending") {
      updateResult(id, { status: "reviewed" })
        .catch(() => {})
        .finally(() => navigate(`/admin/village/result/${id}`));
      return;
    }
    navigate(`/admin/village/result/${id}`);
  };

  return (
    <AdminShell
      title="Village Admin Workspace"
      roleLabel={`Village Admin • ${profile.village || "Unknown"}`}
      actions={
        <>
          <button
            onClick={() => navigate("/admin/village/submit-result")}
            className="admin-card btn-pop btn-add-result px-3 py-2 md:px-4 md:py-2 rounded-full border text-xs md:text-sm transition font-semibold"
          >
            + Add Result
          </button>
          {/* Profile moved to AdminShell dropdown */}
        </>
      }
    >
      <style>{`
        @keyframes drawerIn {
          from { transform: translateX(24px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .profile-drawer {
          animation: drawerIn 0.35s ease-out both;
        }
        .village-admin-page .btn-pop {
          transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease, color 180ms ease;
        }
        .village-admin-page .btn-pop:hover {
          box-shadow: 0 8px 18px rgba(59, 38, 29, 0.12);
        }
        .village-admin-page .btn-soft-sky {
          background: #ecfeff;
          border-color: #a5f3fc;
          color: #0e7490;
        }
        .village-admin-page .btn-soft-amber {
          background: #fffbeb;
          border-color: #fde68a;
          color: #92400e;
        }
        .village-admin-page .btn-soft-rose {
          background: #fff1f2;
          border-color: #fecdd3;
          color: #9f1239;
        }
        .village-admin-page .btn-soft-mint {
          background: #ecfdf5;
          border-color: #a7f3d0;
          color: #065f46;
        }
        .village-admin-page .btn-soft-violet {
          background: #f5f3ff;
          border-color: #ddd6fe;
          color: #5b21b6;
        }
        .btn-add-result {
          background: linear-gradient(135deg, #fff8ee 0%, #ffe9cb 55%, #ffd8a8 100%);
          border-color: #efc997;
          color: #7a3f24;
          box-shadow: 0 8px 18px rgba(198, 137, 72, 0.2);
        }
        .btn-add-result:hover {
          background: linear-gradient(135deg, #fffdf9 0%, #ffeccf 52%, #ffd39c 100%);
          border-color: #e6bd87;
          box-shadow: 0 12px 22px rgba(198, 137, 72, 0.26);
          transform: translateY(-1px) scale(1.04);
        }
        .village-admin-page .stat-card {
          border: 1px solid #d3dceb;
        }
        .village-admin-page .stat-total {
          background: linear-gradient(135deg, #e6f2ff 0%, #f3f8ff 100%);
        }
        .village-admin-page .stat-pending {
          background: linear-gradient(135deg, #fff8dc 0%, #fff2bf 100%);
        }
        .village-admin-page .stat-accepted {
          background: linear-gradient(135deg, #ebfaee 0%, #f4fff6 100%);
        }
        .village-admin-page .stat-rejected {
          background: linear-gradient(135deg, #ffe9e9 0%, #fff4f4 100%);
        }
        .village-admin-page .stat-card .stat-label,
        .village-admin-page .stat-card .stat-value {
          color: #111827 !important;
        }
        .admin-theme-dark .village-admin-page {
          color: #e7efff;
        }
        .admin-theme-dark .village-admin-page .admin-card {
          background: #212e45 !important;
          border-color: #344a72 !important;
        }
        .admin-theme-dark .village-admin-page [class*="text-[#7a1f1f"] {
          color: #e7efff !important;
        }
        .admin-theme-dark .village-admin-page [class*="text-[#7a1f1f]/"] {
          color: #bfd0f2 !important;
        }
        .admin-theme-dark .village-admin-page .stat-card,
        .admin-theme-dark .village-admin-page .stat-card * {
          color: #111827 !important;
        }
        .admin-theme-dark .village-admin-page .stat-total {
          background: linear-gradient(135deg, #e6f2ff 0%, #f3f8ff 100%) !important;
        }
        .admin-theme-dark .village-admin-page .stat-pending {
          background: linear-gradient(135deg, #fff8dc 0%, #fff2bf 100%) !important;
        }
        .admin-theme-dark .village-admin-page .stat-accepted {
          background: linear-gradient(135deg, #ebfaee 0%, #f4fff6 100%) !important;
        }
        .admin-theme-dark .village-admin-page .stat-rejected {
          background: linear-gradient(135deg, #ffe9e9 0%, #fff4f4 100%) !important;
        }
        .admin-theme-dark .village-admin-page .new-results-badge {
          background: #243143 !important;
          border-color: #4f78a6 !important;
          color: #d9ebff !important;
        }
        .admin-theme-dark .village-admin-page .new-results-dot {
          background: #7dd3fc !important;
        }
        @keyframes villageResultsIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .village-admin-page .village-results-enter {
          animation: villageResultsIn 0.35s ease-out both;
        }
        .village-admin-page .village-results-panel {
          background: #fffaf2;
          border: 1px solid #eddcc7;
          box-shadow: 0 12px 28px rgba(122, 31, 31, 0.08);
        }
        .village-admin-page .village-filter-control {
          transition: all 0.2s ease;
        }
        .village-admin-page .village-filter-control:hover {
          background: #fff5e8;
          border-color: #dfbe9b;
          box-shadow: 0 8px 18px rgba(122, 31, 31, 0.08);
        }
        .village-admin-page .village-filter-control:focus {
          outline: none;
          border-color: #7a1f1f;
          box-shadow: 0 0 0 2px rgba(122, 31, 31, 0.18);
        }
        .village-admin-page .village-results-panel .village-result-row {
          transition: background-color 0.2s ease;
        }
        .village-admin-page .village-results-panel .village-result-row:hover {
          background: #fff3df;
        }
        .village-admin-page .village-results-panel .village-result-row td {
          padding-top: 0.85rem;
          padding-bottom: 0.85rem;
        }
        .village-admin-page .village-results-panel .village-pagination {
          margin-top: 1.25rem;
          padding-top: 0.9rem;
          border-top: 1px solid #ebd5bd;
        }
        .village-admin-page .village-results-panel .village-page-meta {
          background: #fff2e2;
          border: 1px solid #e7c8a9;
          color: #7a1f1f;
          padding: 0.35rem 0.8rem;
          border-radius: 9999px;
          font-weight: 500;
        }
        .village-admin-page .village-results-panel .village-page-actions {
          background: #fff6ea;
          border: 1px solid #ead2b7;
          border-radius: 9999px;
          padding: 0.3rem;
          gap: 0.4rem;
        }
        .admin-theme-dark .village-admin-page .village-results-panel {
          background: #0b1f4482 !important;
          border-color: #344a72 !important;
          color: #e7efff !important;
          box-shadow: 0 14px 32px rgba(200, 213, 244, 0.22) !important;
        }
        .admin-theme-dark .village-admin-page .village-results-panel h2,
        .admin-theme-dark .village-admin-page .village-results-panel th,
        .admin-theme-dark .village-admin-page .village-results-panel td,
        .admin-theme-dark .village-admin-page .village-results-panel p,
        .admin-theme-dark .village-admin-page .village-results-panel label,
        .admin-theme-dark .village-admin-page .village-results-panel span {
          color: #e7efff !important;
        }
        .admin-theme-dark .village-admin-page .village-results-panel .village-filter-control {
          background: #121d32 !important;
          border-color: #576b93 !important;
          color: #f3f7ff !important;
        }
        .admin-theme-dark .village-admin-page .village-results-panel .village-filter-control::placeholder {
          color: #afbddb !important;
        }
        .admin-theme-dark .village-admin-page .village-results-panel .village-filter-control:hover {
          background: #1d2c47 !important;
          border-color: #6c80a8 !important;
          box-shadow: 0 8px 18px rgba(8, 16, 34, 0.45) !important;
        }
        .admin-theme-dark .village-admin-page .village-results-panel .village-filter-control:focus {
          box-shadow: 0 0 0 2px rgba(145, 172, 222, 0.35) !important;
        }
        .admin-theme-dark .village-admin-page .village-results-panel .village-results-table thead tr {
          border-color: #4c618a !important;
        }
        .admin-theme-dark .village-admin-page .village-results-panel .village-result-row {
          border-color: #3f537c !important;
        }
        .admin-theme-dark .village-admin-page .village-results-panel .village-result-row:hover {
          background: #243652 !important;
        }
        .admin-theme-dark .village-admin-page .village-results-panel .village-action-btn {
          color: #edf3ff !important;
          border-color: #5a6f96 !important;
        }
        .admin-theme-dark .village-admin-page .village-results-panel .village-action-btn:hover {
          background: #25385a !important;
          box-shadow: 0 10px 20px rgba(6, 14, 30, 0.45) !important;
        }
        .admin-theme-dark .village-admin-page .village-results-panel .village-page-meta {
          background: #15233a !important;
          border-color: #4f6692 !important;
          color: #dce7ff !important;
        }
        .admin-theme-dark .village-admin-page .village-results-panel .village-page-actions {
          background: #16253d !important;
          border-color: #4f6692 !important;
        }
        .admin-theme-dark .village-admin-page .village-results-panel .village-page-btn-active {
          background: #7a1f1f !important;
          border-color: #7a1f1f !important;
          color: #ffffff !important;
        }
        .admin-theme-dark .village-admin-page .status-toggle-btn {
          background: #1a2742 !important;
          border-color: #4b5f86 !important;
          color: #e6efff !important;
        }
        .admin-theme-dark .village-admin-page .status-toggle-btn.status-toggle-active {
          background: #7a1f1f !important;
          border-color: #7a1f1f !important;
          color: #ffffff !important;
          box-shadow: 0 10px 20px rgba(6, 14, 30, 0.45) !important;
        }
        .admin-theme-dark .btn-add-result {
          background: linear-gradient(135deg, #1f3f75 0%, #1e4f96 52%, #1d4f8a 100%) !important;
          border-color: #d6b36a !important;
          color: #f8fbff !important;
          box-shadow: 0 12px 24px rgba(8, 20, 46, 0.5) !important;
        }
        .admin-theme-dark .btn-add-result:hover {
          background: linear-gradient(135deg, #244a88 0%, #2460b0 50%, #225c9f 100%) !important;
          border-color: #e5c67f !important;
          box-shadow: 0 14px 28px rgba(8, 20, 46, 0.58) !important;
        }
        .admin-theme-dark .village-admin-page .result-status-badge {
          border: 1px solid transparent !important;
        }
        .admin-theme-dark .village-admin-page .result-status-badge.result-status-accepted {
          background: #14532d !important;
          color: #dcfce7 !important;
          border-color: #22c55e !important;
        }
        .admin-theme-dark .village-admin-page .result-status-badge.result-status-rejected {
          background: #7f1d1d !important;
          color: #fee2e2 !important;
          border-color: #ef4444 !important;
        }
        .admin-theme-dark .village-admin-page .result-status-badge.result-status-pending {
          background: #7c2d12 !important;
          color: #ffedd5 !important;
          border-color: #f97316 !important;
        }
        .admin-theme-dark .village-admin-page .result-status-badge.result-status-reviewed {
          background: #1e3a8a !important;
          color: #dbeafe !important;
          border-color: #3b82f6 !important;
        }
        .village-admin-page .approval-card-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }
        .village-admin-page .approval-card-actions {
          display: inline-flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .village-admin-page .approval-panel-shell {
          background: linear-gradient(180deg, #fff5e8 0%, #fffaf2 100%);
          border: 1px solid #e4cfb4;
        }
        .village-admin-page .approval-user-card {
          border: 1px solid #dfc7aa;
          border-left: 5px solid #b45309;
          background: #fffefc;
          box-shadow: 0 4px 10px rgba(122, 31, 31, 0.06);
        }
        .village-admin-page .approval-user-card.approval-user-card-alt {
          border-color: #d4bc9f;
          border-left-color: #7a1f1f;
          background: #fff7ec;
        }
        .village-admin-page .approval-user-avatar {
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          border: 1px solid #efc89c;
          background: linear-gradient(135deg, #fff8e8 0%, #ffe7c7 100%);
          color: #8f2a2a;
          font-size: 0.78rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .village-admin-page .approval-meta-chip {
          border: 1px solid #ead6be;
          background: #fffaf4;
          color: #7a1f1f;
          border-radius: 999px;
          padding: 0.15rem 0.55rem;
          font-size: 10px;
          font-weight: 600;
        }
        .village-admin-page .approval-approve-btn {
          background: #dcfce7;
          border-color: #22c55e;
          color: #166534;
        }
        .village-admin-page .approval-reject-btn {
          background: #fee2e2;
          border-color: #ef4444;
          color: #991b1b;
        }
        .admin-theme-dark .village-admin-page .approval-user-card {
          border-color: #425b84 !important;
          border-left-color: #60a5fa !important;
          background: #1a2842 !important;
          box-shadow: 0 6px 14px rgba(4, 10, 22, 0.38) !important;
        }
        .admin-theme-dark .village-admin-page .approval-user-card.approval-user-card-alt {
          border-color: #4b6698 !important;
          border-left-color: #f59e0b !important;
          background: #1f2f4b !important;
        }
        .admin-theme-dark .village-admin-page .approval-panel-shell {
          background: linear-gradient(180deg, #1c2b46 0%, #15233c 100%) !important;
          border-color: #3f5680 !important;
        }
        .admin-theme-dark .village-admin-page .approval-user-avatar {
          border-color: #5070a8 !important;
          background: linear-gradient(135deg, #22375b 0%, #1b2d4a 100%) !important;
          color: #dce8ff !important;
        }
        .admin-theme-dark .village-admin-page .approval-meta-chip {
          border-color: #526f9f !important;
          background: #22385c !important;
          color: #dce8ff !important;
        }
        .admin-theme-dark .village-admin-page .approval-approve-btn {
          background: #14532d !important;
          border-color: #22c55e !important;
          color: #dcfce7 !important;
        }
        .admin-theme-dark .village-admin-page .approval-reject-btn {
          background: #7f1d1d !important;
          border-color: #ef4444 !important;
          color: #fee2e2 !important;
        }
        @media (max-width: 767px) {
          .village-admin-page .approval-card-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .village-admin-page .approval-card-row .shrink-0 {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
      <div className="village-admin-page">
      {/* Results load error banner (temporary debug) */}
      {resultsError && (
        <div className="mb-4 rounded-xl border border-[#f0d4d4] bg-[#fff1f1] px-4 py-3 text-sm text-[#7a1f1f]">
          Failed to load results: {resultsError}
          <button
            onClick={refreshResults}
            className="ml-3 btn-pop btn-soft-amber rounded-full border px-3 py-1 text-xs"
          >
            Refresh Results
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s) => {
          const target =
            s.label === "Total Results" ? "All" : s.label;
          const isActive = statusFilter === target;
          return (
            <button
              key={s.label}
              onClick={() => setStatusFilter(target)}
              className={`admin-card stat-card ${s.tone} rounded-2xl p-4 text-left transition ${
                isActive ? "ring-2 ring-[#7a1f1f]/40" : "hover:shadow-md"
              }`}
            >
            <p className="stat-label text-xs uppercase tracking-[0.18em]">
              {s.label}
            </p>
            <p className="stat-value mt-2 text-2xl md:text-3xl font-semibold">
              {s.value}
            </p>
            </button>
          );
        })}
      </div>

      {/* New results + user approvals */}
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="admin-card village-results-enter village-results-panel rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#7a1f1f]">New Results</h2>
            <div className="flex items-center gap-2">
              <span className="new-results-badge inline-flex items-center gap-2 rounded-full bg-[#fff7ed] text-[#c2410c] text-xs font-semibold px-3 py-1 border border-[#f3d4b2] shadow-sm">
                <span className="new-results-dot w-2 h-2 rounded-full bg-[#c2410c]" />
                {newResultsCount} New
              </span>
              <span className="text-xs text-[#7a1f1f]/60">Pending</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-[#7a1f1f]/70">
            {newResultsCount === 0
              ? "No new results pending."
              : "Open any NEW result once, it will move to Reviewed automatically."}
          </p>
        </div>

        <div className="admin-card village-results-enter village-results-panel approval-panel-shell rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#7a1f1f]">User Approval Requests ({profile.village || "-"})</h2>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-xs text-[#7a1f1f]/70">{pendingUsers.length} Pending</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-[#7a1f1f]/65">
            Har request ko individual review karke accept ya reject karein.
          </p>
          <div className="mt-4 space-y-3 max-h-72 overflow-auto pr-1">
            {pendingLoading && <p className="text-sm text-[#7a1f1f]/70">Loading pending users...</p>}
            {!pendingLoading && pendingUsers.length === 0 && (
              <p className="text-sm text-[#7a1f1f]/70">No pending requests in your village.</p>
            )}
            {!pendingLoading &&
              pendingUsers.map((user, idx) => (
                <div
                  key={user._id}
                  className={`approval-user-card rounded-xl p-3 ${
                    idx % 2 === 1 ? "approval-user-card-alt" : ""
                  }`}
                >
                  <div className="approval-card-row">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-1 items-start gap-2.5">
                      <span className="approval-user-avatar">
                        {String(user.name || "U").trim().charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-[#7a1f1f]">{user.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <span className="approval-meta-chip">{user.village || "-"}</span>
                          <span className="approval-meta-chip">{user.mobile || "-"}</span>
                        </div>
                        <p className="text-xs text-[#7a1f1f]/65 mt-1">{user.email || "-"}</p>
                      </div>
                      </div>
                      <div className="ml-auto flex items-center gap-2 shrink-0 pl-4">
                        <button
                          onClick={() => handlePendingAction(user._id, "approve")}
                          disabled={pendingLoading || pendingBulkBusy}
                          className="approval-approve-btn rounded-md border px-3 py-1 text-[11px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handlePendingAction(user._id, "reject")}
                          disabled={pendingLoading || pendingBulkBusy}
                          className="approval-reject-btn rounded-md border px-3 py-1 text-[11px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          {pendingError && <p className="mt-3 text-xs text-red-600">{pendingError}</p>}
        </div>
      </div>

      <div className="mt-8 admin-card village-results-panel rounded-2xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#7a1f1f]">My Results</h2>
          <div className="flex flex-wrap gap-2">
            {["All", "Pending", "Reviewed", "Accepted", "Rejected"].map((label) => {
              const isActive = statusFilter === label;
              return (
                <button
                  key={label}
                  onClick={() => setStatusFilter(label)}
                  className={`status-toggle-btn ${isActive ? "status-toggle-active" : ""} btn-pop px-3 py-1 rounded-full border text-sm transition ${
                    isActive
                      ? "bg-[#eef2ff] text-[#3730a3] border-[#c7d2fe]"
                      : "bg-[#fff7ed] border-[#fed7aa] text-[#9a3412]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, standard, medium, phone..."
            className="village-filter-control w-full md:max-w-sm rounded-full border border-[#ead8c4] px-4 py-2.5 text-sm"
          />
          <select
            value={submittedByFilter}
            onChange={(e) => setSubmittedByFilter(e.target.value)}
            className="village-filter-control w-full md:w-auto rounded-full border border-[#ead8c4] px-4 py-2.5 text-sm"
          >
            <option value="all">All Submitters</option>
            <option value="you">You</option>
            <option value="super_admin">Super Admin</option>
            <option value="user">Users</option>
          </select>
          {(statusFilter === "Pending" || statusFilter === "Accepted") && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-[#7a1f1f]">
                <input
                  ref={selectAllTopRef}
                  type="checkbox"
                  onChange={toggleSelectAll}
                />
                Select all
              </label>
              {statusFilter === "Pending" ? (
                <>
                  <button
                    disabled={bulkBusy || selectedIds.length === 0}
                    onClick={() => applyBulkStatus("accepted")}
                    className="btn-pop btn-soft-amber px-3 py-2 text-xs rounded-full border disabled:opacity-50"
                  >
                    Accept All
                  </button>
                  <button
                    disabled={bulkBusy || selectedIds.length === 0}
                    onClick={() => applyBulkStatus("rejected")}
                    className="btn-pop btn-soft-rose px-3 py-2 text-xs rounded-full border disabled:opacity-50"
                  >
                    Reject All
                  </button>
                </>
              ) : (
                <>
                  <button
                    disabled={bulkBusy || selectedIds.length === 0}
                    onClick={() => applyBulkStatus("pending")}
                    className="btn-pop btn-soft-amber px-3 py-2 text-xs rounded-full border disabled:opacity-50"
                  >
                    Mark Pending
                  </button>
                  <button
                    disabled={bulkBusy || selectedIds.length === 0}
                    onClick={() => applyBulkStatus("rejected")}
                    className="btn-pop btn-soft-rose px-3 py-2 text-xs rounded-full border disabled:opacity-50"
                  >
                    Reject All
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {bulkError && (
          <div className="mt-3 rounded-xl border border-[#f0d4d4] bg-[#fff1f1] px-4 py-2 text-xs text-[#7a1f1f]">
            {bulkError}
          </div>
        )}

        <div className="mt-4 hidden md:block">
          <div className="overflow-hidden rounded-xl">
            <table className="village-results-table w-full text-sm">
              <thead className="text-left text-[#7a1f1f]/80">
                <tr className="border-b border-[#ead8c4]">
                  {(statusFilter === "Pending" || statusFilter === "Accepted") && (
                    <th className="py-3 w-10">
                      <input
                        ref={selectAllHeaderRef}
                        type="checkbox"
                        onChange={toggleSelectAll}
                      />
                    </th>
                  )}
                  <th className="py-3">Full Name</th>
                  <th className="py-3">Std</th>
                  <th className="py-3">Medium</th>
                  <th className="py-3">Mobile</th>
                  <th className="py-3">%</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedResults.map((r) => (
                  <tr
                    key={r.id}
                    className="village-result-row border-b border-[#f0e2d2] hover:bg-[#fffaf0] cursor-pointer"
                    onClick={() => openResult(r.id)}
                  >
                    {(statusFilter === "Pending" || statusFilter === "Accepted") && (
                      <td className="py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.id)}
                          onChange={() => toggleSelect(r.id)}
                        />
                      </td>
                    )}
                    <td className="py-3">
                      <div className="inline-flex items-center gap-2">
                        <span>{r.full_name}</span>
                        {getSubmittedBadge(r) && (
                          <span className="rounded-full border border-[#ead8c4] px-2 py-0.5 text-[10px] font-semibold text-[#7a1f1f]/80">
                            {getSubmittedBadge(r)}
                          </span>
                        )}
                        {r.status === "pending" && (
                          <span className="rounded-full bg-[#c2410c] px-2 py-0.5 text-[10px] font-semibold text-white">
                            NEW
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">{r.standard}</td>
                    <td className="py-3">{r.medium}</td>
                    <td className="py-3">{r.mobile}</td>
                    <td className="py-3">{r.percentage}</td>
                    <td className="py-3">
                      {(() => {
                        const statusMeta = getResultStatusMeta(r.status);
                        return (
                      <span
                        className={`result-status-badge px-3 py-1 text-xs rounded-full border ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.label}
                      </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
                {filteredResults.length === 0 && (
                  <tr>
                    <td
                      className="py-4 text-sm text-[#7a1f1f]/70"
                      colSpan={7}
                    >
                      No results found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile list */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:hidden">
          {pagedResults.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-[#eddcc7] p-4 hover:shadow-md transition cursor-pointer"
              onClick={() => openResult(r.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium inline-flex items-center gap-2">
                    <span>{r.full_name}</span>
                    {r.status === "pending" && (
                      <span className="rounded-full bg-[#c2410c] px-2 py-0.5 text-[10px] font-semibold text-white">
                        NEW
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-[#7a1f1f]/70">
                    Std {r.standard} • {r.medium}
                  </p>
                  <p className="text-xs text-[#7a1f1f]/60">{r.mobile}</p>
                </div>
                {(statusFilter === "Pending" || statusFilter === "Accepted") &&
                  r.status === (statusFilter === "Pending" ? "pending" : "accepted") && (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`result-status-badge px-3 py-1 text-xs rounded-full border ${getResultStatusMeta(r.status).badgeClass}`}
                >
                  {getResultStatusMeta(r.status).label}
                </span>
                {getSubmittedBadge(r) && (
                  <span className="ml-2 rounded-full border border-[#ead8c4] px-2 py-1 text-[10px] font-semibold text-[#7a1f1f]/80">
                    {getSubmittedBadge(r)}
                  </span>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      applySingleStatus(r.id, "accepted");
                    }}
                    className="btn-pop btn-soft-mint px-3 py-1 text-xs rounded-full border"
                  >
                    Accept
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      applySingleStatus(r.id, "rejected");
                    }}
                    className="btn-pop btn-soft-rose px-3 py-1 text-xs rounded-full border"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredResults.length === 0 && (
            <div className="text-sm text-[#7a1f1f]/70">
              No results found.
            </div>
          )}
        </div>

        {filteredResults.length > 0 && (
          <div className="village-pagination mt-5 flex items-center justify-between text-sm">
            <span className="village-page-meta">
              Page {page} of {totalPages}
            </span>
            <div className="village-page-actions flex flex-wrap items-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-pop village-action-btn px-3 py-1 rounded-full border border-[#ead8c4] disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const isActive = p === page;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`btn-pop village-action-btn px-3 py-1 rounded-full border text-sm ${
                      isActive
                        ? "village-page-btn-active bg-[#7a1f1f] text-white border-[#7a1f1f]"
                        : "border-[#ead8c4] text-[#7a1f1f]"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-pop village-action-btn px-3 py-1 rounded-full border border-[#ead8c4] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile drawer */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40"
            onClick={() => setIsProfileOpen(false)}
          />
          <div className="profile-drawer w-full max-w-md bg-white h-full p-6 shadow-2xl rounded-l-3xl border-l border-[#ead8c4]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#7a1f1f]">Profile</h3>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="btn-pop btn-soft-amber w-8 h-8 rounded-full border flex items-center justify-center"
              >
                <IoClose />
              </button>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#fff6e5] border-2 border-[#7a1f1f]/20 flex items-center justify-center text-[#7a1f1f] text-xl font-semibold">
                {initials}
              </div>
              <div>
                <p className="text-lg font-semibold text-[#7a1f1f]">{profile.name}</p>
                <p className="text-sm text-[#7a1f1f]/70">Village Admin • {profile.village}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg border border-[#ead8c4] px-3 py-2">
                {profile.email}
              </div>
              <div className="rounded-lg border border-[#ead8c4] px-3 py-2">
                {profile.mobile}
              </div>
            </div>
            <p className="mt-5 text-sm text-[#7a1f1f]/70">
              If you need to change any profile details, please contact the admin.
            </p>
          </div>
        </div>
      )}
      </div>

    </AdminShell>
  );
}
