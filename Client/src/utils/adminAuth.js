// Admin auth helpers (separate from user auth)
const roleKey = (role, key) => `admin_${role}_${key}`;

// Track active admin role for current session
export const setActiveAdminRole = (role) => {
  sessionStorage.setItem("admin_active_role", role);
};

export const getActiveAdminRole = () =>
  sessionStorage.getItem("admin_active_role");

const isLikelyJwt = (value) => {
  const token = String(value || "").trim();
  if (!token) return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
};

export const getAdminTokenFor = (role) => {
  const storageKeys = [
    ["local", localStorage, roleKey(role, "token")],
    ["session", sessionStorage, roleKey(role, "token")],
  ];
  for (const [, storage, key] of storageKeys) {
    const token = storage.getItem(key);
    if (!token) continue;
    if (isLikelyJwt(token)) return token;
    storage.removeItem(key);
  }
  return null;
};

export const getAdminUserFor = (role) => {
  const raw =
    localStorage.getItem(roleKey(role, "user")) ||
    sessionStorage.getItem(roleKey(role, "user"));
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Ignore parse errors and fall back to token
  }
  // Fallback: decode minimal user info from token
  const token = getAdminTokenFor(role);
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json);
    return data
      ? { id: data.id, role: data.role, village: data.village, name: data.name, email: data.email }
      : null;
  } catch {
    return null;
  }
};

// Default getters use active role
export const getAdminToken = () => {
  const role = getActiveAdminRole();
  return role ? getAdminTokenFor(role) : null;
};

export const getAdminUser = () => {
  const role = getActiveAdminRole();
  return role ? getAdminUserFor(role) : null;
};

export const setAdminAuth = (token, user, remember = true) => {
  const storage = remember ? localStorage : sessionStorage;
  const role = user?.role || "admin";
  storage.setItem(roleKey(role, "token"), token);
  storage.setItem(roleKey(role, "user"), JSON.stringify(user));
  setActiveAdminRole(role);
  window.dispatchEvent(new Event("admin_auth_changed"));
};

export const clearAdminAuth = (role) => {
  const targetRole = role || getActiveAdminRole();
  if (targetRole) {
    localStorage.removeItem(roleKey(targetRole, "token"));
    localStorage.removeItem(roleKey(targetRole, "user"));
    sessionStorage.removeItem(roleKey(targetRole, "token"));
    sessionStorage.removeItem(roleKey(targetRole, "user"));
  }
  sessionStorage.removeItem("admin_active_role");
  window.dispatchEvent(new Event("admin_auth_changed"));
};
