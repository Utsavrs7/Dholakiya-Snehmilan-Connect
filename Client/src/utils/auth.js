export const getToken = () =>
  localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");

// Decode minimal user info from JWT if stored user is missing
const decodeUserFromToken = (token) => {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json);
    return data
      ? {
          id: data.id,
          role: data.role,
          village: data.village,
          name: data.name,
          email: data.email,
          accountStatus: data.accountStatus || "active",
        }
      : null;
  } catch {
    return null;
  }
};

export const getUser = () => {
  const raw =
    localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
  try {
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore parse errors and fall back to token
  }
  const token = getToken();
  return token ? decodeUserFromToken(token) : null;
};

export const setAuth = (token, user, remember = true) => {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("auth_token", token);
  storage.setItem("auth_user", JSON.stringify(user));
  window.dispatchEvent(new Event("auth_changed"));
};

export const clearAuth = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("auth_user");
  window.dispatchEvent(new Event("auth_changed"));
};
