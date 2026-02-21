import { useMemo, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaUserShield,
  FaImages,
  FaBullhorn,
  FaSlidersH,
  FaFileExport,
  FaHistory,
  FaBell,
  FaArrowLeft,
  FaPlus,
  FaUsers,
  FaSearch,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaLock,
  FaEdit,
  FaTrash,
  FaFileAlt,
  FaFilePdf,
  FaFileExcel,
  FaDownload,
} from "react-icons/fa";
import AdminShell from "../../components/admin/AdminShell";

import { getAdminTokenFor } from "../../utils/adminAuth";
import { capitalizeWords } from "../../utils/format";
import { VILLAGE_OPTIONS } from "../../constants/villageOptions";

const ACTIONS = [
  {
    key: "admins",
    title: "Add / Manage Admins",
    subtitle: "Create, edit, and monitor admin access",
    icon: FaUserShield,
    state: "ready",
    accent: "rose",
    content: [
      "Create new village and super admins",
      "Update profile, role, village, and credentials",
      "Deactivate or remove unused accounts",
    ],
  },
  {
    key: "approvals",
    title: "User Approvals",
    subtitle: "Handle new account requests with full details",
    icon: FaBell,
    state: "ready",
    accent: "orange",
    content: [
      "Review pending user registrations village-wise",
      "Approve request to activate account access",
      "Reject request to delete account immediately",
    ],
  },
  {
    key: "hero",
    title: "Hero Slider",
    subtitle: "Home page banners and highlight sequence",
    icon: FaSlidersH,
    state: "ready",
    accent: "amber",
    content: [
      "Control hero sequence priority",
      "Set CTA text and destination section",
      "Preview ordering before publish",
    ],
  },
  {
    key: "announcements",
    title: "Announcements",
    subtitle: "Publish event updates and notices",
    icon: FaBullhorn,
    state: "ready",
    accent: "teal",
    content: [
      "Post important family event updates",
      "Enable or archive announcements by status",
      "Keep latest notices highlighted",
    ],
  },
  {
    key: "gallery",
    title: "Manage Gallery",
    subtitle: "Upload, organize, and curate gallery items",
    icon: FaImages,
    state: "ready",
    accent: "indigo",
    content: [
      "Add new photos with category tags",
      "Reorder visuals for better storytelling",
      "Replace old images without breaking layout",
    ],
  },
  {
    key: "export",
    title: "Export Results",
    subtitle: "Download result sheets for reports",
    icon: FaFileExport,
    state: "ready",
    accent: "emerald",
    content: [
      "Export filtered result data",
      "Prepare admin-ready reporting sheets",
      "Share structured outputs for review",
    ],
  },
  {
    key: "activity",
    title: "Activity Timeline",
    subtitle: "Review admin operations chronologically",
    icon: FaHistory,
    state: "suggested",
    accent: "violet",
    content: [
      "Track who changed what and when",
      "Detect unexpected admin operations",
      "Support issue tracing and accountability",
    ],
  },
  {
    key: "alerts",
    title: "Security Alerts",
    subtitle: "Monitor risky actions and priority events",
    icon: FaBell,
    state: "suggested",
    accent: "orange",
    content: [
      "Flag repeated failed sign-in attempts",
      "Notify risky profile and role changes",
      "Escalate unusual admin activities quickly",
    ],
  },
];
const DISABLED_ACTION_KEYS = new Set(["activity", "alerts"]);

const accentStyles = {
  rose: {
    card: "border-[#efc7cf] bg-[#fff3f5] hover:bg-[#ffecef]",
    icon: "border-[#efc7cf] bg-white text-[#9f1239]",
    dot: "bg-[#be123c]",
    active: "border-[#be123c] shadow-[0_12px_28px_rgba(190,18,60,0.22)]",
  },
  amber: {
    card: "border-[#f2d39a] bg-[#fff8ea] hover:bg-[#fff2d9]",
    icon: "border-[#f2d39a] bg-white text-[#a16207]",
    dot: "bg-[#b45309]",
    active: "border-[#b45309] shadow-[0_12px_28px_rgba(180,83,9,0.2)]",
  },
  teal: {
    card: "border-[#b7e3df] bg-[#effcf9] hover:bg-[#e4f8f4]",
    icon: "border-[#b7e3df] bg-white text-[#0f766e]",
    dot: "bg-[#0f766e]",
    active: "border-[#0f766e] shadow-[0_12px_28px_rgba(15,118,110,0.2)]",
  },
  indigo: {
    card: "border-[#cfd6ff] bg-[#f4f6ff] hover:bg-[#ecefff]",
    icon: "border-[#cfd6ff] bg-white text-[#4338ca]",
    dot: "bg-[#4f46e5]",
    active: "border-[#4f46e5] shadow-[0_12px_28px_rgba(79,70,229,0.22)]",
  },
  emerald: {
    card: "border-[#bbe6cb] bg-[#effdf4] hover:bg-[#e1f9ea]",
    icon: "border-[#bbe6cb] bg-white text-[#15803d]",
    dot: "bg-[#15803d]",
    active: "border-[#15803d] shadow-[0_12px_28px_rgba(21,128,61,0.2)]",
  },
  violet: {
    card: "border-[#dfccff] bg-[#f8f3ff] hover:bg-[#f0e8ff]",
    icon: "border-[#dfccff] bg-white text-[#6d28d9]",
    dot: "bg-[#7c3aed]",
    active: "border-[#7c3aed] shadow-[0_12px_28px_rgba(124,58,237,0.2)]",
  },
  orange: {
    card: "border-[#ffd9b1] bg-[#fff7ef] hover:bg-[#ffefdf]",
    icon: "border-[#ffd9b1] bg-white text-[#c2410c]",
    dot: "bg-[#ea580c]",
    active: "border-[#ea580c] shadow-[0_12px_28px_rgba(234,88,12,0.2)]",
  },
};

const EXPORT_STANDARD_OPTIONS = [
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
];

const EXPORT_MEDIUM_OPTIONS = ["English", "Gujarati"];

