import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AdminShell from "../../components/admin/AdminShell";
import { useAdminData } from "../../context/AdminDataContext";
import { clearAdminAuth, getAdminTokenFor, getAdminUserFor } from "../../utils/adminAuth";
import { capitalizeWords } from "../../utils/format";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock, FaTimes, FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import { VILLAGE_OPTIONS } from "../../constants/villageOptions";
import { getResultStatusMeta, getSubmittedByLabel } from "../../utils/resultStatus";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const DASHBOARD_STATE_KEY = "super_admin_dashboard_state";
  const { error: resultsError, refresh: refreshResults } = useAdminData();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [adminList, setAdminList] = useState([]);
  const [adminListError, setAdminListError] = useState("");
  const [adminListLoading, setAdminListLoading] = useState(false);
  const [adminSummary, setAdminSummary] = useState([]);
  const superAdminUser = getAdminUserFor("super_admin");
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  // Active admin counter state
  const [activeCount, setActiveCount] = useState(0);
  const [activeCountError, setActiveCountError] = useState("");
  const [activeCountLoading, setActiveCountLoading] = useState(false);
  // Manage admin modal state
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [manageSearch, setManageSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const selectAllRef = useRef(null);
  const villageResultsRef = useRef(null);
  // Edit admin modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  // Village results state
  const [selectedVillage, setSelectedVillage] = useState("");
  const [villageResults, setVillageResults] = useState([]);
  const [villageTotal, setVillageTotal] = useState(0);
  const [villagePage, setVillagePage] = useState(1);
  const [villageLimit, setVillageLimit] = useState(10);
  const [villageStatus, setVillageStatus] = useState("all");
  const [villageSubmittedBy, setVillageSubmittedBy] = useState("all");
  const [villageSearch, setVillageSearch] = useState("");
  const currentYear = String(new Date().getFullYear());
  const [villageYear, setVillageYear] = useState(currentYear);
  const [villageStandard, setVillageStandard] = useState("");
  const [villageMedium, setVillageMedium] = useState("");
  const [villageLoading, setVillageLoading] = useState(false);
  const [villageError, setVillageError] = useState("");
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    village: "",
    villageOther: "",
    role: "village_admin",
  });
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [_pendingLoading, setPendingLoading] = useState(false);
  const [_pendingError, setPendingError] = useState("");
  const [_approvalSettings, setApprovalSettings] = useState({ globalEnabled: true, villageOverrides: [] });
  const [_settingsLoading, setSettingsLoading] = useState(false);
  const [_settingsError, setSettingsError] = useState("");
  const API_BASE = import.meta.env.VITE_API_URL;

  const renderInlineLoader = (text) => (
    <div className="sa-loader-card rounded-xl border border-[#eddcc7] px-4 py-3 text-sm text-[#7a1f1f]/80">
      <span className="sa-loader-dot" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );

  const forceAdminRelogin = (message = "Session expired. Please login again.") => {
    clearAdminAuth("super_admin");
    navigate("/admin/login", {
      replace: true,
      state: { forcedLogoutMessage: message },
    });
  };

  const superAdminFetch = async (path, options = {}) => {
    const token = getAdminTokenFor("super_admin");
    if (!token) {
      forceAdminRelogin("Admin session missing. Please login again.");
      throw new Error("Admin session missing");
    }
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data?.message || "Request failed";
      const authError =
        res.status === 401 ||
        res.status === 403 ||
        /invalid token|no token|expired|session|forbidden/i.test(String(message));
      if (authError) {
        forceAdminRelogin("Your admin session expired. Please login again.");
      }
      throw new Error(message);
    }
    return data;
  };

  useEffect(() => {
    const action = searchParams.get("action");
    if (!action) return;
    if (action === "add-admin") setIsCreateOpen(true);
    if (action === "manage-admins") setIsManageOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("action");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    try {
      const routeState = location.state?.returnState;
      if (routeState) {
        if (typeof routeState.selectedVillage === "string") setSelectedVillage(routeState.selectedVillage);
        if (Number.isFinite(routeState.villagePage)) setVillagePage(routeState.villagePage);
        if (Number.isFinite(routeState.villageLimit)) setVillageLimit(routeState.villageLimit);
        if (typeof routeState.villageStatus === "string") setVillageStatus(routeState.villageStatus);
        if (typeof routeState.villageSearch === "string") setVillageSearch(routeState.villageSearch);
        if (typeof routeState.villageYear === "string") setVillageYear(routeState.villageYear);
        if (typeof routeState.villageStandard === "string") setVillageStandard(routeState.villageStandard);
        if (typeof routeState.villageMedium === "string") setVillageMedium(routeState.villageMedium);
        return;
      }
      const raw = sessionStorage.getItem(DASHBOARD_STATE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Number.isFinite(saved.villagePage)) setVillagePage(saved.villagePage);
      if (Number.isFinite(saved.villageLimit)) setVillageLimit(saved.villageLimit);
      if (typeof saved.villageStatus === "string") setVillageStatus(saved.villageStatus);
      if (typeof saved.villageSearch === "string") setVillageSearch(saved.villageSearch);
      if (typeof saved.villageYear === "string") setVillageYear(saved.villageYear);
      if (typeof saved.villageStandard === "string") setVillageStandard(saved.villageStandard);
      if (typeof saved.villageMedium === "string") setVillageMedium(saved.villageMedium);
    } catch {
      // ignore storage parse issues
    }
  }, [location.state]);

  useEffect(() => {
    const payload = {
      villagePage,
      villageLimit,
      villageStatus,
      villageSearch,
      villageYear,
      villageStandard,
      villageMedium,
    };
    sessionStorage.setItem(DASHBOARD_STATE_KEY, JSON.stringify(payload));
  }, [
    villagePage,
    villageLimit,
    villageStatus,
    villageSearch,
    villageYear,
    villageStandard,
    villageMedium,
  ]);

  // Stats from admin summary (all villages)
  const stats = useMemo(() => {
    const totals = adminSummary.reduce(
      (acc, v) => {
        acc.total += Number(v.total || 0);
        acc.pending += Number(v.pending ?? v.Pending ?? 0);
        acc.reviewed += Number(v.reviewed ?? v.Reviewed ?? 0);
        acc.accepted += Number(v.accepted ?? v.Accepted ?? 0);
        acc.rejected += Number(v.rejected ?? v.Rejected ?? 0);
        return acc;
      },
      { total: 0, pending: 0, reviewed: 0, accepted: 0, rejected: 0 }
    );
    return [
      { label: "Total Results", value: totals.total, tone: "stat-total" },
      { label: "Pending", value: totals.pending, tone: "stat-pending" },
      { label: "Reviewed", value: totals.reviewed, tone: "stat-total" },
      { label: "Accepted", value: totals.accepted, tone: "stat-accepted" },
      { label: "Rejected", value: totals.rejected, tone: "stat-rejected" },
    ];
  }, [adminSummary]);

  // Pagination total pages for village results
  const villageTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(villageTotal / villageLimit));
  }, [villageTotal, villageLimit]);

  const filteredVillageResults = useMemo(() => {
    if (villageSubmittedBy === "all") return villageResults;
    return villageResults.filter((r) => {
      const role = String(r?.submitted_by_role || "user").toLowerCase();
      if (villageSubmittedBy === "you") return role === "super_admin";
      return role === villageSubmittedBy;
    });
  }, [villageResults, villageSubmittedBy]);

  const getVillageSubmittedLabel = (role) => {
    const key = String(role || "user").toLowerCase();
    if (key === "super_admin") return "You";
    return getSubmittedByLabel(key);
  };

  const scrollToVillageResults = () => {
    if (!villageResultsRef.current) return;
    const top = villageResultsRef.current.getBoundingClientRect().top + window.scrollY - 86;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  // Build summary map for village cards
  const summaryMap = useMemo(() => {
    const map = {};
    adminSummary.forEach((row) => {
      map[row.village] = row;
    });
    return map;
  }, [adminSummary]);

  // Collect villages from admins + summary
  const villageOptions = useMemo(() => {
    const set = new Set();
    adminList
      .filter((a) => a.role === "village_admin")
      .forEach((a) => {
        if (a.village) set.add(a.village);
      });
    adminSummary.forEach((row) => {
      if (row.village) set.add(row.village);
    });
    return Array.from(set).sort();
  }, [adminList, adminSummary]);

  const yearOptions = useMemo(() => {
    const years = new Set([currentYear]);
    villageResults.forEach((item) => {
      const date = new Date(item?.createdAt || item?.updatedAt || 0);
      if (!Number.isNaN(date.getTime())) {
        const year = String(date.getFullYear());
        if (Number(year) >= Number(currentYear)) years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => Number(a) - Number(b));
  }, [villageResults, currentYear]);

  const handleTopStatClick = (label) => {
    const key = String(label || "").toLowerCase();
    const nextStatus =
      key === "pending"
        ? "pending"
        : key === "reviewed"
        ? "reviewed"
        : key === "accepted"
        ? "accepted"
        : key === "rejected"
        ? "rejected"
        : "all";
    setVillageStatus(nextStatus);
    setVillagePage(1);
    if (!selectedVillage && villageOptions.length > 0) {
      setSelectedVillage(villageOptions[0]);
      return;
    }
    requestAnimationFrame(() => {
      setTimeout(scrollToVillageResults, 20);
    });
  };

  // Map village to admin names (village admins)
  const adminNamesByVillage = useMemo(() => {
    const map = {};
    adminList
      .filter((a) => a.role === "village_admin")
      .forEach((a) => {
        if (!a.village) return;
        if (!map[a.village]) map[a.village] = [];
        map[a.village].push(a.name);
      });
    return map;
  }, [adminList]);

  // Filter admin list for manage view
  const filteredAdmins = useMemo(() => {
    const term = manageSearch.trim().toLowerCase();
    return adminList.filter((a) => {
      // Show only village admins in manage list
      if (a.role !== "village_admin") return false;
      if (!term) return true;
      return [a.name, a.email, a.village]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [adminList, manageSearch]);

  // Deletable admins (exclude super admins)
  const deletableAdmins = useMemo(
    () => filteredAdmins.filter((a) => a.role !== "super_admin"),
    [filteredAdmins]
  );
  const villageValues = useMemo(
    () => new Set(VILLAGE_OPTIONS.filter((v) => v.value !== "other").map((v) => v.value)),
    []
  );

  // Fetch admin list on load
  useEffect(() => {
    fetchAdmins();
    fetchSummary();
    fetchActiveCount();
    fetchPendingUsers();
    fetchApprovalSettings();
    // Poll admin list for live active status (reduced frequency to prevent UI disturbance)
    const id = setInterval(() => {
      fetchAdmins();
      fetchActiveCount();
      fetchPendingUsers();
    }, 15000); // Increased from 5 seconds to 15 seconds
    return () => clearInterval(id);
  }, []);

  // Reload results when filters change
  useEffect(() => {
    if (!selectedVillage) return;
    fetchVillageResults(1, villageLimit);
  }, [selectedVillage, villageStatus, villageSearch, villageYear, villageStandard, villageMedium]);

  useEffect(() => {
    if (!selectedVillage || !villageResultsRef.current) return;
    villageResultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedVillage]);

  useEffect(() => {
    if (!selectedVillage || villageLoading || !villageResultsRef.current) return;
    villageResultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedVillage, villageLoading, villageResults.length]);

  // Reload results when page or limit changes
  useEffect(() => {
    if (!selectedVillage) return;
    fetchVillageResults(villagePage, villageLimit);
  }, [villagePage, villageLimit]);

  // Keep select-all checkbox in sync
  useEffect(() => {
    if (!selectAllRef.current) return;
    const total = deletableAdmins.length;
    const checked = selectedIds.length;
    selectAllRef.current.indeterminate = checked > 0 && checked < total;
    selectAllRef.current.checked = total > 0 && checked === total;
  }, [deletableAdmins, selectedIds]);

  // Create admin handler (super_admin only)
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminError("");
    setAdminLoading(true);
    try {
      const finalVillage =
        adminForm.role === "village_admin"
          ? adminForm.village === "other"
            ? capitalizeWords(adminForm.villageOther || "")
            : adminForm.village
          : "";
      if (adminForm.role === "village_admin" && !finalVillage.trim()) {
        throw new Error("Village is required for village admin.");
      }
      await superAdminFetch("/api/auth/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...adminForm, village: finalVillage }),
      });
      setAdminForm({
        name: "",
        email: "",
        password: "",
        mobile: "",
        village: "",
        villageOther: "",
        role: "village_admin",
      });
      setIsCreateOpen(false);
      // Refresh admin list after create
      fetchAdmins();
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  // Load admin list for active status
  const fetchAdmins = async () => {
    setAdminListError("");
    setAdminListLoading(true);
    try {
      const data = await superAdminFetch("/api/auth/admins");
      setAdminList(data);
    } catch (err) {
      setAdminListError(err.message);
    } finally {
      setAdminListLoading(false);
    }
  };

  // Load active admin count
  const fetchActiveCount = async () => {
    setActiveCountError("");
    setActiveCountLoading(true);
    try {
      const data = await superAdminFetch("/api/auth/admins/active-count");
      setActiveCount(data.activeCount || 0);
    } catch (err) {
      setActiveCountError(err.message);
    } finally {
      setActiveCountLoading(false);
    }
  };

  // Load admin summary for super admin
  const fetchSummary = async () => {
    setSummaryError("");
    setSummaryLoading(true);
    try {
      const data = await superAdminFetch("/api/results/admin/summary");
      setAdminSummary(data);
    } catch (err) {
      setSummaryError(err.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Load village results for selected village
  const fetchVillageResults = async (nextPage = villagePage, nextLimit = villageLimit) => {
    if (!selectedVillage) return;
    setVillageError("");
    setVillageLoading(true);
    try {
      const params = new URLSearchParams({
        village: selectedVillage,
        status: villageStatus,
        search: villageSearch,
        year: villageYear,
        standard: villageStandard,
        medium: villageMedium,
        page: String(nextPage),
        limit: String(nextLimit),
      });
      const data = await superAdminFetch(`/api/results/admin/list?${params.toString()}`);
      setVillageResults(data.data || []);
      setVillageTotal(data.total || 0);
      setVillagePage(data.page || nextPage);
      setVillageLimit(data.limit || nextLimit);
    } catch (err) {
      setVillageError(err.message);
    } finally {
      setVillageLoading(false);
    }
  };

  // Delete single admin
  const handleDeleteAdmin = async (id) => {
    if (!window.confirm("Delete this admin?")) return;
    try {
      await superAdminFetch(`/api/auth/admins/${id}`, {
        method: "DELETE",
      });
      fetchAdmins();
    } catch (err) {
      setAdminListError(err.message);
    }
  };

  // Bulk delete admins
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm("Delete selected admins?")) return;
    try {
      await superAdminFetch("/api/auth/admins/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      setSelectedIds([]);
      fetchAdmins();
    } catch (err) {
      setAdminListError(err.message);
    }
  };

  // Update admin
  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!editForm?.id) return;
    setEditError("");
    setEditLoading(true);
    try {
      const finalVillage =
        editForm.role === "village_admin"
          ? editForm.village === "other"
            ? capitalizeWords(editForm.villageOther || "")
            : editForm.village
          : "";
      if (editForm.role === "village_admin" && !finalVillage.trim()) {
        throw new Error("Village is required for village admin.");
      }
      await superAdminFetch(`/api/auth/admins/${editForm.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...editForm, village: finalVillage }),
      });
      setIsEditOpen(false);
      setEditForm(null);
      fetchAdmins();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    setPendingError("");
    setPendingLoading(true);
    try {
      const data = await superAdminFetch("/api/auth/users/pending");
      setPendingUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setPendingError(err.message || "Failed to load pending users");
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchApprovalSettings = async () => {
    setSettingsLoading(true);
    setSettingsError("");
    try {
      const data = await superAdminFetch("/api/auth/approval-settings");
      setApprovalSettings({
        globalEnabled: Boolean(data.globalEnabled),
        villageOverrides: Array.isArray(data.villageOverrides) ? data.villageOverrides : [],
      });
    } catch (err) {
      setSettingsError(err.message || "Failed to load approval settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  const _updateGlobalApproval = async (enabled) => {
    try {
      const data = await superAdminFetch("/api/auth/approval-settings/global", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      });
      setApprovalSettings((prev) => ({ ...prev, globalEnabled: Boolean(data.globalEnabled) }));
    } catch (err) {
      setSettingsError(err.message || "Failed to update global setting");
    }
  };

  const _updateVillageApproval = async (village, enabled) => {
    try {
      const data = await superAdminFetch("/api/auth/approval-settings/village", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ village, enabled }),
      });
      setApprovalSettings((prev) => ({
        ...prev,
        villageOverrides: Array.isArray(data.villageOverrides) ? data.villageOverrides : prev.villageOverrides,
      }));
    } catch (err) {
      setSettingsError(err.message || "Failed to update village setting");
    }
  };

  const _updatePendingStatus = async (id, action) => {
    try {
      await superAdminFetch(`/api/auth/users/${id}/${action}`, {
        method: "PATCH",
      });
      fetchPendingUsers();
    } catch (err) {
      setPendingError(err.message || `Failed to ${action} user`);
    }
  };

  return (
    <AdminShell
      title="Super Admin Control Center"
      roleLabel="Super Admin"
      actions={
        <>
          {/* Open actions page (admin creation) */}
          <button
            onClick={() => navigate("/admin/super/submit-result")}
            className="gpu-accelerated admin-card super-add-result-btn px-3 py-2 md:px-4 md:py-2 rounded-full text-xs md:text-sm transition-all duration-200 hover:scale-105 active:scale-95 font-semibold"
          >
            + Add Result
          </button>
          <button
            onClick={() => navigate("/admin/super/actions?tab=admins&action=add-admin")}
            className="gpu-accelerated admin-card px-3 py-2 md:px-4 md:py-2 rounded-full bg-white text-[#7a1f1f] text-xs md:text-sm hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            + Add Admin
          </button>
          <button
            onClick={() => navigate("/admin/super/actions?tab=announcements")}
            className="gpu-accelerated admin-card px-3 py-2 md:px-4 md:py-2 rounded-full bg-[#7a1f1f] text-white text-xs md:text-sm hover:opacity-90 hover:scale-105 transition-all duration-200"
          >
            + New Announcement
          </button>
        </>
      }
    >
      <style>{`
        .admin-theme-dark .super-admin-page .admins-panel,
        .admin-theme-dark .super-admin-page .quick-actions-panel,
        .admin-theme-dark .super-admin-page .summary-panel {
          background: #1a2235 !important;
          border-color: #31405f !important;
          color: #e6efff !important;
        }
        .admin-theme-dark .super-admin-page .admins-panel h2,
        .admin-theme-dark .super-admin-page .admins-panel p,
        .admin-theme-dark .super-admin-page .admins-panel span,
        .admin-theme-dark .super-admin-page .quick-actions-panel h2,
        .admin-theme-dark .super-admin-page .quick-actions-panel p,
        .admin-theme-dark .super-admin-page .quick-actions-panel span,
        .admin-theme-dark .super-admin-page .summary-panel h2,
        .admin-theme-dark .super-admin-page .summary-panel p,
        .admin-theme-dark .super-admin-page .summary-panel span {
          color: #e6efff !important;
        }
        .super-admin-page .admin-card {
          box-shadow: 0 12px 28px rgba(122, 31, 31, 0.12);
        }
        .super-add-result-btn {
          background: linear-gradient(135deg, #fff8ee 0%, #ffe9cb 55%, #ffd8a8 100%);
          border: 1px solid #efc997;
          color: #7a3f24;
          box-shadow: 0 8px 18px rgba(198, 137, 72, 0.2);
        }
        .super-add-result-btn:hover {
          background: linear-gradient(135deg, #fffdf9 0%, #ffeccf 52%, #ffd39c 100%);
          border-color: #e6bd87;
          box-shadow: 0 12px 22px rgba(198, 137, 72, 0.26);
          transform: translateY(-1px) scale(1.04);
        }
        .super-add-result-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(247, 201, 146, 0.45), 0 10px 20px rgba(198, 137, 72, 0.24);
        }
        .admin-theme-dark .super-admin-page .admin-card {
          box-shadow: 0 14px 32px rgba(6, 14, 30, 0.48) !important;
        }
        .admin-theme-dark .super-add-result-btn {
          background: linear-gradient(135deg, #1f3f75 0%, #1e4f96 52%, #1d4f8a 100%) !important;
          border-color: #d6b36a !important;
          color: #eff6ff !important;
          box-shadow: 0 12px 24px rgba(8, 20, 46, 0.5) !important;
        }
        .admin-theme-dark .super-add-result-btn:hover {
          background: linear-gradient(135deg, #244a88 0%, #2460b0 50%, #225c9f 100%) !important;
          border-color: #e5c67f !important;
          box-shadow: 0 14px 28px rgba(8, 20, 46, 0.58) !important;
        }
        .admin-theme-dark .super-add-result-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(214, 179, 106, 0.42), 0 12px 24px rgba(8, 20, 46, 0.56) !important;
        }
        .super-admin-page .stat-card {
          border: 1px solid #d3dceb;
        }
        .super-admin-page .stat-total {
          background: linear-gradient(135deg, #e6f2ff 0%, #f3f8ff 100%);
        }
        .super-admin-page .stat-pending {
          background: linear-gradient(135deg, #fff8dc 0%, #fff2bf 100%);
        }
        .super-admin-page .stat-accepted {
          background: linear-gradient(135deg, #ebfaee 0%, #f4fff6 100%);
        }
        .super-admin-page .stat-rejected {
          background: linear-gradient(135deg, #ffe9e9 0%, #fff4f4 100%);
        }
        .super-admin-page .stat-card .stat-label,
        .super-admin-page .stat-card .stat-value {
          color: #111827 !important;
        }
        .admin-theme-dark .super-admin-page .stat-card,
        .admin-theme-dark .super-admin-page .stat-card * {
          color: #111827 !important;
        }
        .admin-theme-dark .super-admin-page .summary-panel .summary-stat-chip {
          color: #111827 !important;
        }
        .admin-theme-dark .super-admin-page .summary-panel .summary-refresh-btn {
          color: #f8fbff !important;
          border-color: #5a6f96 !important;
        }
        @keyframes villageResultsIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .super-admin-page .village-results-enter {
          animation: villageResultsIn 0.35s ease-out both;
        }
        .super-admin-page .village-results-panel {
          box-shadow: 0 12px 28px rgba(122, 31, 31, 0.08);
        }
        .super-admin-page .village-filter-control {
          transition: all 0.2s ease;
        }
        .super-admin-page .village-filter-control:hover {
          background: #fff5e8;
          border-color: #dfbe9b;
          box-shadow: 0 8px 18px rgba(122, 31, 31, 0.08);
        }
        .super-admin-page .village-filter-control:focus {
          outline: none;
          border-color: #7a1f1f;
          box-shadow: 0 0 0 2px rgba(122, 31, 31, 0.18);
        }
        .super-admin-page .village-results-panel .village-action-btn {
          transition: all 0.2s ease;
        }
        .super-admin-page .village-results-panel .village-action-btn:hover {
          background: #fff2df;
          box-shadow: 0 10px 18px rgba(122, 31, 31, 0.1);
        }
        .super-admin-page .village-results-panel .village-result-row {
          transition: background-color 0.2s ease;
        }
        .super-admin-page .village-results-panel .village-result-row:hover {
          background: #fff3df;
        }
        .super-admin-page .village-results-panel .village-result-row td {
          padding-top: 0.85rem;
          padding-bottom: 0.85rem;
        }
        .super-admin-page .village-results-panel .village-pagination {
          margin-top: 1.25rem;
          padding-top: 0.9rem;
          border-top: 1px solid #ebd5bd;
        }
        .super-admin-page .village-results-panel .village-page-meta {
          background: #fff2e2;
          border: 1px solid #e7c8a9;
          color: #7a1f1f;
          padding: 0.35rem 0.8rem;
          border-radius: 9999px;
          font-weight: 500;
        }
        .super-admin-page .village-results-panel .village-page-actions {
          background: #fff6ea;
          border: 1px solid #ead2b7;
          border-radius: 9999px;
          padding: 0.3rem;
          gap: 0.4rem;
        }
        .super-admin-page .sa-loader-card {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          background: #fffaf4;
        }
        .super-admin-page .sa-loader-dot {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 2px solid #e7c7a3;
          border-top-color: #7a1f1f;
          animation: saSpin 0.9s linear infinite;
          flex-shrink: 0;
        }
        .super-admin-page .sa-loader-inline {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        @keyframes saSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .admin-theme-dark .super-admin-page .village-results-panel {
          background: #1c273d !important;
          border-color: #344a72 !important;
          color: #b5b5ff !important;
          box-shadow: 0 14px 32px rgba(7, 14, 30, 0.45) !important;
        }
        .admin-theme-dark .super-admin-page .village-results-panel h2,
        .admin-theme-dark .super-admin-page .village-results-panel th,
        .admin-theme-dark .super-admin-page .village-results-panel td,
        .admin-theme-dark .super-admin-page .village-results-panel p {
          color: #e7efff !important;
        }
        .admin-theme-dark .super-admin-page .village-results-panel input,
        .admin-theme-dark .super-admin-page .village-results-panel select {
          background: #121d32 !important;
          border-color: #576b93 !important;
          color: #f3f7ff !important;
        }
        .admin-theme-dark .super-admin-page .village-results-panel .village-filter-control:hover {
          background: #1d2c47 !important;
          border-color: #6c80a8 !important;
          box-shadow: 0 8px 18px rgba(8, 16, 34, 0.45) !important;
        }
        .admin-theme-dark .super-admin-page .village-results-panel .village-filter-control:focus {
          box-shadow: 0 0 0 2px rgba(145, 172, 222, 0.35) !important;
        }
        .admin-theme-dark .super-admin-page .village-results-panel input::placeholder {
          color: #2d313a !important;
        }
        .admin-theme-dark .super-admin-page .village-results-panel .village-results-table thead tr {
          border-color: #4c618a !important;
        }
        .admin-theme-dark .super-admin-page .village-results-panel .village-result-row {
          border-color: #3f537c !important;
        }
        .admin-theme-dark .super-admin-page .village-results-panel .village-result-row:hover {
          background: #243652 !important;
        }
        .admin-theme-dark .super-admin-page .village-results-panel .village-action-btn {
          color: #edf3ff !important;
          border-color: #5a6f96 !important;
        }
        .admin-theme-dark .super-admin-page .village-results-panel .village-action-btn:hover {
          background: #25385a !important;
          box-shadow: 0 10px 20px rgba(6, 14, 30, 0.45) !important;
        }
        .admin-theme-dark .super-admin-page .village-results-panel .village-page-meta {
          background: #15233a !important;
          border-color: #4f6692 !important;
          color: #dce7ff !important;
        }
        .admin-theme-dark .super-admin-page .village-results-panel .village-page-actions {
          background: #16253d !important;
          border-color: #4f6692 !important;
        }
        .admin-theme-dark .super-admin-page .sa-loader-card {
          background: #16253d !important;
          border-color: #4f6692 !important;
          color: #dce7ff !important;
        }
        .admin-theme-dark .super-admin-page .sa-loader-dot {
          border-color: #4f6692 !important;
          border-top-color: #dce7ff !important;
        }
        .admin-theme-dark .super-admin-page .village-results-panel .village-page-btn-active {
          background: #7a1f1f !important;
          border-color: #7a1f1f !important;
          color: #ffffff !important;
        }
        .admin-theme-dark .super-admin-page .result-status-badge {
          border: 1px solid transparent !important;
        }
        .admin-theme-dark .super-admin-page .result-status-badge.result-status-accepted {
          background: #14532d !important;
          color: #dcfce7 !important;
          border-color: #22c55e !important;
        }
        .admin-theme-dark .super-admin-page .result-status-badge.result-status-rejected {
          background: #7f1d1d !important;
          color: #fee2e2 !important;
          border-color: #ef4444 !important;
        }
        .admin-theme-dark .super-admin-page .result-status-badge.result-status-pending {
          background: #7c2d12 !important;
          color: #ffedd5 !important;
          border-color: #f97316 !important;
        }
        .admin-theme-dark .super-admin-page .result-status-badge.result-status-reviewed {
          background: #1e3a8a !important;
          color: #dbeafe !important;
          border-color: #3b82f6 !important;
        }
        @media (max-width: 767px) {
          .super-admin-page .admin-card {
            border-radius: 1rem;
          }
          .super-admin-page .admins-panel,
          .super-admin-page .quick-actions-panel,
          .super-admin-page .summary-panel,
          .super-admin-page .village-results-panel {
            padding: 0.9rem !important;
          }
          .super-admin-page .quick-actions-panel button {
            min-height: 2.8rem;
            padding-top: 0.55rem !important;
            padding-bottom: 0.55rem !important;
          }
          .super-admin-page .summary-panel .summary-stat-chip {
            padding: 0.3rem 0.45rem;
          }
          .super-admin-page .village-results-panel .village-result-row td {
            padding-top: 0.65rem;
            padding-bottom: 0.65rem;
            white-space: nowrap;
          }
          .super-admin-page .village-results-panel .village-pagination {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.6rem;
          }
          .super-admin-page .village-results-panel .village-page-actions {
            width: 100%;
            overflow-x: auto;
            flex-wrap: nowrap;
            scrollbar-width: thin;
          }
        }
      `}</style>
      <div className="super-admin-page">
      {/* Overview */}
      {/* Results load error banner (temporary debug) */}
      {resultsError && (
        <div className="mb-4 rounded-xl border border-[#f0d4d4] bg-[#fff1f1] px-4 py-3 text-sm text-[#7a1f1f]">
          Failed to load results: {resultsError}
          <button
            onClick={refreshResults}
            className="ml-3 rounded-full border border-[#e7d3bd] px-3 py-1 text-xs"
          >
            Refresh Results
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => handleTopStatClick(s.label)}
            className={`admin-card stat-card ${s.tone} rounded-2xl p-4 text-left transition hover:shadow-md`}
          >
            <p className="stat-label text-xs uppercase tracking-[0.18em]">
              {s.label}
            </p>
            <p className="stat-value mt-2 text-2xl md:text-3xl font-semibold">
              {s.value}
            </p>
          </button>
        ))}
      </div>

      {/* Admins */}
      <div className="mt-5 md:mt-8 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 md:gap-6">
        <div className="admin-card admins-panel bg-white border border-[#eddcc7] rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#7a1f1f]">Admins</h2>
            <span className="text-xs text-[#7a1f1f]/70">Village mapping</span>
          </div>
          <div className="mt-4 space-y-3">
            {/* Active admin counter */}
            {activeCountLoading && (
              renderInlineLoader("Loading active admins...")
            )}
            {activeCountError && (
              <div className="rounded-xl border border-[#eddcc7] px-4 py-3 text-sm text-red-600">
                {activeCountError}
              </div>
            )}
            {!activeCountLoading && !activeCountError && (
              <div className="flex items-center justify-between rounded-xl border border-[#eddcc7] px-4 py-3">
                <span className="text-xs uppercase tracking-[0.18em] text-[#7a1f1f]/70">
                  Active Admins
                </span>
                <span className="text-lg font-semibold text-[#15803d]">
                  {activeCount}
                </span>
              </div>
            )}
            </div>
          </div>

        {/* Quick Actions */}
        <div className="admin-card quick-actions-panel bg-white border border-[#eddcc7] rounded-2xl p-4 md:p-5">
          <h2 className="text-lg font-semibold text-[#7a1f1f]">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Manage admin action */}
            <button
              onClick={() => navigate("/admin/super/actions?tab=admins&action=manage-admins")}
              className="admin-card rounded-xl bg-[#fff6e5] px-3 py-3 md:py-4 text-xs md:text-sm text-[#7a1f1f] hover:shadow-md transition"
            >
              Manage Admins
            </button>
            <button
              onClick={() => navigate("/admin/super/actions?tab=gallery")}
              className="admin-card rounded-xl bg-[#fff6e5] px-3 py-3 md:py-4 text-xs md:text-sm text-[#7a1f1f] hover:shadow-md transition"
            >
              Manage Gallery
            </button>
            <button
              onClick={() => navigate("/admin/super/actions?tab=hero")}
              className="admin-card rounded-xl bg-[#fff6e5] px-3 py-3 md:py-4 text-xs md:text-sm text-[#7a1f1f] hover:shadow-md transition"
            >
              Hero Slider
            </button>
            <button
              onClick={() => navigate("/admin/super/actions?tab=announcements")}
              className="admin-card rounded-xl bg-[#fff6e5] px-3 py-3 md:py-4 text-xs md:text-sm text-[#7a1f1f] hover:shadow-md transition"
            >
              Announcements
            </button>
            <button
              onClick={() => navigate("/admin/super/actions?tab=export")}
              className="admin-card rounded-xl bg-[#fff6e5] px-3 py-3 md:py-4 text-xs md:text-sm text-[#7a1f1f] hover:shadow-md transition"
            >
              Export Results
            </button>
            <button
              onClick={() => navigate("/admin/super/actions?tab=approvals")}
              className="relative admin-card rounded-xl bg-[#fff6e5] px-3 py-3 md:py-4 text-xs md:text-sm text-[#7a1f1f] hover:shadow-md transition"
            >
              User Approvals
              {pendingUsers.length > 0 && (
                <span className="absolute -top-2 -right-2 rounded-full bg-[#c2410c] px-2 py-0.5 text-[10px] font-semibold text-white">
                  {pendingUsers.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>


      {/* Summary */}
      <div className="mt-5 md:mt-8 admin-card summary-panel bg-white border border-[#eddcc7] rounded-2xl p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#7a1f1f]">Admin Summary</h2>
          <button
            onClick={fetchSummary}
            disabled={summaryLoading}
            className="summary-refresh-btn px-3 py-1 rounded-full border border-[#ead8c4] text-sm text-[#7a1f1f]"
          >
            {summaryLoading ? (
              <span className="sa-loader-inline">
                <span className="sa-loader-dot" aria-hidden="true" />
                Refreshing
              </span>
            ) : (
              "Refresh"
            )}
          </button>
        </div>

        {/* Summary load state */}
        {summaryLoading && (
          <div className="mt-3">{renderInlineLoader("Loading village summary...")}</div>
        )}
        {summaryError && (
          <div className="mt-3 text-sm text-red-600">{summaryError}</div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
          {villageOptions.map((village) => {
            const row = summaryMap[village] || {
              village,
              total: 0,
              pending: 0,
              reviewed: 0,
              accepted: 0,
              rejected: 0,
            };
            const pendingCount = Number(row.pending ?? row.Pending ?? 0);
            const reviewedCount = Number(row.reviewed ?? row.Reviewed ?? 0);
            const acceptedCount = Number(row.accepted ?? row.Accepted ?? 0);
            const rejectedCount = Number(row.rejected ?? row.Rejected ?? 0);
            const names = adminNamesByVillage[village] || [];
            const isActive = selectedVillage === village;
            return (
              <button
                key={village}
                onClick={() => {
                  setSelectedVillage(village);
                  setVillagePage(1);
                }}
                className={`rounded-xl border p-3 md:p-4 text-left transition ${
                  isActive ? "border-[#7a1f1f] ring-2 ring-[#7a1f1f]/20" : "border-[#eddcc7]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{row.village}</p>
                  {pendingCount > 0 && (
                    <span className="rounded-full bg-[#c2410c] text-white px-2 py-0.5 text-[10px] font-semibold">
                      {pendingCount} NEW
                    </span>
                  )}
                </div>
                {/* Show admin name next to village */}
                  <p className="mt-1 text-xs text-[#7a1f1f]/60 line-clamp-2">
                  {names.length ? `Admin: ${names.join(", ")}` : "Admin: Unassigned"}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="summary-stat-chip rounded-lg bg-[#fff6e5] px-2 py-1">
                    Total: {row.total}
                  </div>
                  <div className="summary-stat-chip rounded-lg bg-[#fff7ed] px-2 py-1">
                    Pending: {pendingCount}
                  </div>
                  <div className="summary-stat-chip rounded-lg bg-[#eef2ff] px-2 py-1">
                    Reviewed: {reviewedCount}
                  </div>
                  <div className="summary-stat-chip rounded-lg bg-[#ecfdf3] px-2 py-1">
                    Accepted: {acceptedCount}
                  </div>
                  <div className="summary-stat-chip rounded-lg bg-[#fee2e2] px-2 py-1">
                    Rejected: {rejectedCount}
                  </div>
                </div>
              </button>
            );
          })}
          {villageOptions.length === 0 && !summaryLoading && !summaryError && (
            <div className="text-sm text-[#7a1f1f]/70">No summary available.</div>
          )}
        </div>
      </div>

      {/* Manage admins modal */}
      {isManageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn gpu-accelerated">
          {/* Enhanced backdrop */}
          <div
            className="modal-backdrop absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70 gpu-accelerated"
            style={{ backdropFilter: "blur(25px)" }}
            onClick={() => setIsManageOpen(false)}
          />
          <div className="relative w-full max-w-6xl rounded-2xl md:rounded-3xl bg-gradient-to-br from-white/95 via-white/90 to-white/95 p-4 sm:p-6 md:p-10 shadow-2xl border border-white/20 backdrop-blur-xl animate-slideInUp max-h-[92vh] overflow-hidden flex flex-col">
            {/* Premium header */}
            <div className="flex items-center justify-between border-b border-[#ead8c4]/50 pb-6 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7a1f1f] to-[#a83232] flex items-center justify-center shadow-lg">
                  <FaUser className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-[#7a1f1f] tracking-tight">
                    Administrator Management
                  </h3>
                  <p className="text-sm text-[#7a1f1f]/70 mt-1">
                    Comprehensive admin oversight and control panel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsManageOpen(false)}
                className="w-10 h-10 rounded-full border border-[#ead8c4]/50 text-[#7a1f1f] hover:bg-[#fff6e5] hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-sm"
                aria-label="Close"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            {/* Enhanced manage actions */}
            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 flex-shrink-0">
              <div className="relative flex-1 md:max-w-md">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#7a1f1f]/60" />
                <input
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                  placeholder="Search by name, email, or village..."
                  className="w-full rounded-2xl border border-[#ead8c4]/70 bg-gradient-to-r from-[#fcfbf9] to-[#faf8f5] pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30 focus:border-[#7a1f1f]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                />
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#7a1f1f] to-[#a83232] text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  <FaPlus className="text-sm" />
                  Add Admin
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedIds.length === 0}
                  className="px-5 py-3 rounded-2xl border-2 border-red-300 bg-white text-red-600 font-medium hover:bg-red-50 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <FaTrash className="text-sm" />
                  Delete Selected ({selectedIds.length})
                </button>
              </div>
            </div>

            {/* Admin list */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[#7a1f1f]/80">
                  <tr className="border-b border-[#ead8c4]">
                    <th className="py-3 w-10">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        onChange={() => {
                          if (selectedIds.length === deletableAdmins.length) {
                            setSelectedIds([]);
                          } else {
                            setSelectedIds(deletableAdmins.map((a) => a.id));
                          }
                        }}
                      />
                    </th>
                    <th className="py-3">Name</th>
                    <th className="py-3">Email</th>
                    <th className="py-3">Village</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminListLoading && (
                    <tr>
                      <td colSpan={6} className="py-4 text-sm text-[#7a1f1f]/70">
                        Loading admins...
                      </td>
                    </tr>
                  )}
                  {adminListError && (
                    <tr>
                      <td colSpan={6} className="py-4 text-sm text-red-600">
                        {adminListError}
                      </td>
                    </tr>
                  )}
                  {!adminListLoading &&
                    !adminListError &&
                    filteredAdmins.map((a) => (
                      <tr key={a.id} className="border-b border-[#f0e2d2]">
                        <td className="py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(a.id)}
                            disabled={a.role === "super_admin"}
                            onChange={() => {
                              setSelectedIds((prev) =>
                                prev.includes(a.id)
                                  ? prev.filter((x) => x !== a.id)
                                  : [...prev, a.id]
                              );
                            }}
                          />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span>{a.name}</span>
                            {superAdminUser?.id === String(a.id) && (
                              <span className="text-xs rounded-full bg-[#fff6e5] px-2 py-0.5 text-[#7a1f1f]">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3">{a.email}</td>
                        <td className="py-3">{a.village}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              a.active
                                ? "bg-[#ecfdf3] text-[#15803d]"
                                : "bg-[#fff7ed] text-[#c2410c]"
                            }`}
                          >
                            {a.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const resolvedVillage = a.village || "";
                                const isKnownVillage = villageValues.has(resolvedVillage);
                                setEditForm({
                                  id: a.id,
                                  name: a.name,
                                  email: a.email,
                                  mobile: a.mobile || "",
                                  village: isKnownVillage ? resolvedVillage : resolvedVillage ? "other" : "",
                                  villageOther: isKnownVillage ? "" : resolvedVillage,
                                  role: a.role,
                                  password: "",
                                });
                                setIsEditOpen(true);
                              }}
                              className="px-3 py-1 rounded-full border border-[#ead8c4] text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(a.id)}
                              disabled={a.role === "super_admin"}
                              className="px-3 py-1 rounded-full border border-[#ead8c4] text-xs disabled:opacity-40"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {!adminListLoading && !adminListError && filteredAdmins.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-sm text-[#7a1f1f]/70">
                        No admins found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit admin modal */}
      {isEditOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
          {/* Enhanced backdrop */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"
            style={{ backdropFilter: "blur(25px)" }}
            onClick={() => setIsEditOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl md:rounded-3xl bg-gradient-to-br from-white/95 via-white/90 to-white/95 p-4 sm:p-6 md:p-10 shadow-2xl border border-white/20 backdrop-blur-xl animate-slideInUp max-h-[92vh] overflow-y-auto">
            {/* Premium header */}
            <div className="flex items-center justify-between border-b border-[#ead8c4]/50 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7a1f1f] to-[#a83232] flex items-center justify-center shadow-lg">
                  <FaEdit className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-[#7a1f1f] tracking-tight">
                    Update Administrator
                  </h3>
                  <p className="text-sm text-[#7a1f1f]/70 mt-1">
                    Modify admin details and permissions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="w-10 h-10 rounded-full border border-[#ead8c4]/50 text-[#7a1f1f] hover:bg-[#fff6e5] hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-sm"
                aria-label="Close"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            {/* Enhanced form */}
            <form className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleUpdateAdmin}>
              {/* Name with icon */}
              <div>
                <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                  <FaUser className="text-[#7a1f1f]/60" />
                  Full Name
                </label>
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, name: capitalizeWords(e.target.value) }))
                  }
                  className="mt-3 w-full rounded-2xl border border-[#ead8c4]/70 bg-gradient-to-r from-[#fcfbf9] to-[#faf8f5] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30 focus:border-[#7a1f1f]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                  placeholder="Enter full name"
                />
              </div>

              {/* Email with icon */}
              <div>
                <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                  <FaEnvelope className="text-[#7a1f1f]/60" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  className="mt-3 w-full rounded-2xl border border-[#ead8c4]/70 bg-gradient-to-r from-[#fcfbf9] to-[#faf8f5] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30 focus:border-[#7a1f1f]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                  placeholder="admin@example.com"
                />
              </div>

              {/* Mobile with icon */}
              <div>
                <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                  <FaPhone className="text-[#7a1f1f]/60" />
                  Mobile Number
                </label>
                <input
                  value={editForm.mobile}
                  onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))}
                  className="mt-3 w-full rounded-2xl border border-[#ead8c4]/70 bg-gradient-to-r from-[#fcfbf9] to-[#faf8f5] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30 focus:border-[#7a1f1f]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                  placeholder="+91 9876543210"
                />
              </div>

              {/* Village with icon */}
              {editForm.role === "village_admin" && (
              <div>
                <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-[#7a1f1f]/60" />
                  Village
                </label>
                <select
                  value={editForm.village}
                  onChange={(e) => setEditForm((p) => ({ ...p, village: e.target.value }))}
                  className="mt-3 w-full rounded-2xl border border-[#ead8c4]/70 bg-gradient-to-r from-[#fcfbf9] to-[#faf8f5] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30 focus:border-[#7a1f1f]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <option value="">Select Village</option>
                  {VILLAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {editForm.village === "other" && (
                  <input
                    value={editForm.villageOther || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, villageOther: capitalizeWords(e.target.value) }))
                    }
                    className="mt-3 w-full rounded-2xl border border-[#ead8c4]/70 bg-gradient-to-r from-[#fcfbf9] to-[#faf8f5] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30 focus:border-[#7a1f1f]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                    placeholder="Enter village name"
                  />
                )}
              </div>
              )}

              {/* Password with icon (full width) */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                  <FaLock className="text-[#7a1f1f]/60" />
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                  className="mt-3 w-full rounded-2xl border border-[#ead8c4]/70 bg-gradient-to-r from-[#fcfbf9] to-[#faf8f5] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30 focus:border-[#7a1f1f]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              {/* Error with premium styling */}
              {editError && (
                <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-sm text-red-700 font-medium">{editError}</p>
                </div>
              )}

              {/* Premium action buttons */}
              <div className="md:col-span-2 flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-6 py-3 rounded-full border-2 border-[#ead8c4] bg-white text-[#7a1f1f] font-medium hover:bg-[#fff6e5] hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-[#7a1f1f] to-[#a83232] text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {editLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Updating...
                    </div>
                  ) : (
                    "Update Admin"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Village results */}
      {selectedVillage && (
        <div
          ref={villageResultsRef}
            className="mt-5 md:mt-8 admin-card village-results-enter village-results-panel bg-[#fffaf2] border border-[#eddcc7] rounded-2xl p-4 md:p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#7a1f1f]">
              Results: {selectedVillage}
            </h2>
            <button
              onClick={() => setSelectedVillage("")}
              className="village-action-btn px-3 py-1 rounded-full border border-[#ead8c4] text-sm text-[#7a1f1f]"
            >
              Clear
            </button>
          </div>

          {/* Filters */}
          <div className="mt-5 grid grid-cols-2 md:grid-cols-7 gap-2.5 md:gap-3.5">
            <select
              value={villageStatus}
              onChange={(e) => setVillageStatus(e.target.value)}
              className="village-filter-control col-span-1 rounded-full border border-[#ead8c4] px-3 py-2 text-xs md:px-4 md:py-2.5 md:text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
            </select>
            <select
              value={villageYear}
              onChange={(e) => setVillageYear(e.target.value)}
              className="village-filter-control col-span-1 rounded-full border border-[#ead8c4] px-3 py-2 text-xs md:px-4 md:py-2.5 md:text-sm"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <input
              value={villageSearch}
              onChange={(e) => setVillageSearch(e.target.value)}
              placeholder="Search name/mobile/email"
              className="village-filter-control col-span-2 md:col-span-1 rounded-full border border-[#ead8c4] px-3 py-2 text-xs md:px-4 md:py-2.5 md:text-sm"
            />
            <select
              value={villageSubmittedBy}
              onChange={(e) => setVillageSubmittedBy(e.target.value)}
              className="village-filter-control col-span-1 rounded-full border border-[#ead8c4] px-3 py-2 text-xs md:px-4 md:py-2.5 md:text-sm"
            >
              <option value="all">All Submitters</option>
              <option value="you">You</option>
              <option value="village_admin">Village Admin</option>
              <option value="user">Users</option>
            </select>
            <input
              value={villageStandard}
              onChange={(e) => setVillageStandard(e.target.value)}
              placeholder="Standard"
              className="village-filter-control col-span-1 rounded-full border border-[#ead8c4] px-3 py-2 text-xs md:px-4 md:py-2.5 md:text-sm"
            />
            <input
              value={villageMedium}
              onChange={(e) => setVillageMedium(e.target.value)}
              placeholder="Medium"
              className="village-filter-control col-span-1 rounded-full border border-[#ead8c4] px-3 py-2 text-xs md:px-4 md:py-2.5 md:text-sm"
            />
            <select
              value={villageLimit}
              onChange={(e) => setVillageLimit(Number(e.target.value))}
              className="village-filter-control col-span-2 md:col-span-1 rounded-full border border-[#ead8c4] px-3 py-2 text-xs md:px-4 md:py-2.5 md:text-sm"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
          </div>

          {/* Results table */}
          <div className="mt-5 overflow-x-auto rounded-xl">
            <table className="village-results-table w-full min-w-[640px] text-sm">
              <thead className="text-left text-[#7a1f1f]/80">
                <tr className="border-b border-[#ead8c4]">
                  <th className="px-3 py-3.5">Name</th>
                  <th className="px-3 py-3.5">Submitted By</th>
                  <th className="px-3 py-3.5">Std</th>
                  <th className="px-3 py-3.5">Medium</th>
                  <th className="px-3 py-3.5">Mobile</th>
                  <th className="px-3 py-3.5">%</th>
                  <th className="px-3 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {villageLoading && (
                  <tr>
                    <td colSpan={7} className="py-4 text-sm text-[#7a1f1f]/70">
                      <span className="sa-loader-inline">
                        <span className="sa-loader-dot" aria-hidden="true" />
                        Loading results...
                      </span>
                    </td>
                  </tr>
                )}
                {villageError && (
                  <tr>
                    <td colSpan={7} className="py-4 text-sm text-red-600">
                      {villageError}
                    </td>
                  </tr>
                )}
                {!villageLoading &&
                  !villageError &&
                  filteredVillageResults.map((r) => (
                    <tr
                      key={r._id || r.id}
                      className="village-result-row border-b border-[#f0e2d2] hover:bg-[#fffaf0] cursor-pointer"
                      onClick={() => navigate(`/admin/super/result/${r._id || r.id}`)}
                    >
                      <td className="px-3 py-3">{r.full_name}</td>
                      <td className="px-3 py-3 text-xs text-[#7a1f1f]/75">
                        {getVillageSubmittedLabel(r.submitted_by_role)}
                      </td>
                      <td className="px-3 py-3">{r.standard}</td>
                      <td className="px-3 py-3">{r.medium}</td>
                      <td className="px-3 py-3">{r.mobile}</td>
                      <td className="px-3 py-3">{r.percentage}</td>
                      <td className="px-3 py-3">
                        {/* Status badge with light green for accepted */}
                        <span className={`result-status-badge px-3 py-1 text-xs rounded-full border ${getResultStatusMeta(r.status).badgeClass}`}>
                          {getResultStatusMeta(r.status).label}
                        </span>
                      </td>
                    </tr>
                  ))}
                {!villageLoading && !villageError && filteredVillageResults.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-sm text-[#7a1f1f]/70">
                      No results found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="village-pagination mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
            <span className="village-page-meta">
              Page {villagePage} of {villageTotalPages}
            </span>
            <div className="village-page-actions flex flex-wrap items-center">
              <button
                onClick={() => setVillagePage((p) => Math.max(1, p - 1))}
                disabled={villagePage === 1}
                className="village-action-btn px-3 py-1 rounded-full border border-[#ead8c4] disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: villageTotalPages }).map((_, i) => {
                const p = i + 1;
                return (
                    <button
                      key={p}
                      onClick={() => setVillagePage(p)}
                      className={`village-action-btn px-3 py-1 rounded-full border ${
                        p === villagePage
                          ? "village-page-btn-active bg-[#7a1f1f] text-white border-[#7a1f1f]"
                          : "border-[#ead8c4] text-[#7a1f1f]"
                      }`}
                    >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setVillagePage((p) => Math.min(villageTotalPages, p + 1))}
                disabled={villagePage === villageTotalPages}
                className="village-action-btn px-3 py-1 rounded-full border border-[#ead8c4] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create admin modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn gpu-accelerated">
          {/* Enhanced backdrop with gradient and stronger blur */}
          <div
            className="modal-backdrop fixed inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70 z-40 gpu-accelerated"
            style={{ backdropFilter: "blur(25px)" }}
            onClick={() => setIsCreateOpen(false)}
          />
          {/* Premium modal with glassmorphism, gradient, and shadow */}
          <div className="relative z-50 w-full max-w-2xl rounded-2xl md:rounded-3xl bg-gradient-to-br from-white/95 via-white/90 to-white/95 p-4 sm:p-6 md:p-10 shadow-2xl border border-white/20 backdrop-blur-xl animate-slideInUp max-h-[92vh] overflow-y-auto">
            {/* Elegant header with icon */}
            <div className="flex items-center justify-between border-b border-[#ead8c4]/50 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7a1f1f] to-[#a83232] flex items-center justify-center shadow-lg">
                  <FaPlus className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-[#7a1f1f] tracking-tight">
                    Create New Admin
                  </h3>
                  <p className="text-sm text-[#7a1f1f]/70 mt-1">
                    Securely add super or village admins to the system
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-10 h-10 rounded-full border border-[#ead8c4]/50 text-[#7a1f1f] hover:bg-[#fff6e5] hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-sm"
                aria-label="Close"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            {/* Enhanced form with icons and better spacing */}
            <form className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleCreateAdmin}>
              {/* Role selector with icon */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                  <FaUser className="text-[#7a1f1f]/60" />
                  Role
                </label>
                <select
                  value={adminForm.role}
                  onChange={(e) =>
                    setAdminForm((p) => ({
                      ...p,
                      role: e.target.value,
                      village: e.target.value === "village_admin" ? p.village : "",
                      villageOther: e.target.value === "village_admin" ? p.villageOther : "",
                    }))
                  }
                  className="mt-3 w-full rounded-2xl border border-[#ead8c4]/70 bg-gradient-to-r from-[#fcfbf9] to-[#faf8f5] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30 focus:border-[#7a1f1f]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <option value="village_admin">Village Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {/* Name with icon */}
              <div>
                <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                  <FaUser className="text-[#7a1f1f]/60" />
                  Full Name
                </label>
                <input
                  value={adminForm.name}
                  onChange={(e) =>
                    setAdminForm((p) => ({
                      ...p,
                      name: capitalizeWords(e.target.value),
                    }))
                  }
                  className="mt-3 w-full rounded-2xl border border-[#ead8c4]/70 bg-gradient-to-r from-[#fcfbf9] to-[#faf8f5] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30 focus:border-[#7a1f1f]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                  placeholder="Enter full name"
                />
              </div>

              {/* Email with icon */}
              <div>
                <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                  <FaEnvelope className="text-[#7a1f1f]/60" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) =>
                    setAdminForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="mt-3 w-full rounded-2xl border border-[#ead8c4]/70 bg-gradient-to-r from-[#fcfbf9] to-[#faf8f5] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30 focus:border-[#7a1f1f]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                  placeholder="admin@example.com"
                />
              </div>

              {/* Password with icon */}
              <div>
                <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                  <FaLock className="text-[#7a1f1f]/60" />
                  Password
                </label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm((p) => ({ ...p, password: e.target.value }))
                  }
                  className="mt-3 w-full rounded-2xl border border-[#ead8c4]/70 bg-gradient-to-r from-[#fcfbf9] to-[#faf8f5] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30 focus:border-[#7a1f1f]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                  placeholder="Secure password"
                />
              </div>

              {/* Mobile with icon */}
              <div>
                <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                  <FaPhone className="text-[#7a1f1f]/60" />
                  Mobile Number
                </label>
                <input
                  value={adminForm.mobile}
                  onChange={(e) =>
                    setAdminForm((p) => ({ ...p, mobile: e.target.value }))
                  }
                  className="mt-3 w-full rounded-2xl border border-[#ead8c4]/70 bg-gradient-to-r from-[#fcfbf9] to-[#faf8f5] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30 focus:border-[#7a1f1f]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                  placeholder="+91 9876543210"
                />
              </div>

              {/* Village with icon (conditional) */}
              {adminForm.role === "village_admin" && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-[#7a1f1f]/60" />
                    Village
                  </label>
                  <select
                    value={adminForm.village}
                    onChange={(e) => setAdminForm((p) => ({ ...p, village: e.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-[#ead8c4]/70 bg-gradient-to-r from-[#fcfbf9] to-[#faf8f5] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30 focus:border-[#7a1f1f]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <option value="">Select Village</option>
                    {VILLAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {adminForm.village === "other" && (
                    <input
                      value={adminForm.villageOther || ""}
                      onChange={(e) =>
                        setAdminForm((p) => ({
                          ...p,
                          villageOther: capitalizeWords(e.target.value),
                        }))
                      }
                      className="mt-3 w-full rounded-2xl border border-[#ead8c4]/70 bg-gradient-to-r from-[#fcfbf9] to-[#faf8f5] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30 focus:border-[#7a1f1f]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                      placeholder="Enter village name"
                    />
                  )}
                </div>
              )}

              {/* Error with premium styling */}
              {adminError && (
                <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-sm text-red-700 font-medium">{adminError}</p>
                </div>
              )}

              {/* Premium action buttons */}
              <div className="md:col-span-2 flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-6 py-3 rounded-full border-2 border-[#ead8c4] bg-white text-[#7a1f1f] font-medium hover:bg-[#fff6e5] hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-[#7a1f1f] to-[#a83232] text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {adminLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    "Create Admin"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminShell>
  );
}
