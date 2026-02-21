import { getToken, getUser } from "./auth";
import { getActiveAdminRole, getAdminTokenFor, getAdminUserFor } from "./adminAuth";

export const LOGIN_ROUTES = {
  user: "/login",
  admin: "/admin/login",
};

export const normalizeRole = (role) => {
  const value = String(role || "").trim().toLowerCase();
  if (!value) return "";
  if (value === "superadmin") return "super_admin";
  if (value === "villageadmin") return "village_admin";
  return value;
};

export const isAdminRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === "super_admin" || normalized === "village_admin";
};

export const getLoginRouteForRole = (role) =>
  isAdminRole(role) ? LOGIN_ROUTES.admin : LOGIN_ROUTES.user;

export const getLoginRouteForAllowedRoles = (allowedRoles = []) => {
  const normalized = allowedRoles.map((role) => normalizeRole(role));
  return normalized.some((role) => isAdminRole(role))
    ? LOGIN_ROUTES.admin
    : LOGIN_ROUTES.user;
};

export const decodeTokenPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const isTokenValid = (token) => {
  const payload = decodeTokenPayload(token);
  if (!payload) return false;
  if (!payload.exp) return true;
  return Date.now() < payload.exp * 1000;
};

export const getUserSession = () => {
  const token = getToken();
  const user = getUser();
  const role = normalizeRole(user?.role);
  if (!token || !user || role !== "user" || !isTokenValid(token)) return null;
  return { role, token, user, source: "user" };
};

export const getAdminSession = (preferredRoles = []) => {
  const preferred = Array.isArray(preferredRoles)
    ? preferredRoles
        .map((role) => normalizeRole(role))
        .filter((role) => role === "super_admin" || role === "village_admin")
    : [];
  const activeRole = normalizeRole(getActiveAdminRole());
  const orderedRoles = [
    ...preferred,
    ...(activeRole ? [activeRole] : []),
    "super_admin",
    "village_admin",
  ].filter((role, index, arr) => arr.indexOf(role) === index);

  for (const role of orderedRoles) {
    const token = getAdminTokenFor(role);
    const user = getAdminUserFor(role);
    if (!token || !user?.role) continue;
    if (!isTokenValid(token)) continue;
    if (normalizeRole(user.role) !== role) continue;
    return { role, token, user, source: "admin" };
  }
  return null;
};
