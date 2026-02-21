/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { getAdminTokenFor, getAdminUserFor, getActiveAdminRole } from "../utils/adminAuth";

const AdminDataContext = createContext(null);

const getResultTimeMs = (item) => {
  const created = new Date(item?.createdAt || 0).getTime();
  if (!Number.isNaN(created) && created > 0) return created;
  const updated = new Date(item?.updatedAt || 0).getTime();
  if (!Number.isNaN(updated) && updated > 0) return updated;
  return 0;
};

export function AdminDataProvider({ children }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Normalize result data for UI
  const normalizeResult = (r) => {
    const createdAt = r.createdAt ? new Date(r.createdAt) : null;
    const today = new Date();
    const apiBase = import.meta.env.VITE_API_URL || "";
    const photo =
      r.photo && r.photo.startsWith("/uploads")
        ? `${apiBase}${r.photo}`
        : r.photo || "";
    const submittedAt =
      createdAt && createdAt.toDateString() === today.toDateString()
        ? "Today"
        : createdAt
        ? createdAt.toLocaleDateString()
        : "";
    return {
      ...r,
      photo,
      id: r._id || r.id,
      submittedAt,
    };
  };

  // Fetch admin results based on role
  const fetchResults = async () => {
    const role = getActiveAdminRole();
    const token = role ? getAdminTokenFor(role) : null;
    const user = role ? getAdminUserFor(role) : null;
    if (!token || !user?.role) {
      setResults([]);
      return;
    }
    if (user.role !== "super_admin" && user.role !== "village_admin") {
      setResults([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/results/admin`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load results");
      const normalized = data.map(normalizeResult);
      normalized.sort((a, b) => getResultTimeMs(b) - getResultTimeMs(a));
      setResults(normalized);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update a result via admin API and sync local state
  const updateResult = async (id, changes) => {
    const role = getActiveAdminRole();
    const token = role ? getAdminTokenFor(role) : null;
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/results/admin/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(changes),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Update failed");
    const normalized = normalizeResult(data);
    setResults((prev) =>
      prev.map((r) => (String(r.id) === String(id) ? normalized : r))
    );
    return normalized;
  };

  // Load results on mount and when auth changes
  useEffect(() => {
    fetchResults();
    const handler = () => fetchResults();
    window.addEventListener("admin_auth_changed", handler);
    return () => window.removeEventListener("admin_auth_changed", handler);
  }, []);

  const value = useMemo(
    () => ({ results, updateResult, loading, error, refresh: fetchResults }),
    [results, loading, error]
  );

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error("useAdminData must be used within AdminDataProvider");
  }
  return ctx;
}
