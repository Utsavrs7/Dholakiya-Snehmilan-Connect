const STATUS_META = {
  pending: {
    key: "pending",
    label: "Pending",
    badgeClass: "result-status-pending bg-amber-50 text-amber-700 border-amber-200",
  },
  reviewed: {
    key: "reviewed",
    label: "Reviewed",
    badgeClass: "result-status-reviewed bg-blue-50 text-blue-700 border-blue-200",
  },
  accepted: {
    key: "accepted",
    label: "Accepted",
    badgeClass: "result-status-accepted bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    key: "rejected",
    label: "Rejected",
    badgeClass: "result-status-rejected bg-rose-50 text-rose-700 border-rose-200",
  },
  edited: {
    key: "edited",
    label: "Edited",
    badgeClass: "result-status-edited bg-violet-50 text-violet-700 border-violet-200",
  },
};

export const getResultStatusMeta = (status) => {
  const key = String(status || "pending").toLowerCase();
  return STATUS_META[key] || STATUS_META.pending;
};

export const getSubmittedByLabel = (role) => {
  const key = String(role || "user").toLowerCase();
  if (key === "super_admin") return "Super Admin";
  if (key === "village_admin") return "Village Admin";
  return "User";
};
