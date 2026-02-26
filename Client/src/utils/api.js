const fallbackProdBase =
  typeof window !== "undefined" && /vercel\.app$/i.test(window.location.hostname)
    ? "https://dholakiya-snehmilan-connect-2.onrender.com"
    : "";

const rawBase = String(import.meta.env.VITE_API_URL || fallbackProdBase).trim();

export const API_BASE_URL = rawBase.replace(/\/+$/, "");

export const apiUrl = (path = "") => {
  const cleanPath = String(path || "").trim();
  if (!cleanPath) return API_BASE_URL;
  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
  if (!API_BASE_URL) return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return cleanPath.startsWith("/")
    ? `${API_BASE_URL}${cleanPath}`
    : `${API_BASE_URL}/${cleanPath}`;
};