export default function SuperQuickActionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedKey = searchParams.get("tab") || "admins";
  const selectedAdminAction = searchParams.get("action") || "add-admin";

  const selectedAction = useMemo(
    () =>
      ACTIONS.find((item) => item.key === selectedKey && !DISABLED_ACTION_KEYS.has(item.key)) ||
      ACTIONS[0],
    [selectedKey]
  );

  useEffect(() => {
    if (DISABLED_ACTION_KEYS.has(selectedKey)) {
      setSearchParams({ tab: "admins" });
    }
  }, [selectedKey, setSearchParams]);

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

  const [adminList, setAdminList] = useState([]);
  const [adminListError, setAdminListError] = useState("");
  const [adminListLoading, setAdminListLoading] = useState(false);
  const [manageSearch, setManageSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const selectAllRef = useRef(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState("");
  const [pendingBulkBusy, setPendingBulkBusy] = useState(false);
  const [approvalSettings, setApprovalSettings] = useState({ globalEnabled: true, villageOverrides: [] });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState("");

  const isAdminTab = selectedAction.key === "admins";
  const isManageAdmins = isAdminTab && selectedAdminAction === "manage-admins";
  const isAddAdmin = isAdminTab && selectedAdminAction === "add-admin";
  const isApprovalsTab = selectedAction.key === "approvals";

  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState("");
  const [galleryForm, setGalleryForm] = useState({
    title: "",
    category: "snehmilan",
    imageUrl: "",
  });
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryFileInputKey, setGalleryFileInputKey] = useState(0);
  const [gallerySaving, setGallerySaving] = useState(false);
  const [galleryEdit, setGalleryEdit] = useState(null);
  const [galleryEditFile, setGalleryEditFile] = useState(null);
  const [galleryEditSaving, setGalleryEditSaving] = useState(false);
  const galleryFormRef = useRef(null);
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryPerPage, setGalleryPerPage] = useState(9);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState([]);
  const gallerySelectAllRef = useRef(null);
  const actionDetailRef = useRef(null);
  const exportStandardRef = useRef(null);
  const exportMediumRef = useRef(null);
  const exportVillageRef = useRef(null);
  const exportRangeFromRef = useRef(null);
  const exportRangeToRef = useRef(null);
  const [heroItems, setHeroItems] = useState([]);
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroError, setHeroError] = useState("");
  const [heroForm, setHeroForm] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    order: 0,
    isActive: true,
  });
  const [heroFile, setHeroFile] = useState(null);
  const [heroFileInputKey, setHeroFileInputKey] = useState(0);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroEdit, setHeroEdit] = useState(null);
  const [heroEditSaving, setHeroEditSaving] = useState(false);
  const [selectedHeroIds, setSelectedHeroIds] = useState([]);
  const heroSelectAllRef = useRef(null);
  const [heroPreviewUrl, setHeroPreviewUrl] = useState("");
  const [announcementItems, setAnnouncementItems] = useState([]);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementEdit, setAnnouncementEdit] = useState(null);

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    priority: "normal",
    isActive: true,
    showSubmitButton: false,
    submitButtonLabel: "Submit Result",
    eventDate: "",
  });
  const [exportFilters, setExportFilters] = useState({
    standard: "all",
    village: "all",
    medium: "all",
    rangeMode: "top",
    rangeFrom: "1",
    rangeTo: "3",
    format: "pdf",
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportPreview, setExportPreview] = useState([]);
  const [exportPreviewMeta, setExportPreviewMeta] = useState({
    total: 0,
    showing: 0,
    page: 1,
    limit: 25,
    pages: 1,
  });
  const [exportPreviewLoading, setExportPreviewLoading] = useState(false);
  const [exportPreviewPage, setExportPreviewPage] = useState(1);
  const EXPORT_PREVIEW_LIMIT = 10;

  const selectedStyle = accentStyles[selectedAction.accent];
  const galleryTotalPages = Math.max(
    1,
    Math.ceil(galleryItems.length / galleryPerPage)
  );
  const galleryPageItems = galleryItems.slice(
    (galleryPage - 1) * galleryPerPage,
    galleryPage * galleryPerPage
  );

  const filteredAdmins = useMemo(() => {
    const term = manageSearch.trim().toLowerCase();
    return adminList.filter((a) => {
      if (!term) return true;
      return [a.name, a.email, a.village, a.role]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [adminList, manageSearch]);

  const deletableAdmins = useMemo(
    () => filteredAdmins.filter((a) => a.role !== "super_admin"),
    [filteredAdmins]
  );
  const villageValues = useMemo(
    () => new Set(VILLAGE_OPTIONS.filter((v) => v.value !== "other").map((v) => v.value)),
    []
  );
  const exportFilterOptions = useMemo(
    () => ({
      standards: EXPORT_STANDARD_OPTIONS,
      villages: VILLAGE_OPTIONS.filter((v) => v.value !== "other").map((v) => v.value),
      mediums: EXPORT_MEDIUM_OPTIONS,
    }),
    []
  );

  useEffect(() => {
    if (!isManageAdmins) return;
    fetchAdmins();
  }, [isManageAdmins]);

  useEffect(() => {
    fetchPendingUsers();
    const id = setInterval(fetchPendingUsers, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isApprovalsTab) return;
    fetchApprovalSettings();
  }, [isApprovalsTab]);

  useEffect(() => {
    if (selectedAction.key !== "gallery") return;
    fetchGallery();
  }, [selectedAction.key]);

  useEffect(() => {
    if (selectedAction.key !== "hero") return;
    fetchHero();
  }, [selectedAction.key]);

  useEffect(() => {
    if (selectedAction.key !== "announcements") return;
    fetchAnnouncements();
  }, [selectedAction.key]);

  useEffect(() => {
    if (selectedAction.key !== "export") return;
    fetchExportPreview();
  }, [selectedAction.key]);

  useEffect(() => {
    if (galleryPage > galleryTotalPages) {
      setGalleryPage(galleryTotalPages);
    }
  }, [galleryPage, galleryTotalPages]);

  useEffect(() => {
    setGalleryPage(1);
  }, [galleryPerPage]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    const total = deletableAdmins.length;
    const checked = selectedIds.length;
    selectAllRef.current.indeterminate = checked > 0 && checked < total;
    selectAllRef.current.checked = total > 0 && checked === total;
  }, [deletableAdmins, selectedIds]);

  useEffect(() => {
    if (!heroSelectAllRef.current) return;
    const total = heroItems.length;
    const checked = heroItems.filter((item) =>
      selectedHeroIds.includes(item._id || item.id)
    ).length;
    heroSelectAllRef.current.indeterminate = checked > 0 && checked < total;
    heroSelectAllRef.current.checked = total > 0 && checked === total;
  }, [heroItems, selectedHeroIds]);

  useEffect(() => {
    if (!gallerySelectAllRef.current) return;
    const total = galleryPageItems.length;
    const checked = galleryPageItems.filter((item) =>
      selectedGalleryIds.includes(item._id || item.id)
    ).length;
    gallerySelectAllRef.current.indeterminate = checked > 0 && checked < total;
    gallerySelectAllRef.current.checked = total > 0 && checked === total;
  }, [galleryPageItems, selectedGalleryIds]);

  useEffect(() => {
    if (!actionDetailRef.current) return;
    const id = setTimeout(() => {
      actionDetailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(id);
  }, [selectedKey, selectedAdminAction]);

  useEffect(() => {
    return () => {
      if (heroPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(heroPreviewUrl);
    };
  }, [heroPreviewUrl]);

  const setAdminAction = (action) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", "admins");
    nextParams.set("action", action);
    setSearchParams(nextParams);
  };

  const fetchAdmins = async () => {
    setAdminListError("");
    setAdminListLoading(true);
    try {
      const token = getAdminTokenFor("super_admin");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load admins");
      setAdminList(data);
    } catch (err) {
      setAdminListError(err.message);
    } finally {
      setAdminListLoading(false);
    }
  };

  const fetchHero = async () => {
    setHeroError("");
    setHeroLoading(true);
    try {
      const token = getAdminTokenFor("super_admin");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hero/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load hero slides");
      const normalized = Array.isArray(data)
        ? data.map((item) => ({
          ...item,
          imageUrl:
            item.imageUrl?.startsWith("/uploads")
              ? `${import.meta.env.VITE_API_URL}${item.imageUrl}`
              : item.imageUrl,
        }))
        : [];
      setHeroItems(normalized);
    } catch (err) {
      setHeroError(err.message);
    } finally {
      setHeroLoading(false);
    }
  };

  const toDateInputValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const resetAnnouncementForm = () => {
    setAnnouncementEdit(null);
    setAnnouncementForm({
      title: "",
      message: "",
      priority: "normal",
      isActive: true,
      showSubmitButton: false,
      submitButtonLabel: "Submit Result",
      eventDate: "",
    });
  };

  const fetchAnnouncements = async () => {
    setAnnouncementError("");
    setAnnouncementLoading(true);
    try {
      const token = getAdminTokenFor("super_admin");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load announcements");
      setAnnouncementItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setAnnouncementError(err.message);
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    setPendingError("");
    setPendingLoading(true);
    try {
      const token = getAdminTokenFor("super_admin");
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

  const fetchApprovalSettings = async () => {
    setSettingsError("");
    setSettingsLoading(true);
    try {
      const token = getAdminTokenFor("super_admin");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/approval-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load approval settings");
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

  const updateGlobalApproval = async (enabled) => {
    try {
      const token = getAdminTokenFor("super_admin");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/approval-settings/global`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update global setting");
      setApprovalSettings((prev) => ({ ...prev, globalEnabled: Boolean(data.globalEnabled) }));
    } catch (err) {
      setSettingsError(err.message || "Failed to update global setting");
    }
  };

  const updateVillageApproval = async (village, enabled) => {
    try {
      const token = getAdminTokenFor("super_admin");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/approval-settings/village`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ village, enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update village setting");
      setApprovalSettings((prev) => ({
        ...prev,
        villageOverrides: Array.isArray(data.villageOverrides) ? data.villageOverrides : prev.villageOverrides,
      }));
    } catch (err) {
      setSettingsError(err.message || "Failed to update village setting");
    }
  };

  const handlePendingAction = async (id, action) => {
    if (!id || pendingBulkBusy) return;
    setPendingBulkBusy(true);
    setPendingError("");
    try {
      const token = getAdminTokenFor("super_admin");
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

  const buildPercentageRangeValue = (filters = exportFilters) => {
    if (filters.rangeMode === "all") return "all";
    const from = Math.max(1, Number(filters.rangeFrom || 1));
    const to = Math.max(from, Number(filters.rangeTo || from));
    return `${from}-${to}`;
  };

  const validateExportFilters = (filters = exportFilters) => {
    if (filters.rangeMode !== "all") {
      const from = Number(filters.rangeFrom);
      const to = Number(filters.rangeTo);
      if (!Number.isFinite(from) || from < 1) {
        return { message: "Rank 'From' must be 1 or more.", field: "rangeFrom" };
      }
      if (!Number.isFinite(to) || to < from) {
        return { message: "Rank 'To' must be greater than or equal to 'From'.", field: "rangeTo" };
      }
    }
    return null;
  };

  const focusExportField = (field) => {
    const map = {
      standard: exportStandardRef,
      medium: exportMediumRef,
      village: exportVillageRef,
      rangeFrom: exportRangeFromRef,
      rangeTo: exportRangeToRef,
    };
    const ref = map[field];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      ref.current.focus({ preventScroll: true });
    }
  };

const buildExportPayload = (filters = exportFilters) => ({
    standard: filters.standard || "all",
    village: filters.village || "all",
    medium: filters.medium || "all",
    percentageRange: buildPercentageRangeValue(filters),
  });

  const fetchExportPreview = async (nextFilters = exportFilters, nextPage = exportPreviewPage) => {
    setExportPreviewLoading(true);
    setExportError("");
    try {
      const validationError = validateExportFilters(nextFilters);
      if (validationError) {
        focusExportField(validationError.field);
        throw new Error(validationError.message);
      }
      const token = getAdminTokenFor("super_admin");
      const payload = {
        ...buildExportPayload(nextFilters),
        page: nextPage,
        limit: EXPORT_PREVIEW_LIMIT,
      };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/export/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load preview");
      const resolvedPage = Number(data.page || nextPage || 1);
      setExportPreview(Array.isArray(data.data) ? data.data : []);
      setExportPreviewMeta({
        total: Number(data.total || 0),
        showing: Number(data.showing || 0),
        page: resolvedPage,
        limit: Number(data.limit || EXPORT_PREVIEW_LIMIT),
        pages: Number(data.pages || 1),
      });
      setExportPreviewPage(resolvedPage);
    } catch (err) {
      setExportError(err.message);
      setExportPreview([]);
      setExportPreviewMeta({ total: 0, showing: 0, page: 1, limit: EXPORT_PREVIEW_LIMIT, pages: 1 });
      setExportPreviewPage(1);
    } finally {
      setExportPreviewLoading(false);
    }
  };

  const handleExportDownload = async () => {
    setExportLoading(true);
    setExportError("");
    try {
      const validationError = validateExportFilters(exportFilters);
      if (validationError) {
        focusExportField(validationError.field);
        throw new Error(validationError.message);
      }
      const token = getAdminTokenFor("super_admin");
      const payload = {
        ...buildExportPayload(exportFilters),
        format: exportFilters.format,
      };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/export/results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.message || "Export failed");
        }
        const fallbackText = await res.text();
        throw new Error(fallbackText || "Export failed");
      }
      if (
        exportFilters.format === "pdf" &&
        !contentType.includes("application/pdf")
      ) {
        if (contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.message || "PDF generation failed");
        }
        throw new Error("PDF generation failed");
      }
      const blob = await res.blob();
      const ext = exportFilters.format === "excel" ? "xlsx" : "pdf";
      const year = new Date().getFullYear();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Snehmilan_${year}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setAnnouncementError("");
    setAnnouncementSaving(true);
    try {
      const token = getAdminTokenFor("super_admin");
      const payload = {
        title: announcementForm.title.trim(),
        message: announcementForm.message.trim(),
        priority: announcementForm.priority,
        isActive: announcementForm.isActive,
        showSubmitButton: announcementForm.showSubmitButton,
        submitButtonLabel:
          announcementForm.showSubmitButton && announcementForm.submitButtonLabel.trim()
            ? announcementForm.submitButtonLabel.trim()
            : "Submit Result",
        onlyIfResultNotSubmitted: false,
        eventDate: announcementForm.eventDate || null,
      };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create announcement");
      resetAnnouncementForm();
      fetchAnnouncements();
    } catch (err) {
      setAnnouncementError(err.message);
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementEdit?.id) return;
    setAnnouncementError("");
    setAnnouncementSaving(true);
    try {
      const token = getAdminTokenFor("super_admin");
      const payload = {
        title: announcementForm.title.trim(),
        message: announcementForm.message.trim(),
        priority: announcementForm.priority,
        isActive: announcementForm.isActive,
        showSubmitButton: announcementForm.showSubmitButton,
        submitButtonLabel:
          announcementForm.showSubmitButton && announcementForm.submitButtonLabel.trim()
            ? announcementForm.submitButtonLabel.trim()
            : "Submit Result",
        onlyIfResultNotSubmitted: false,
        eventDate: announcementForm.eventDate || null,
      };
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/announcements/${announcementEdit.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update announcement");
      resetAnnouncementForm();
      fetchAnnouncements();
    } catch (err) {
      setAnnouncementError(err.message);
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const startEditAnnouncement = (item) => {
    setAnnouncementEdit({ id: item._id || item.id });
    setAnnouncementForm({
      title: item.title || "",
      message: item.message || "",
      priority: item.priority || "normal",
      isActive: item.isActive !== false,
      showSubmitButton: item.showSubmitButton === true,
      submitButtonLabel: item.submitButtonLabel || "Submit Result",
      eventDate: toDateInputValue(item.eventDate),
    });
    setTimeout(() => {
      actionDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    setAnnouncementError("");
    try {
      const token = getAdminTokenFor("super_admin");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      fetchAnnouncements();
    } catch (err) {
      setAnnouncementError(err.message);
    }
  };

  const normalizeGalleryItem = (item) => ({
    ...item,
    imageUrl:
      item.imageUrl?.startsWith("/uploads")
        ? `${import.meta.env.VITE_API_URL}${item.imageUrl}`
        : item.imageUrl,
  });

  const deriveTitle = (value) => {
    if (!value) return "";
    const raw = typeof value === "string" ? value : value.name || "";
    const file = raw.split("/").pop()?.split("?")[0] || raw;
    return file.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
  };

  const setHeroPreview = (nextUrl) => {
    setHeroPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return nextUrl || "";
    });
  };

  const fetchGallery = async () => {
    setGalleryError("");
    setGalleryLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load gallery");
      const normalized = Array.isArray(data) ? data.map(normalizeGalleryItem) : [];
      setGalleryItems(normalized);
    } catch (err) {
      setGalleryError(err.message);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleCreateGallery = async (e) => {
    e.preventDefault();
    setGalleryError("");
    setGallerySaving(true);
    try {
      const token = getAdminTokenFor("super_admin");
      const hasFiles = galleryFiles.length > 0;
      if (hasFiles) {
        for (const file of galleryFiles) {
          const formData = new FormData();
          const title =
            galleryForm.title?.trim() || deriveTitle(file) || "Untitled";
          formData.append("title", title);
          if (galleryForm.category) formData.append("category", galleryForm.category);
          formData.append("image", file);
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Failed to add image");
        }
      } else {
        const formData = new FormData();
        const title =
          galleryForm.title?.trim() || deriveTitle(galleryForm.imageUrl) || "Untitled";
        if (title) formData.append("title", title);
        if (galleryForm.category) formData.append("category", galleryForm.category);
        if (galleryForm.imageUrl) formData.append("imageUrl", galleryForm.imageUrl);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to add image");
      }
      setGalleryForm({ title: "", category: "snehmilan", imageUrl: "" });
      setGalleryFiles([]);
      setGalleryFileInputKey((k) => k + 1);
      fetchGallery();
    } catch (err) {
      setGalleryError(err.message);
    } finally {
      setGallerySaving(false);
    }
  };

  const handleDeleteGallery = async (id) => {
    if (!window.confirm("Delete this gallery item?")) return;
    try {
      const token = getAdminTokenFor("super_admin");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      fetchGallery();
    } catch (err) {
      setGalleryError(err.message);
    }
  };

  const handleUpdateGallery = async (e) => {
    e.preventDefault();
    if (!galleryEdit?.id) return;
    setGalleryError("");
    setGalleryEditSaving(true);
    try {
      const token = getAdminTokenFor("super_admin");
      const formData = new FormData();
      const resolvedTitle =
        galleryEdit.title?.trim() ||
        deriveTitle(galleryEditFile) ||
        deriveTitle(galleryEdit.imageUrl) ||
        "Untitled";
      formData.append("title", resolvedTitle);
      if (galleryEdit.category !== undefined) formData.append("category", galleryEdit.category);
      if (galleryEdit.imageUrl) formData.append("imageUrl", galleryEdit.imageUrl);
      if (galleryEditFile) formData.append("image", galleryEditFile);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery/${galleryEdit.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setGalleryEdit(null);
      setGalleryEditFile(null);
      setGalleryForm({ title: "", category: "snehmilan", imageUrl: "" });
      setGalleryFiles([]);
      setGalleryFileInputKey((k) => k + 1);
      fetchGallery();
    } catch (err) {
      setGalleryError(err.message);
    } finally {
      setGalleryEditSaving(false);
    }
  };

  const handleCreateHero = async (e) => {
    e.preventDefault();
    setHeroError("");
    setHeroSaving(true);
    try {
      const token = getAdminTokenFor("super_admin");
      const formData = new FormData();
      const title = heroForm.title?.trim() || "";
      formData.append("title", title);
      if (heroForm.subtitle) formData.append("subtitle", heroForm.subtitle);
      if (heroForm.imageUrl) formData.append("imageUrl", heroForm.imageUrl);
      formData.append("order", String(heroForm.order || 0));
      formData.append("isActive", String(heroForm.isActive));
      if (heroFile) formData.append("image", heroFile);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hero`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add hero slide");
      setHeroForm({
        title: "",
        subtitle: "",
        imageUrl: "",
        order: 0,
        isActive: true,
      });
      setHeroFile(null);
      setHeroPreview("");
      setHeroFileInputKey((k) => k + 1);
      fetchHero();
    } catch (err) {
      setHeroError(err.message);
    } finally {
      setHeroSaving(false);
    }
  };

  const handleUpdateHero = async (e) => {
    e.preventDefault();
    if (!heroEdit?.id) return;
    setHeroError("");
    setHeroEditSaving(true);
    try {
      const token = getAdminTokenFor("super_admin");
      const formData = new FormData();
      const title = heroForm.title?.trim() || "";
      formData.append("title", title);
      if (heroForm.subtitle !== undefined) formData.append("subtitle", heroForm.subtitle);
      if (heroForm.imageUrl) formData.append("imageUrl", heroForm.imageUrl);
      formData.append("order", String(heroForm.order || 0));
      formData.append("isActive", String(heroForm.isActive));
      if (heroFile) formData.append("image", heroFile);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hero/${heroEdit.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update hero slide");
      setHeroEdit(null);
      setHeroForm({
        title: "",
        subtitle: "",
        imageUrl: "",
        order: 0,
        isActive: true,
      });
      setHeroFile(null);
      setHeroPreview("");
      setHeroFileInputKey((k) => k + 1);
      fetchHero();
    } catch (err) {
      setHeroError(err.message);
    } finally {
      setHeroEditSaving(false);
    }
  };

  const handleDeleteHero = async (id) => {
    if (!window.confirm("Delete this hero slide?")) return;
    try {
      const token = getAdminTokenFor("super_admin");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hero/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      fetchHero();
    } catch (err) {
      setHeroError(err.message);
    }
  };

  const handleBulkDeleteHero = async () => {
    if (selectedHeroIds.length === 0) return;
    if (!window.confirm("Delete selected hero slides?")) return;
    setHeroError("");
    try {
      const token = getAdminTokenFor("super_admin");
      for (const id of selectedHeroIds) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hero/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Delete failed");
      }
      setSelectedHeroIds([]);
      fetchHero();
    } catch (err) {
      setHeroError(err.message);
    }
  };

  const startEditHero = (item) => {
    setHeroEdit({ id: item._id || item.id });
    setHeroForm({
      title: item.title || "",
      subtitle: item.subtitle || "",
      imageUrl: item.imageUrl || "",
      order: item.order || 0,
      isActive: item.isActive !== false,
    });
    setHeroPreview(item.imageUrl || "");
    setHeroFile(null);
    setHeroFileInputKey((k) => k + 1);
    setTimeout(() => {
      actionDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  const startEditGallery = (item) => {
    setGalleryEdit({
      id: item._id || item.id,
      title: item.title || "",
      category: item.category || "snehmilan",
      imageUrl: item.imageUrl || "",
    });
    setGalleryForm({
      title: item.title || "",
      category: item.category || "snehmilan",
      imageUrl: item.imageUrl || "",
    });
    setGalleryFiles([]);
    setGalleryFileInputKey((k) => k + 1);
    setTimeout(() => {
      galleryFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  const handleBulkDeleteGallery = async () => {
    if (selectedGalleryIds.length === 0) return;
    if (!window.confirm("Delete selected gallery items?")) return;
    setGalleryError("");
    try {
      const token = getAdminTokenFor("super_admin");
      for (const id of selectedGalleryIds) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Delete failed");
      }
      setSelectedGalleryIds([]);
      fetchGallery();
    } catch (err) {
      setGalleryError(err.message);
    }
  };

  const isImageFile = (url = "") =>
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url.split("?")[0]);
  const isPdfFile = (url = "") => /\.pdf$/i.test(url.split("?")[0]);

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
      const token = getAdminTokenFor("super_admin");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...adminForm, village: finalVillage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create admin");
      setAdminForm({
        name: "",
        email: "",
        password: "",
        mobile: "",
        village: "",
        villageOther: "",
        role: "village_admin",
      });
      if (isManageAdmins) fetchAdmins();
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm("Delete this admin?")) return;
    try {
      const token = getAdminTokenFor("super_admin");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/admins/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      fetchAdmins();
    } catch (err) {
      setAdminListError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm("Delete selected admins?")) return;
    try {
      const token = getAdminTokenFor("super_admin");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/admins/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Bulk delete failed");
      setSelectedIds([]);
      fetchAdmins();
    } catch (err) {
      setAdminListError(err.message);
    }
  };

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
      const token = getAdminTokenFor("super_admin");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/admins/${editForm.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...editForm, village: finalVillage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setEditForm(null);
      fetchAdmins();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <AdminShell
      title="Super User Action Hub"
      roleLabel="Super Admin"
      actions={
        <button
          onClick={() => navigate("/admin/super")}
          className="inline-flex items-center gap-2 rounded-full border border-[#e7d3bd] bg-white px-4 py-2 text-sm text-[#7a1f1f] transition hover:shadow-md hover:-translate-y-0.5"
        >
          <FaArrowLeft className="text-xs" />
          Dashboard
        </button>
      }
    >
      <style>{`
        @keyframes quickActionIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.12); }
        }
        .quick-action-enter {
          animation: quickActionIn 0.45s ease-out both;
        }
        .quick-section-heading {
          position: relative;
          display: inline-block;
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          color: #2a273a;
          padding-bottom: 6px;
        }
        .quick-section-heading::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          width: 64px;
          height: 3px;
          border-radius: 999px;
          background: linear-gradient(90deg, #7a1f1f 0%, #d68b40 100%);
          opacity: 0.9;
        }
        .pulse-dot {
          animation: pulseDot 1.6s ease-in-out infinite;
        }
        .quick-announcement-card {
          background: linear-gradient(180deg, #fffdf7 0%, #fff9ef 100%);
          border-color: #e8d8c1 !important;
          box-shadow: 0 10px 22px rgba(122, 31, 31, 0.1);
        }
        .quick-announcement-title {
          color: #6f1d1d;
          font-weight: 700;
          font-size: 15px;
        }
        .quick-announcement-message {
          color: #7b3a2f;
          line-height: 1.45;
        }
        .quick-announcement-pill {
          background: #fff1dc !important;
          border-color: #e7cba0 !important;
          color: #7a1f1f !important;
          font-weight: 600;
        }
        .quick-announcement-action {
          border-color: #dfcbb0 !important;
          background: #fffdf9 !important;
          color: #7a1f1f !important;
        }
        .quick-announcement-action:hover {
          background: #fff4e6 !important;
        }
        .quick-announcement-action-danger {
          border-color: #f1c4c4 !important;
          background: #fff1f1 !important;
          color: #b42318 !important;
        }
        .quick-announcement-action-danger:hover {
          background: #ffe7e7 !important;
        }
        .admin-theme-dark .quick-page-root .quick-heading {
          color: #f3f7ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-section-heading {
          color: #edf4ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-section-heading::after {
          background: linear-gradient(90deg, #7aa2ff 0%, #66d7ff 100%) !important;
        }
        .admin-theme-dark .quick-page-root .quick-subheading {
          color: #b8c8f2 !important;
        }
        .admin-theme-dark .quick-page-root .quick-muted {
          color: #cdd8f2 !important;
        }
        .admin-theme-dark .quick-page-root .quick-hero {
          background: #1a2235 !important;
          border-color: #31405f !important;
          box-shadow: 0 12px 32px rgba(7, 14, 30, 0.45) !important;
        }
        .admin-theme-dark .quick-page-root .quick-card {
          border-color: #3b4d74 !important;
          background: #1b2438 !important;
          color: #e6efff !important;
        }
        .admin-theme-dark .quick-page-root .quick-card.quick-card-selected {
          background: #223255 !important;
          border-color: #7aa2ff !important;
          box-shadow: 0 0 0 2px rgba(122, 162, 255, 0.25), 0 12px 26px rgba(8, 16, 34, 0.48) !important;
          transform: translateY(-2px);
        }
        .admin-theme-dark .quick-page-root .quick-card-title {
          color: #f2f6ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-card-subtitle {
          color: #c9d6f3 !important;
        }
        .admin-theme-dark .quick-page-root .quick-badge {
          background: #101a2f !important;
          border-color: #4b5f86 !important;
          color: #dbe7ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-selected {
          background: #1b2438 !important;
          border-color: #31405f !important;
          color: #e6efff !important;
        }
        .admin-theme-dark .quick-page-root .quick-selected-title {
          color: #f3f7ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-selected-subtitle,
        .admin-theme-dark .quick-page-root .quick-suggested-note {
          color: #c5d4f3 !important;
        }
        .admin-theme-dark .quick-page-root .quick-content-chip {
          background: #121c32 !important;
          border-color: #3a4a6c !important;
          color: #deebff !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel,
        .admin-theme-dark .quick-page-root .quick-admin-panel * {
          color: #e6efff !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel {
          background: #1b2438 !important;
          border-color: #31405f !important;
          box-shadow: 0 12px 28px rgba(7, 14, 30, 0.45) !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel input,
        .admin-theme-dark .quick-page-root .quick-admin-panel select {
          background: #0f1a2e !important;
          border-color: #4b5f86 !important;
          color: #f1f5ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel button {
          border-color: #4b5f86 !important;
          color: #e6efff !important;
          background: #1a2742 !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel button:hover {
          background: #223255 !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel button[class*="bg-[#7a1f1f]"] {
          background: #7a1f1f !important;
          color: #fff !important;
          border-color: #7a1f1f !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-admin-table th,
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-admin-table td {
          color: #e6efff !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-admin-table-wrap {
          background: #121c32 !important;
          border-color: #3a4a6c !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-admin-table thead {
          background: #17243e !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-admin-table thead tr {
          border-color: #3a4a6c !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-admin-table tbody tr {
          background: #121c32 !important;
          border-color: #2f4164 !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-admin-table tbody tr:hover {
          background: #1a2742 !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-admin-table td span {
          background: #21314f !important;
          border-color: #4b5f86 !important;
          color: #dbe7ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-admin-table button[class*="bg-white"] {
          background: #1a2742 !important;
          color: #e6efff !important;
          border-color: #4b5f86 !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-admin-table button[class*="bg-red-50"] {
          background: #7f1d1d !important;
          border-color: #ef4444 !important;
          color: #fee2e2 !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-muted-text {
          color: #b8c8f2 !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-form-surface {
          background: #121c32 !important;
          border-color: #3a4a6c !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-form-surface > .rounded-xl {
          background: #1a2742 !important;
          border-color: #4b5f86 !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-announcement-card {
          background: linear-gradient(180deg, #14203a 0%, #121b31 100%) !important;
          border-color: #3a4a6c !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-announcement-card p,
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-form-surface p,
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-form-surface h4,
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-form-surface span {
          color: #e6efff !important;
        }
        .admin-theme-dark .quick-page-root .quick-requests-badge {
          background: #7c2d12 !important;
          border-color: #f97316 !important;
          color: #ffedd5 !important;
        }
        .quick-approve-btn {
          background: #dcfce7;
          border-color: #22c55e;
          color: #166534;
        }
        .quick-reject-btn {
          background: #fee2e2;
          border-color: #ef4444;
          color: #991b1b;
        }
        .quick-approval-user {
          border: 1px solid #dfc7aa;
          border-left: 5px solid #b45309;
          background: #fffefc;
          box-shadow: 0 4px 10px rgba(122, 31, 31, 0.06);
        }
        .quick-approval-user.quick-approval-user-alt {
          border-color: #d4bc9f;
          border-left-color: #7a1f1f;
          background: #fff7ec;
        }
        .quick-approval-shell {
          background: linear-gradient(180deg, #fff5e8 0%, #fffaf2 100%);
          border: 1px solid #e4cfb4;
        }
        .quick-approval-avatar {
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
        .quick-approval-chip {
          border: 1px solid #ead6be;
          background: #fffaf4;
          color: #7a1f1f;
          border-radius: 999px;
          padding: 0.15rem 0.55rem;
          font-size: 10px;
          font-weight: 600;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-approval-user {
          border-color: #40577f !important;
          border-left-color: #60a5fa !important;
          background: #1a2842 !important;
          box-shadow: 0 6px 14px rgba(4, 10, 22, 0.38) !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-approval-user.quick-approval-user-alt {
          border-color: #4d6798 !important;
          border-left-color: #f59e0b !important;
          background: #1f2f4b !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-approval-shell {
          background: linear-gradient(180deg, #1c2b46 0%, #15233c 100%) !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-approval-avatar {
          border-color: #5070a8 !important;
          background: linear-gradient(135deg, #22375b 0%, #1b2d4a 100%) !important;
          color: #dce8ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-approval-chip {
          border-color: #526f9f !important;
          background: #22385c !important;
          color: #dce8ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-approve-btn {
          background: #14532d !important;
          border-color: #22c55e !important;
          color: #dcfce7 !important;
        }
        .admin-theme-dark .quick-page-root .quick-admin-panel .quick-reject-btn {
          background: #7f1d1d !important;
          border-color: #ef4444 !important;
          color: #fee2e2 !important;
        }
        @media (max-width: 767px) {
          .quick-page-root .quick-admin-panel .quick-approval-user .shrink-0 {
            width: 100%;
            justify-content: flex-end;
          }
        }
        .admin-theme-dark .quick-page-root .quick-gallery-panel,
        .admin-theme-dark .quick-page-root .quick-gallery-panel * {
          color: #e6efff !important;
        }
        .admin-theme-dark .quick-page-root .quick-gallery-panel {
          background: #1b2438 !important;
          border-color: #31405f !important;
          box-shadow: 0 12px 28px rgba(7, 14, 30, 0.45) !important;
        }
        .admin-theme-dark .quick-page-root .quick-gallery-panel input,
        .admin-theme-dark .quick-page-root .quick-gallery-panel select,
        .admin-theme-dark .quick-page-root .quick-gallery-panel textarea {
          background: #0f1a2e !important;
          border-color: #4b5f86 !important;
          color: #f1f5ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-gallery-panel label {
          color: #d8e5ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-gallery-panel input[type="checkbox"] {
          accent-color: #7aa2ff !important;
          background: #0f1a2e !important;
          border: 1px solid #6e87b8 !important;
        }
        .admin-theme-dark .quick-page-root .quick-gallery-panel .quick-form-surface {
          background: #121c32 !important;
          border-color: #3a4a6c !important;
        }
        .admin-theme-dark .quick-page-root .quick-gallery-panel .quick-gallery-card {
          background: #121c32 !important;
          border-color: #3a4a6c !important;
        }
        .admin-theme-dark .quick-page-root .quick-gallery-panel .quick-gallery-card button {
          color: #e6efff !important;
          border-color: #4b5f86 !important;
          background: #1a2742 !important;
        }
        .admin-theme-dark .quick-page-root .quick-gallery-panel .quick-gallery-card button:hover {
          background: #223255 !important;
        }
        .admin-theme-dark .quick-page-root .quick-gallery-panel .quick-gallery-card button[class*="red"] {
          color: #ffd7d7 !important;
          border-color: #7b3a3a !important;
          background: #3a1f28 !important;
        }
        .admin-theme-dark .quick-page-root .quick-hero-panel,
        .admin-theme-dark .quick-page-root .quick-hero-panel * {
          color: #e6efff !important;
        }
        .admin-theme-dark .quick-page-root .quick-hero-panel {
          background: #1b2438 !important;
          border-color: #31405f !important;
          box-shadow: 0 12px 28px rgba(7, 14, 30, 0.45) !important;
        }
        .admin-theme-dark .quick-page-root .quick-hero-panel input,
        .admin-theme-dark .quick-page-root .quick-hero-panel select,
        .admin-theme-dark .quick-page-root .quick-hero-panel textarea {
          background: #0f1a2e !important;
          border-color: #4b5f86 !important;
          color: #f1f5ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-hero-panel label {
          color: #d8e5ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-hero-panel input[type="checkbox"] {
          accent-color: #7aa2ff !important;
          background: #0f1a2e !important;
          border: 1px solid #6e87b8 !important;
        }
        .admin-theme-dark .quick-page-root .quick-hero-panel .quick-form-surface {
          background: #121c32 !important;
          border-color: #3a4a6c !important;
        }
        .admin-theme-dark .quick-page-root .quick-hero-panel .quick-hero-card {
          background: #121c32 !important;
          border-color: #3a4a6c !important;
        }
        .admin-theme-dark .quick-page-root .quick-hero-panel .quick-hero-card button {
          color: #e6efff !important;
          border-color: #4b5f86 !important;
          background: #1a2742 !important;
        }
        .admin-theme-dark .quick-page-root .quick-hero-panel .quick-hero-card button:hover {
          background: #223255 !important;
        }
        .admin-theme-dark .quick-page-root .quick-hero-panel .quick-hero-card button[class*="red"] {
          color: #ffd7d7 !important;
          border-color: #7b3a3a !important;
          background: #3a1f28 !important;
        }
        .admin-theme-dark .quick-page-root .quick-export-panel,
        .admin-theme-dark .quick-page-root .quick-export-panel * {
          color: #e6efff !important;
        }
        .admin-theme-dark .quick-page-root .quick-export-panel {
          background: #1b2438 !important;
          border-color: #31405f !important;
          box-shadow: 0 12px 28px rgba(7, 14, 30, 0.45) !important;
        }
        .admin-theme-dark .quick-page-root .quick-export-panel input,
        .admin-theme-dark .quick-page-root .quick-export-panel select,
        .admin-theme-dark .quick-page-root .quick-export-panel textarea,
        .admin-theme-dark .quick-page-root .quick-export-panel button {
          border-color: #4b5f86 !important;
        }
        .admin-theme-dark .quick-page-root .quick-export-panel label {
          color: #d8e5ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-export-panel .quick-export-filter-surface {
          background: #121c32 !important;
          border-color: #3a4a6c !important;
        }
        .admin-theme-dark .quick-page-root .quick-export-panel input,
        .admin-theme-dark .quick-page-root .quick-export-panel select,
        .admin-theme-dark .quick-page-root .quick-export-panel textarea {
          background: #0f1a2e !important;
          color: #f1f5ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-export-panel button {
          color: #e6efff !important;
          background: #1a2742 !important;
          border-color: #4b5f86 !important;
        }
        .admin-theme-dark .quick-page-root .quick-export-panel button:hover {
          background: #223255 !important;
        }
        .admin-theme-dark .quick-page-root .quick-export-panel table,
        .admin-theme-dark .quick-page-root .quick-export-panel thead,
        .admin-theme-dark .quick-page-root .quick-export-panel tbody,
        .admin-theme-dark .quick-page-root .quick-export-panel tr,
        .admin-theme-dark .quick-page-root .quick-export-panel th,
        .admin-theme-dark .quick-page-root .quick-export-panel td {
          background: #121c32 !important;
          color: #e6efff !important;
          border-color: #3a4a6c !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcements-panel,
        .admin-theme-dark .quick-page-root .quick-announcements-panel * {
          color: #e6efff !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcements-panel {
          background: #1b2438 !important;
          border-color: #31405f !important;
          box-shadow: 0 12px 28px rgba(7, 14, 30, 0.45) !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcements-panel input,
        .admin-theme-dark .quick-page-root .quick-announcements-panel select,
        .admin-theme-dark .quick-page-root .quick-announcements-panel textarea {
          background: #0f1a2e !important;
          border-color: #4b5f86 !important;
          color: #f1f5ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcements-panel label {
          color: #d8e5ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcements-panel input[type="checkbox"] {
          accent-color: #7aa2ff !important;
          background: #0f1a2e !important;
          border: 1px solid #6e87b8 !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcements-panel .quick-form-surface {
          background: #121c32 !important;
          border-color: #3a4a6c !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcements-panel .quick-announcement-toggle {
          background: #121c32 !important;
          border-color: #3a4a6c !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcements-panel .quick-announcement-card {
          background: linear-gradient(180deg, #14203a 0%, #121b31 100%) !important;
          border-color: #3a4a6c !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcements-panel .quick-announcement-pill {
          background: #1a2742 !important;
          border-color: #4b5f86 !important;
          color: #dbe7ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcement-title {
          color: #edf4ff !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcement-message {
          color: #c7d7f4 !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcement-action {
          border-color: #4b5f86 !important;
          background: #1a2742 !important;
          color: #e6efff !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcement-action:hover {
          background: #223255 !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcement-action-danger {
          border-color: #7b3a3a !important;
          background: #3a1f28 !important;
          color: #ffd7d7 !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcement-action-danger:hover {
          background: #4a2833 !important;
        }
        .admin-theme-dark .quick-page-root .quick-refresh-btn {
          background: #1a2742 !important;
          border-color: #4b5f86 !important;
          color: #e6efff !important;
        }
        .admin-theme-dark .quick-page-root .quick-refresh-btn:hover {
          background: #223255 !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcements-panel button {
          border-color: #4b5f86 !important;
          color: #e6efff !important;
          background: #1a2742 !important;
        }
        .admin-theme-dark .quick-page-root .quick-announcements-panel button:hover {
          background: #223255 !important;
        }
      `}</style>

      <div className="quick-page-root">
        <section className="quick-hero rounded-3xl border border-[#d8d7f2] bg-[#f7f6ff] p-6 md:p-8">
          <p className="quick-subheading text-xs uppercase tracking-[0.2em] text-[#3e3a86]/70">
            Quick Actions Workspace
          </p>
          <h2 className="quick-heading mt-2 text-2xl md:text-3xl font-semibold text-[#2f2d66]">
            Super Dashboard Command Deck
          </h2>
          <p className="quick-muted mt-3 max-w-2xl text-sm md:text-base text-[#3b395d]/85">
            Dashboard ke quick buttons yahin open honge. Yahan se aage aapke order ke hisaab
            se har action ka full workflow implement karenge.
          </p>
        </section>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ACTIONS.map((item, index) => {
            const Icon = item.icon;
            const isSelected = selectedAction.key === item.key;
            const isDisabled = DISABLED_ACTION_KEYS.has(item.key);
            const styles = accentStyles[item.accent];
            return (
              <button
                key={item.key}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && setSearchParams({ tab: item.key })}
                className={`quick-card ${isSelected ? "quick-card-selected" : ""} quick-action-enter group relative overflow-hidden rounded-2xl border px-4 py-5 text-left transition duration-300 ${styles.card} ${isSelected
                  ? `${styles.active} -translate-y-1`
                  : "hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(33,33,33,0.12)]"
                  } ${isDisabled ? "opacity-50 grayscale cursor-not-allowed hover:translate-y-0 hover:shadow-none" : ""}`}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                {(isDisabled || item.state !== "ready") && (
                  <div
                    className={`quick-badge absolute right-3 top-3 rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] bg-white ${isDisabled
                      ? "border-[#eadfcd] text-[#7a1f1f]"
                      : "border-[#eadfcd] text-[#7a1f1f]"
                      }`}
                  >
                    {isDisabled ? "Disabled" : "Suggested"}
                  </div>
                )}
                {item.key === "approvals" && pendingUsers.length > 0 && (
                  <div className="quick-badge absolute right-3 top-3 rounded-full border border-[#ffd9b1] bg-white px-2 py-1 text-[10px] font-semibold text-[#c2410c]">
                    {pendingUsers.length} Requests
                  </div>
                )}

                <div
                  className={`quick-icon-box inline-flex h-11 w-11 items-center justify-center rounded-xl border transition group-hover:scale-105 ${styles.icon}`}
                >
                  <Icon />
                </div>
                <h3 className="quick-card-title mt-4 text-lg font-semibold text-[#2a273a]">{item.title}</h3>
                <p className="quick-card-subtitle mt-2 text-sm text-[#3f3b57]/85">{item.subtitle}</p>
              </button>
            );
          })}
        </section>

        <section
          ref={actionDetailRef}
          className={`quick-selected mt-6 rounded-2xl border bg-white p-5 md:p-6 ${selectedStyle.active}`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#4a456f]/70">
            Selected Action
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`pulse-dot h-2.5 w-2.5 rounded-full ${selectedStyle.dot}`} />
            <h3 className="quick-selected-title text-xl font-semibold text-[#2a273a]">{selectedAction.title}</h3>
          </div>
          <p className="quick-selected-subtitle mt-2 text-sm text-[#3f3b57]/85">{selectedAction.subtitle}</p>

          {selectedAction.state === "suggested" && (
            <p className="quick-suggested-note mt-4 text-sm text-[#544f79]/90">
              Suggested ka matlab: ye optional next-phase features hain jo audit aur security
              control strong banate hain. Core actions complete hone ke baad inhe implement karna
              useful rahega.
            </p>
          )}

          {selectedAction.key === "admins" && (
            <section className="quick-admin-panel mt-6 rounded-2xl border border-[#ead8c4] bg-white p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h4 className="quick-section-heading">Admin Operations</h4>
                  <p className="quick-muted-text mt-1 text-sm text-[#7a1f1f]/70">
                    Add ya manage admins ka flow yahin se handle hoga.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAdminAction("add-admin")}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${isAddAdmin
                      ? "bg-[#7a1f1f] text-white shadow-md"
                      : "border border-[#ead8c4] bg-white text-[#7a1f1f] hover:shadow-sm"
                      }`}
                  >
                    <FaPlus className="text-xs" />
                    Add Admin
                  </button>
                  <button
                    onClick={() => setAdminAction("manage-admins")}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${isManageAdmins
                      ? "bg-[#7a1f1f] text-white shadow-md"
                      : "border border-[#ead8c4] bg-white text-[#7a1f1f] hover:shadow-sm"
                      }`}
                  >
                    <FaUsers className="text-xs" />
                    Manage Admins
                  </button>
                </div>
              </div>

              {isAddAdmin && (
                <form
                  onSubmit={handleCreateAdmin}
                  className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
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
                      className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-[#fffaf4] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                    >
                      <option value="village_admin">Village Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                      <FaUser className="text-[#7a1f1f]/60" />
                      Full Name
                    </label>
                    <input
                      value={adminForm.name}
                      onChange={(e) =>
                        setAdminForm((p) => ({ ...p, name: capitalizeWords(e.target.value) }))
                      }
                      className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-[#fffaf4] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                      <FaEnvelope className="text-[#7a1f1f]/60" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-[#fffaf4] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                      <FaLock className="text-[#7a1f1f]/60" />
                      Password
                    </label>
                    <input
                      type="password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm((p) => ({ ...p, password: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-[#fffaf4] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                      placeholder="Secure password"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                      <FaPhone className="text-[#7a1f1f]/60" />
                      Mobile Number
                    </label>
                    <input
                      value={adminForm.mobile}
                      onChange={(e) => setAdminForm((p) => ({ ...p, mobile: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-[#fffaf4] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  {adminForm.role === "village_admin" && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-[#7a1f1f]/60" />
                        Village
                      </label>
                      <select
                        value={adminForm.village}
                        onChange={(e) => setAdminForm((p) => ({ ...p, village: e.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-[#fffaf4] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
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
                            setAdminForm((p) => ({ ...p, villageOther: capitalizeWords(e.target.value) }))
                          }
                          className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-[#fffaf4] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                          placeholder="Enter village name"
                        />
                      )}
                    </div>
                  )}
                  {adminError && (
                    <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {adminError}
                    </div>
                  )}
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={adminLoading}
                      className="inline-flex items-center gap-2 rounded-full bg-[#7a1f1f] px-5 py-2 text-sm text-white shadow-md transition hover:shadow-lg disabled:opacity-70"
                    >
                      {adminLoading ? "Creating..." : "Create Admin"}
                    </button>
                  </div>
                </form>
              )}

              {isManageAdmins && (
                <div className="mt-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="relative flex-1 md:max-w-md">
                      <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a1f1f]/60" />
                      <input
                        value={manageSearch}
                        onChange={(e) => setManageSearch(e.target.value)}
                        placeholder="Search by name, email, role, or village..."
                        className="w-full rounded-2xl border border-[#ead8c4] bg-[#fffaf4] pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={fetchAdmins}
                        className="rounded-full border border-[#ead8c4] bg-white px-4 py-2 text-sm text-[#7a1f1f] hover:shadow-sm"
                      >
                        Refresh
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        disabled={selectedIds.length === 0}
                        className="rounded-full bg-[#7a1f1f] px-4 py-2 text-sm text-white shadow-md disabled:opacity-50"
                      >
                        Delete Selected
                      </button>
                    </div>
                  </div>

                  <div className="quick-admin-table-wrap mt-4 overflow-x-auto rounded-2xl border border-[#ead8c4] bg-white">
                    <table className="quick-admin-table min-w-[760px] w-full text-sm">
                      <thead className="text-left text-[#7a1f1f]/75">
                        <tr className="border-b border-[#ead8c4]">
                          <th className="px-4 py-3">
                            <input
                              ref={selectAllRef}
                              type="checkbox"
                              onChange={() => {
                                if (selectedIds.length === deletableAdmins.length) {
                                  setSelectedIds([]);
                                } else {
                                  setSelectedIds(
                                    deletableAdmins.map((a) => a._id || a.id).filter(Boolean)
                                  );
                                }
                              }}
                            />
                          </th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Village</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Mobile</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminListLoading && (
                          <tr>
                            <td colSpan={7} className="px-4 py-4 text-sm text-[#7a1f1f]/70">
                              Loading admins...
                            </td>
                          </tr>
                        )}
                        {adminListError && (
                          <tr>
                            <td colSpan={7} className="px-4 py-4 text-sm text-red-600">
                              {adminListError}
                            </td>
                          </tr>
                        )}
                        {!adminListLoading &&
                          !adminListError &&
                          filteredAdmins.map((admin) => {
                            const id = admin._id || admin.id;
                            const isSuper = admin.role === "super_admin";
                            const isChecked = selectedIds.includes(id);
                            return (
                              <tr key={id} className="border-b border-[#f1e2d3]">
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    disabled={isSuper}
                                    checked={isChecked}
                                    onChange={() => {
                                      if (!id || isSuper) return;
                                      setSelectedIds((prev) =>
                                        prev.includes(id)
                                          ? prev.filter((v) => v !== id)
                                          : [...prev, id]
                                      );
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-3">{admin.name}</td>
                                <td className="px-4 py-3">
                                  <span className="rounded-full border border-[#ead8c4] bg-[#fff6e5] px-2 py-1 text-xs text-[#7a1f1f]">
                                    {admin.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3">{admin.village || "-"}</td>
                                <td className="px-4 py-3">{admin.email}</td>
                                <td className="px-4 py-3">{admin.mobile || "-"}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        setEditForm(() => {
                                          const resolvedVillage = admin.village || "";
                                          const isKnownVillage = villageValues.has(resolvedVillage);
                                          return {
                                            id,
                                            name: admin.name || "",
                                            email: admin.email || "",
                                            mobile: admin.mobile || "",
                                            village: isKnownVillage ? resolvedVillage : resolvedVillage ? "other" : "",
                                            villageOther: isKnownVillage ? "" : resolvedVillage,
                                            role: admin.role || "village_admin",
                                            password: "",
                                          };
                                        })
                                      }
                                      className="inline-flex items-center gap-1 rounded-full border border-[#ead8c4] bg-white px-3 py-1 text-xs text-[#7a1f1f] hover:shadow-sm"
                                    >
                                      <FaEdit className="text-[10px]" />
                                      Edit
                                    </button>
                                    {!isSuper && (
                                      <button
                                        onClick={() => handleDeleteAdmin(id)}
                                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-600 hover:shadow-sm"
                                      >
                                        <FaTrash className="text-[10px]" />
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        {!adminListLoading && !adminListError && filteredAdmins.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-4 text-sm text-[#7a1f1f]/70">
                              No admins found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {editForm && (
                    <form
                      onSubmit={handleUpdateAdmin}
                      className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-[#ead8c4] bg-[#fffaf4] p-5"
                    >
                      <div className="md:col-span-2 flex items-center justify-between">
                        <h5 className="text-base font-semibold text-[#7a1f1f]">Edit Admin</h5>
                        <button
                          type="button"
                          onClick={() => setEditForm(null)}
                          className="rounded-full border border-[#ead8c4] bg-white px-3 py-1 text-xs text-[#7a1f1f]"
                        >
                          Cancel
                        </button>
                      </div>
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
                          className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                          <FaEnvelope className="text-[#7a1f1f]/60" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                          className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                          <FaPhone className="text-[#7a1f1f]/60" />
                          Mobile Number
                        </label>
                        <input
                          value={editForm.mobile}
                          onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))}
                          className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                          <FaUser className="text-[#7a1f1f]/60" />
                          Role
                        </label>
                        <select
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              role: e.target.value,
                              village: e.target.value === "village_admin" ? p.village : "",
                              villageOther: e.target.value === "village_admin" ? p.villageOther : "",
                            }))
                          }
                          className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                        >
                          <option value="village_admin">Village Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </div>
                      {editForm.role === "village_admin" && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                          <FaMapMarkerAlt className="text-[#7a1f1f]/60" />
                          Village
                        </label>
                        <select
                          value={editForm.village}
                          onChange={(e) => setEditForm((p) => ({ ...p, village: e.target.value }))}
                          className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
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
                            className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                            placeholder="Enter village name"
                          />
                        )}
                      </div>
                      )}
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-[#7a1f1f]/90 flex items-center gap-2">
                          <FaLock className="text-[#7a1f1f]/60" />
                          New Password (Optional)
                        </label>
                        <input
                          type="password"
                          value={editForm.password}
                          onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                          className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                          placeholder="Leave blank to keep current password"
                        />
                      </div>
                      {editError && (
                        <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                          {editError}
                        </div>
                      )}
                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={editLoading}
                          className="rounded-full bg-[#7a1f1f] px-5 py-2 text-sm text-white shadow-md disabled:opacity-70"
                        >
                          {editLoading ? "Updating..." : "Update Admin"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </section>
          )}

          {selectedAction.key === "approvals" && (
            <section className="quick-admin-panel mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4 rounded-2xl border border-[#ead8c4] bg-white p-5 md:p-6">
              <div className="quick-form-surface rounded-2xl border border-[#ead8c4] bg-[#fffaf4] p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="quick-section-heading">Approval Security Settings</h4>
                  {settingsLoading && <span className="text-xs text-[#7a1f1f]/70">Loading...</span>}
                </div>
                <div className="mt-4 rounded-xl border border-[#ead8c4] bg-white px-4 py-3 flex items-center justify-between">
                  <p className="text-sm text-[#7a1f1f]">
                    Global Mode:{" "}
                    <span className="font-semibold">
                      {approvalSettings.globalEnabled ? "Approval Required" : "Instant Active"}
                    </span>
                  </p>
                  <button
                    onClick={() => updateGlobalApproval(!approvalSettings.globalEnabled)}
                    className="rounded-full border border-[#7a1f1f]/20 bg-white px-3 py-1 text-xs font-semibold text-[#7a1f1f]"
                  >
                    {approvalSettings.globalEnabled ? "Disable" : "Enable"}
                  </button>
                </div>
                <div className="mt-3 space-y-2 max-h-[320px] overflow-auto">
                  {VILLAGE_OPTIONS.filter((v) => v.value !== "other").map((villageItem) => {
                    const village = villageItem.value;
                    const override = approvalSettings.villageOverrides.find((item) => item.village === village);
                    const effective = override ? Boolean(override.enabled) : Boolean(approvalSettings.globalEnabled);
                    return (
                      <div key={village} className="quick-announcement-card rounded-xl border border-[#ead8c4] bg-white px-3 py-2 flex items-center justify-between">
                        <p className="text-sm text-[#7a1f1f]">{village}</p>
                        <button
                          onClick={() => updateVillageApproval(village, !effective)}
                          className="rounded-full border border-[#7a1f1f]/20 bg-white px-3 py-1 text-xs font-semibold text-[#7a1f1f]"
                        >
                          {effective ? "Set Instant Active" : "Set Require Approval"}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {settingsError && <p className="mt-3 text-xs text-red-600">{settingsError}</p>}
              </div>

              <div className="quick-form-surface quick-approval-shell rounded-2xl border border-[#ead8c4] p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="quick-section-heading">Pending User Requests</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="quick-requests-badge rounded-full border border-[#ffd9b1] bg-[#fff7ef] px-3 py-1 text-xs font-semibold text-[#c2410c]">
                      {pendingUsers.length} Requests
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-[#7a1f1f]/70">
                  Har request ko individual review karke accept/reject karein.
                </p>
                <div className="mt-4 space-y-3 max-h-[420px] overflow-auto">
                  {pendingLoading && <p className="text-sm text-[#7a1f1f]/70">Loading requests...</p>}
                  {!pendingLoading && pendingUsers.length === 0 && (
                    <p className="text-sm text-[#7a1f1f]/70">No pending requests.</p>
                  )}
                  {!pendingLoading &&
                    pendingUsers.map((user, idx) => (
                        <div
                        key={user._id}
                        className={`quick-announcement-card quick-approval-user rounded-xl p-3 ${
                          idx % 2 === 1 ? "quick-approval-user-alt" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-1 items-start gap-2.5">
                          <span className="quick-approval-avatar">
                            {String(user.name || "U").trim().charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[#7a1f1f]">{user.name}</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <span className="quick-approval-chip">{user.village || "-"}</span>
                              <span className="quick-approval-chip">{user.mobile || "-"}</span>
                            </div>
                            <p className="text-xs text-[#7a1f1f]/75 mt-1">{user.email || "-"}</p>
                            <p className="text-xs text-[#7a1f1f]/75">
                              Created: {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
                            </p>
                          </div>
                          </div>
                          <div className="ml-auto flex items-center gap-2 shrink-0 pl-4">
                            <button
                              onClick={() => handlePendingAction(user._id, "approve")}
                              disabled={pendingLoading || pendingBulkBusy}
                              className="quick-approve-btn inline-flex items-center justify-center rounded-md border px-3 py-1 text-[11px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handlePendingAction(user._id, "reject")}
                              disabled={pendingLoading || pendingBulkBusy}
                              className="quick-reject-btn inline-flex items-center justify-center rounded-md border px-3 py-1 text-[11px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                {pendingError && <p className="mt-3 text-xs text-red-600">{pendingError}</p>}
              </div>
            </section>
          )}

          {selectedAction.key === "export" && (
            <section className="quick-export-panel mt-6 overflow-visible rounded-2xl border border-[#d4ebdc] bg-white p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h4 className="quick-section-heading">Export Results</h4>
                  <p className="mt-1 text-sm text-[#166534]/75">
                    Sirf accepted results export honge. Default rank range `1-3` hai.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setExportPreviewPage(1);
                    fetchExportPreview(exportFilters, 1);
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-[#d4ebdc] bg-white px-4 py-2 text-sm text-[#166534] hover:shadow-sm"
                >
                  Refresh
                </button>
              </div>

              <div className="quick-export-filter-surface mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 rounded-2xl border border-[#d4ebdc] bg-[#f4fcf7] p-4">
                <div>
                  <label className="text-sm font-medium text-[#166534]/90">Standard</label>
                    <select
                      ref={exportStandardRef}
                      value={exportFilters.standard}
                      onChange={(e) => setExportFilters((p) => ({ ...p, standard: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-[#cde4d5] bg-white px-3 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#15803d]/30"
                    >
                    <option value="all">All</option>
                    {exportFilterOptions.standards.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#166534]/90">Medium</label>
                    <select
                      ref={exportMediumRef}
                      value={exportFilters.medium}
                      onChange={(e) => setExportFilters((p) => ({ ...p, medium: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-[#cde4d5] bg-white px-3 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#15803d]/30"
                    >
                    <option value="all">All</option>
                    {exportFilterOptions.mediums.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#166534]/90">Village</label>
                    <select
                      ref={exportVillageRef}
                      value={exportFilters.village}
                      onChange={(e) => setExportFilters((p) => ({ ...p, village: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-[#cde4d5] bg-white px-3 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#15803d]/30"
                    >
                    <option value="all">All</option>
                    {exportFilterOptions.villages.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#166534]/90">Export Format</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExportFilters((p) => ({ ...p, format: "pdf" }))}
                      className={`rounded-xl border px-3 py-2 text-sm ${exportFilters.format === "pdf"
                        ? "border-[#15803d] bg-white text-[#166534]"
                        : "border-[#cde4d5] bg-white text-[#2f5f44]"
                        }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <FaFilePdf />
                        PDF
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFilters((p) => ({ ...p, format: "excel" }))}
                      className={`rounded-xl border px-3 py-2 text-sm ${exportFilters.format === "excel"
                        ? "border-[#15803d] bg-white text-[#166534]"
                        : "border-[#cde4d5] bg-white text-[#2f5f44]"
                        }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <FaFileExcel />
                        Excel
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#166534]/90">Rank Range</label>
                  <select
                    value={exportFilters.rangeMode}
                    onChange={(e) => setExportFilters((p) => ({ ...p, rangeMode: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[#cde4d5] bg-white px-3 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#15803d]/30"
                  >
                    <option value="top">Custom (Default 1-3)</option>
                    <option value="all">All</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium text-[#166534]/90">From</label>
                    <input
                      ref={exportRangeFromRef}
                      type="number"
                      min="1"
                      disabled={exportFilters.rangeMode === "all"}
                      value={exportFilters.rangeFrom}
                      onChange={(e) =>
                        setExportFilters((p) => ({ ...p, rangeFrom: e.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-[#cde4d5] bg-white px-3 py-2.5 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#166534]/90">To</label>
                    <input
                      ref={exportRangeToRef}
                      type="number"
                      min="1"
                      disabled={exportFilters.rangeMode === "all"}
                      value={exportFilters.rangeTo}
                      onChange={(e) =>
                        setExportFilters((p) => ({ ...p, rangeTo: e.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-[#cde4d5] bg-white px-3 py-2.5 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30"
                    />
                  </div>
                </div>
              </div>

              {exportError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {exportError}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExportPreviewPage(1);
                    fetchExportPreview(exportFilters, 1);
                  }}
                  disabled={exportPreviewLoading}
                  className="rounded-full border border-[#d4ebdc] bg-white px-4 py-2 text-sm text-[#166534] hover:shadow-sm disabled:opacity-60"
                >
                  {exportPreviewLoading ? "Loading Preview..." : "Preview Results"}
                </button>
                <button
                  type="button"
                  onClick={handleExportDownload}
                  disabled={exportLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-[#166534] px-5 py-2 text-sm text-white shadow-md disabled:opacity-70"
                >
                  <FaDownload className="text-xs" />
                  {exportLoading ? "Preparing File..." : "Download"}
                </button>
              </div>

              <div className="mt-4 text-sm text-[#166534]/80">
                Showing page {exportPreviewMeta.page} of {exportPreviewMeta.pages} • {exportPreviewMeta.showing} records on this page • Total {exportPreviewMeta.total} records.
              </div>

              <div className="mt-3 overflow-x-auto rounded-2xl border border-[#d4ebdc] bg-white">
                <table className="min-w-[760px] w-full text-sm">
                  <thead className="text-left text-[#166534]/80">
                    <tr className="border-b border-[#d4ebdc]">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Standard</th>
                      <th className="px-4 py-3">Medium</th>
                      <th className="px-4 py-3">Village</th>
                      <th className="px-4 py-3">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportPreviewLoading && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-[#166534]/75">
                          Preview loading...
                        </td>
                      </tr>
                    )}
                    {!exportPreviewLoading && exportPreview.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-[#166534]/75">
                          No accepted results found for selected filters.
                        </td>
                      </tr>
                    )}
                    {!exportPreviewLoading &&
                      exportPreview.map((item) => (
                        <tr key={item._id || `${item.email}-${item.percentage}`} className="border-b border-[#eef8f2]">
                          <td className="px-4 py-3">{item.full_name}</td>
                          <td className="px-4 py-3">{item.standard}</td>
                          <td className="px-4 py-3">{item.medium}</td>
                          <td className="px-4 py-3">{item.village}</td>
                          <td className="px-4 py-3">{item.percentage}%</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  disabled={exportPreviewLoading || exportPreviewPage <= 1}
                  onClick={() => {
                    const next = Math.max(1, exportPreviewPage - 1);
                    setExportPreviewPage(next);
                    fetchExportPreview(exportFilters, next);
                  }}
                  className="rounded-full border border-[#d4ebdc] bg-white px-4 py-2 text-sm text-[#166534] disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={exportPreviewLoading || exportPreviewPage >= exportPreviewMeta.pages}
                  onClick={() => {
                    const next = Math.min(exportPreviewMeta.pages, exportPreviewPage + 1);
                    setExportPreviewPage(next);
                    fetchExportPreview(exportFilters, next);
                  }}
                  className="rounded-full border border-[#d4ebdc] bg-white px-4 py-2 text-sm text-[#166534] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </section>
          )}

          {selectedAction.key === "gallery" && (
            <section className="quick-gallery-panel mt-6 rounded-2xl border border-[#ead8c4] bg-white p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h4 className="quick-section-heading">Manage Gallery</h4>
                  <p className="mt-1 text-sm text-[#7a1f1f]/70">
                    Gallery images yahan se add, replace, ya delete honge.
                  </p>
                </div>
                <button
                  onClick={fetchGallery}
                  className="quick-refresh-btn inline-flex items-center justify-center rounded-full border border-[#ead8c4] bg-white px-4 py-2 text-sm text-[#7a1f1f] hover:shadow-sm"
                >
                  Refresh
                </button>
              </div>

              <form
                ref={galleryFormRef}
                onSubmit={galleryEdit ? handleUpdateGallery : handleCreateGallery}
                className="quick-form-surface mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-[#ead8c4] bg-[#fffaf4] p-5"
              >
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-[#7a1f1f]/90">
                    Category
                  </label>
                  <select
                    value={galleryForm.category}
                    onChange={(e) =>
                      setGalleryForm((p) => ({ ...p, category: e.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm text-center sm:text-left focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                  >
                    <option value="snehmilan">Snehmilan</option>
                    <option value="cricket">Cricket</option>
                    <option value="butbhavani_havan">Butbhavani Maa Havan</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#7a1f1f]/90">
                    Title (Optional)
                  </label>
                  <input
                    value={galleryForm.title}
                    onChange={(e) =>
                      setGalleryForm((p) => ({ ...p, title: e.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                    placeholder="Short title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#7a1f1f]/90">
                    Upload File
                  </label>
                  <input
                    key={galleryFileInputKey}
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setGalleryFiles(files);
                      if (files.length > 0) {
                        setGalleryEditFile(files[0] || null);
                      } else {
                        setGalleryEditFile(null);
                      }
                    }}
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-2.5 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-[#7a1f1f]/90">
                    Or Image/File URL
                  </label>
                  <input
                    value={galleryForm.imageUrl}
                    onChange={(e) =>
                      setGalleryForm((p) => ({ ...p, imageUrl: e.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                    placeholder="https://example.com/file.jpg"
                  />
                  <p className="mt-2 text-xs text-[#7a1f1f]/60">
                    File upload ya URL me se koi ek required hai. Multiple files select karoge to title auto-set hoga.
                  </p>
                </div>
                {galleryError && (
                  <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {galleryError}
                  </div>
                )}
                <div className="md:col-span-2 flex justify-end">
                  <div className="flex flex-wrap gap-2">
                    {galleryEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setGalleryEdit(null);
                          setGalleryEditFile(null);
                          setGalleryForm({ title: "", category: "snehmilan", imageUrl: "" });
                          setGalleryFiles([]);
                          setGalleryFileInputKey((k) => k + 1);
                        }}
                        className="rounded-full border border-[#ead8c4] bg-white px-4 py-2 text-sm text-[#7a1f1f]"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={gallerySaving || galleryEditSaving}
                      className="rounded-full bg-[#7a1f1f] px-5 py-2 text-sm text-white shadow-md disabled:opacity-70"
                    >
                      {galleryEdit
                        ? galleryEditSaving
                          ? "Updating..."
                          : "Update Image"
                        : gallerySaving
                          ? "Saving..."
                          : "Add New Image"}
                    </button>
                  </div>
                </div>
              </form>

              <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3 text-sm text-[#7a1f1f]/80">
                  <label className="inline-flex items-center gap-2">
                    <input
                      ref={gallerySelectAllRef}
                      type="checkbox"
                      onChange={() => {
                        const pageIds = galleryPageItems
                          .map((item) => item._id || item.id)
                          .filter(Boolean);
                        const allSelected = pageIds.every((id) =>
                          selectedGalleryIds.includes(id)
                        );
                        if (allSelected) {
                          setSelectedGalleryIds((prev) =>
                            prev.filter((id) => !pageIds.includes(id))
                          );
                        } else {
                          setSelectedGalleryIds((prev) => [
                            ...new Set([...prev, ...pageIds]),
                          ]);
                        }
                      }}
                    />
                    Select page
                  </label>
                  <span>{selectedGalleryIds.length} selected</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={galleryPerPage}
                    onChange={(e) => setGalleryPerPage(Number(e.target.value))}
                    className="rounded-full border border-[#ead8c4] bg-white px-3 py-2 text-xs text-[#7a1f1f]"
                  >
                    <option value={6}>6 / page</option>
                    <option value={9}>9 / page</option>
                    <option value={12}>12 / page</option>
                  </select>
                  <button
                    onClick={handleBulkDeleteGallery}
                    disabled={selectedGalleryIds.length === 0}
                    className="rounded-full bg-[#7a1f1f] px-4 py-2 text-xs text-white shadow-md disabled:opacity-60"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {galleryLoading && (
                  <div className="rounded-2xl border border-[#ead8c4] bg-white px-4 py-6 text-sm text-[#7a1f1f]/70">
                    Loading gallery...
                  </div>
                )}
                {!galleryLoading && galleryItems.length === 0 && !galleryError && (
                  <div className="rounded-2xl border border-[#ead8c4] bg-white px-4 py-6 text-sm text-[#7a1f1f]/70">
                    No gallery items yet.
                  </div>
                )}
                {!galleryLoading &&
                  galleryPageItems.map((item) => {
                    const url = item.imageUrl || "";
                    const isImage = isImageFile(url);
                    const isPdf = isPdfFile(url);
                    const displayTitle =
                      item.title?.trim() || deriveTitle(url) || "Untitled";
                    const itemId = item._id || item.id;
                    const isChecked = selectedGalleryIds.includes(itemId);
                    return (
                      <div
                        key={itemId}
                        className="quick-gallery-card rounded-2xl border border-[#ead8c4] bg-white p-4 shadow-sm relative"
                      >
                        <label className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-full bg-white/90 px-2 py-1 text-xs text-[#7a1f1f] shadow">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (!itemId) return;
                              setSelectedGalleryIds((prev) =>
                                prev.includes(itemId)
                                  ? prev.filter((id) => id !== itemId)
                                  : [...prev, itemId]
                              );
                            }}
                          />
                        </label>
                        <div className="h-40 w-full overflow-hidden rounded-xl border border-[#ead8c4] bg-[#fffaf4] flex items-center justify-center">
                          {isImage && (
                            <img
                              src={url}
                              alt={displayTitle}
                              className="h-full w-full object-cover"
                            />
                          )}
                          {isPdf && (
                            <object
                              data={url}
                              type="application/pdf"
                              className="h-full w-full"
                            >
                              <div className="flex flex-col items-center justify-center text-[#7a1f1f]/70 text-sm">
                                <FaFilePdf className="text-3xl mb-2" />
                                PDF Preview
                              </div>
                            </object>
                          )}
                          {!isImage && !isPdf && (
                            <div className="flex flex-col items-center justify-center text-[#7a1f1f]/70 text-sm">
                              <FaFileAlt className="text-3xl mb-2" />
                              Document file
                            </div>
                          )}
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-[#7a1f1f]">
                            {displayTitle}
                          </p>
                          <p className="text-xs text-[#7a1f1f]/60 mt-1">
                            {item.category || "snehmilan"}
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => startEditGallery(item)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#ead8c4] bg-white px-3 py-1 text-xs text-[#7a1f1f] hover:shadow-sm"
                          >
                            <FaEdit className="text-[10px]" />
                            Change
                          </button>
                          <button
                            onClick={() => handleDeleteGallery(item._id || item.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-600 hover:shadow-sm"
                          >
                            <FaTrash className="text-[10px]" />
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="mt-6 flex items-center justify-between text-sm text-[#7a1f1f]/80">
                <span>
                  Page {galleryPage} of {galleryTotalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGalleryPage((p) => Math.max(1, p - 1))}
                    disabled={galleryPage === 1}
                    className="rounded-full border border-[#ead8c4] px-3 py-1 text-xs disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setGalleryPage((p) => Math.min(galleryTotalPages, p + 1))}
                    disabled={galleryPage === galleryTotalPages}
                    className="rounded-full border border-[#ead8c4] px-3 py-1 text-xs disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

            </section>
          )}

          {selectedAction.key === "hero" && (
            <section className="quick-hero-panel mt-6 rounded-2xl border border-[#ead8c4] bg-white p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h4 className="quick-section-heading">Hero Slider</h4>
                  <p className="mt-1 text-sm text-[#7a1f1f]/70">
                    Home page ke hero banners yahin se manage honge.
                  </p>
                </div>
                <button
                  onClick={fetchHero}
                  className="quick-refresh-btn inline-flex items-center justify-center rounded-full border border-[#ead8c4] bg-white px-4 py-2 text-sm text-[#7a1f1f] hover:shadow-sm"
                >
                  Refresh
                </button>
              </div>

              <form
                onSubmit={heroEdit ? handleUpdateHero : handleCreateHero}
                className="quick-form-surface mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-[#ead8c4] bg-[#fffaf4] p-5"
              >
                <div>
                  <label className="text-sm font-medium text-[#7a1f1f]/90">Title</label>
                  <input
                    value={heroForm.title}
                    onChange={(e) => setHeroForm((p) => ({ ...p, title: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                    placeholder="Slide title (Leave empty for no text)"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#7a1f1f]/90">Subtitle</label>
                  <input
                    value={heroForm.subtitle}
                    onChange={(e) => setHeroForm((p) => ({ ...p, subtitle: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                    placeholder="Short subtitle"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#7a1f1f]/90">
                    Upload Image
                  </label>
                  <input
                    key={heroFileInputKey}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const selected = e.target.files?.[0] || null;
                      if (!selected) return;
                      if (!selected.type?.startsWith("image/")) {
                        setHeroError("Please select a valid image file for hero slider.");
                        return;
                      }
                      setHeroError("");
                      setHeroFile(selected);
                      setHeroForm((p) => ({ ...p, imageUrl: "" }));
                      setHeroPreview(URL.createObjectURL(selected));
                    }}
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#7a1f1f]/90">
                    Or Image URL
                  </label>
                  <input
                    value={heroForm.imageUrl}
                    onChange={(e) => {
                      const nextUrl = e.target.value;
                      setHeroFile(null);
                      setHeroForm((p) => ({ ...p, imageUrl: nextUrl }));
                      setHeroPreview(nextUrl);
                    }}
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
                {(heroPreviewUrl || heroForm.imageUrl) && (
                  <div className="md:col-span-2 rounded-2xl border border-[#ead8c4] bg-white p-3">
                    <p className="text-xs text-[#7a1f1f]/70 mb-2">
                      Hero preview (16:9 frame)
                    </p>
                    <div className="w-full max-w-xl aspect-[16/9] overflow-hidden rounded-xl border border-[#ead8c4] bg-[#fffaf4]">
                      <img
                        src={heroPreviewUrl || heroForm.imageUrl}
                        alt="Hero preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-[#7a1f1f]/90">Order</label>
                  <input
                    type="number"
                    value={heroForm.order}
                    onChange={(e) =>
                      setHeroForm((p) => ({ ...p, order: Number(e.target.value) }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#7a1f1f]/90">Active</label>
                  <select
                    value={heroForm.isActive ? "true" : "false"}
                    onChange={(e) =>
                      setHeroForm((p) => ({ ...p, isActive: e.target.value === "true" }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                {heroError && (
                  <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {heroError}
                  </div>
                )}
                <div className="md:col-span-2 flex flex-wrap gap-2 justify-end">
                  {heroEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setHeroEdit(null);
                        setHeroForm({
                          title: "",
                          subtitle: "",
                          imageUrl: "",
                          order: 0,
                          isActive: true,
                        });
                        setHeroFile(null);
                        setHeroPreview("");
                        setHeroFileInputKey((k) => k + 1);
                      }}
                      className="rounded-full border border-[#ead8c4] bg-white px-4 py-2 text-sm text-[#7a1f1f]"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={heroSaving || heroEditSaving}
                    className="rounded-full bg-[#7a1f1f] px-5 py-2 text-sm text-white shadow-md disabled:opacity-70"
                  >
                    {heroEdit
                      ? heroEditSaving
                        ? "Updating..."
                        : "Update Slide"
                      : heroSaving
                        ? "Saving..."
                        : "Add Slide"}
                  </button>
                </div>
              </form>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {heroLoading && (
                  <div className="rounded-2xl border border-[#ead8c4] bg-white px-4 py-6 text-sm text-[#7a1f1f]/70">
                    Loading hero slides...
                  </div>
                )}
                {!heroLoading && heroItems.length === 0 && !heroError && (
                  <div className="rounded-2xl border border-[#ead8c4] bg-white px-4 py-6 text-sm text-[#7a1f1f]/70">
                    No hero slides yet.
                  </div>
                )}
                {!heroLoading && heroItems.length > 0 && (
                  <div className="md:col-span-2 xl:col-span-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-[#7a1f1f]/80">
                      <input
                        ref={heroSelectAllRef}
                        type="checkbox"
                        onChange={() => {
                          const ids = heroItems
                            .map((item) => item._id || item.id)
                            .filter(Boolean);
                          const allSelected = ids.every((id) =>
                            selectedHeroIds.includes(id)
                          );
                          if (allSelected) {
                            setSelectedHeroIds([]);
                          } else {
                            setSelectedHeroIds(ids);
                          }
                        }}
                      />
                      Select all
                    </label>
                    <button
                      onClick={handleBulkDeleteHero}
                      disabled={selectedHeroIds.length === 0}
                      className="rounded-full bg-[#7a1f1f] px-4 py-2 text-xs text-white shadow-md disabled:opacity-60"
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
                {!heroLoading &&
                  heroItems.map((item) => {
                    const displayTitle =
                      item.title?.trim() || deriveTitle(item.imageUrl) || "Untitled";
                    const itemId = item._id || item.id;
                    return (
                      <div
                        key={itemId}
                        className="quick-hero-card rounded-2xl border border-[#ead8c4] bg-white p-4 shadow-sm"
                      >
                        <label className="inline-flex items-center gap-2 text-xs text-[#7a1f1f]/80">
                          <input
                            type="checkbox"
                            checked={selectedHeroIds.includes(itemId)}
                            onChange={() => {
                              if (!itemId) return;
                              setSelectedHeroIds((prev) =>
                                prev.includes(itemId)
                                  ? prev.filter((v) => v !== itemId)
                                  : [...prev, itemId]
                              );
                            }}
                          />
                        </label>
                        <div className="h-36 w-full overflow-hidden rounded-xl border border-[#ead8c4] bg-[#fffaf4]">
                          <img
                            src={item.imageUrl}
                            alt={displayTitle}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-[#7a1f1f]">
                            {displayTitle}
                          </p>
                          <p className="text-xs text-[#7a1f1f]/60 mt-1">
                            {item.subtitle || "No subtitle"}
                          </p>
                          <p className="text-xs text-[#7a1f1f]/60 mt-1">
                            Order: {item.order || 0} - {item.isActive ? "Active" : "Inactive"}
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => startEditHero(item)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#ead8c4] bg-white px-3 py-1 text-xs text-[#7a1f1f] hover:shadow-sm"
                          >
                            <FaEdit className="text-[10px]" />
                            Change
                          </button>
                          <button
                            onClick={() => handleDeleteHero(itemId)}
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-600 hover:shadow-sm"
                          >
                            <FaTrash className="text-[10px]" />
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}

              </div>
            </section>
          )}

          {selectedAction.key === "announcements" && (
            <section className="quick-announcements-panel mt-6 rounded-2xl border border-[#ead8c4] bg-white p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h4 className="quick-section-heading">
                    Manage Announcements
                  </h4>
                  <p className="mt-1 text-sm text-[#7a1f1f]/70">
                    Title, description, date aur optional submit-result button yahan se manage hoga.
                  </p>
                </div>
                <button
                  onClick={fetchAnnouncements}
                  className="quick-refresh-btn inline-flex items-center justify-center rounded-full border border-[#ead8c4] bg-white px-4 py-2 text-sm text-[#7a1f1f] hover:shadow-sm"
                >
                  Refresh
                </button>
              </div>

              <form
                onSubmit={announcementEdit ? handleUpdateAnnouncement : handleCreateAnnouncement}
                className="quick-form-surface mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-[#ead8c4] bg-[#fffaf4] p-5"
              >
                <div>
                  <label className="text-sm font-medium text-[#7a1f1f]/90">Title</label>
                  <input
                    value={announcementForm.title}
                    onChange={(e) =>
                      setAnnouncementForm((p) => ({ ...p, title: e.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                    placeholder="Announcement title"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#7a1f1f]/90">Date (Optional)</label>
                  <input
                    type="date"
                    value={announcementForm.eventDate}
                    onChange={(e) =>
                      setAnnouncementForm((p) => ({ ...p, eventDate: e.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-[#7a1f1f]/90">Description</label>
                  <textarea
                    value={announcementForm.message}
                    onChange={(e) =>
                      setAnnouncementForm((p) => ({ ...p, message: e.target.value }))
                    }
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                    placeholder="Announcement description"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#7a1f1f]/90">Priority</label>
                  <select
                    value={announcementForm.priority}
                    onChange={(e) =>
                      setAnnouncementForm((p) => ({ ...p, priority: e.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#7a1f1f]/90">Status</label>
                  <select
                    value={announcementForm.isActive ? "true" : "false"}
                    onChange={(e) =>
                      setAnnouncementForm((p) => ({ ...p, isActive: e.target.value === "true" }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="quick-announcement-toggle md:col-span-2 rounded-xl border border-[#ead8c4] bg-white px-4 py-4">
                  <label className="inline-flex items-start gap-3 text-sm text-[#7a1f1f]/90">
                    <input
                      type="checkbox"
                      checked={announcementForm.showSubmitButton}
                      onChange={(e) =>
                        setAnnouncementForm((p) => ({
                          ...p,
                          showSubmitButton: e.target.checked,
                        }))
                      }
                      className="mt-1"
                    />
                    <span>Show submit-result button in this announcement</span>
                  </label>
                </div>
                {announcementForm.showSubmitButton && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-[#7a1f1f]/90">Button Label</label>
                    <input
                      value={announcementForm.submitButtonLabel}
                      onChange={(e) =>
                        setAnnouncementForm((p) => ({
                          ...p,
                          submitButtonLabel: e.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-[#ead8c4] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1f1f]/30"
                      placeholder="Submit Result"
                    />
                  </div>
                )}
                {announcementError && (
                  <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {announcementError}
                  </div>
                )}
                <div className="md:col-span-2 flex flex-wrap gap-2 justify-end">
                  {announcementEdit && (
                    <button
                      type="button"
                      onClick={resetAnnouncementForm}
                      className="rounded-full border border-[#ead8c4] bg-white px-4 py-2 text-sm text-[#7a1f1f]"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={announcementSaving}
                    className="rounded-full bg-[#7a1f1f] px-5 py-2 text-sm text-white shadow-md disabled:opacity-70"
                  >
                    {announcementSaving
                      ? announcementEdit
                        ? "Updating..."
                        : "Saving..."
                      : announcementEdit
                        ? "Update Announcement"
                        : "Add Announcement"}
                  </button>
                </div>
              </form>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {announcementLoading && (
                  <div className="rounded-2xl border border-[#ead8c4] bg-white px-4 py-6 text-sm text-[#7a1f1f]/70">
                    Loading announcements...
                  </div>
                )}
                {!announcementLoading && announcementItems.length === 0 && !announcementError && (
                  <div className="rounded-2xl border border-[#ead8c4] bg-white px-4 py-6 text-sm text-[#7a1f1f]/70">
                    No announcements yet.
                  </div>
                )}
                {!announcementLoading &&
                  announcementItems.map((item) => {
                    const itemId = item._id || item.id;
                    const dateLabel = toDateInputValue(item.eventDate);
                    return (
                      <div
                        key={itemId}
                        className="quick-announcement-card rounded-2xl border border-[#ead8c4] bg-white p-4 shadow-sm"
                      >
                        <p className="quick-announcement-title">{item.title}</p>
                        <p className="quick-announcement-message mt-2 text-xs line-clamp-3">
                          {item.message}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="quick-announcement-pill rounded-full border border-[#ead8c4] bg-[#fff6e5] px-2 py-1 text-[#7a1f1f]">
                            {item.priority || "normal"}
                          </span>
                          <span className="quick-announcement-pill rounded-full border border-[#ead8c4] bg-[#fff6e5] px-2 py-1 text-[#7a1f1f]">
                            {item.isActive ? "Active" : "Inactive"}
                          </span>
                          {dateLabel && (
                            <span className="quick-announcement-pill rounded-full border border-[#ead8c4] bg-[#fff6e5] px-2 py-1 text-[#7a1f1f]">
                              {dateLabel}
                            </span>
                          )}
                          {item.showSubmitButton && (
                            <span className="quick-announcement-pill rounded-full border border-[#ead8c4] bg-[#fff6e5] px-2 py-1 text-[#7a1f1f]">
                              Button: {item.submitButtonLabel || "Submit Result"}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => startEditAnnouncement(item)}
                            className="quick-announcement-action inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:shadow-sm"
                          >
                            <FaEdit className="text-[10px]" />
                            Change
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(itemId)}
                            className="quick-announcement-action-danger inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:shadow-sm"
                          >
                            <FaTrash className="text-[10px]" />
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}
        </section>
      </div>

    </AdminShell>
  );
}

