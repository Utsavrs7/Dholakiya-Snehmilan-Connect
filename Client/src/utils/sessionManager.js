import { clearAuth } from "./auth";
import { clearAdminAuth, getActiveAdminRole } from "./adminAuth";

let initialized = false;
let refreshPromise = null;
const API_ACTIVITY_EVENT = "app_api_activity";

const emitApiActivity = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(API_ACTIVITY_EVENT));
};

const isApiAuthRefreshUrl = (url, apiBase) =>
  url === `${apiBase}/api/auth/refresh` || url.endsWith("/api/auth/refresh");

const getBearerTokenFromHeaders = (headersLike) => {
  const headers = new Headers(headersLike || {});
  const auth = headers.get("Authorization") || headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim();
};

const getBearerTokenFromFetchArgs = (input, init) => {
  const fromInit = getBearerTokenFromHeaders(init?.headers);
  if (fromInit) return fromInit;
  if (input && typeof input === "object" && "headers" in input) {
    return getBearerTokenFromHeaders(input.headers);
  }
  return null;
};

const parseJwtPayload = (token) => {
  try {
    const payload = String(token || "").split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const getTokenRole = (token) => String(parseJwtPayload(token)?.role || "").toLowerCase();

const replaceStoredToken = (oldToken, nextToken) => {
  if (!oldToken || !nextToken) return false;
  const keys = ["auth_token", "admin_super_admin_token", "admin_village_admin_token"];
  let replaced = false;
  keys.forEach((key) => {
    if (localStorage.getItem(key) === oldToken) {
      localStorage.setItem(key, nextToken);
      replaced = true;
    }
    if (sessionStorage.getItem(key) === oldToken) {
      sessionStorage.setItem(key, nextToken);
      replaced = true;
    }
  });
  if (replaced) {
    window.dispatchEvent(new Event("auth_changed"));
    window.dispatchEvent(new Event("admin_auth_changed"));
  }
  return replaced;
};

const refreshAccessToken = async (apiBase) => {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const res = await fetch(`${apiBase}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("refresh_failed");
    const data = await res.json();
    if (!data?.token) throw new Error("refresh_failed");
    return data.token;
  })()
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
};

export const installSessionManager = (apiBase) => {
  if (initialized || !apiBase || typeof window === "undefined") return;
  initialized = true;
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = undefined) => {
    const url = typeof input === "string" ? input : input?.url || "";
    const response = await nativeFetch(input, init);
    if (response.status !== 401 || isApiAuthRefreshUrl(url, apiBase)) {
      emitApiActivity();
      return response;
    }

    const originalToken = getBearerTokenFromFetchArgs(input, init);
    if (!originalToken) {
      emitApiActivity();
      return response;
    }

    try {
      const nextAccessToken = await refreshAccessToken(apiBase);
      const originalRole = getTokenRole(originalToken);
      const refreshedRole = getTokenRole(nextAccessToken);
      const isAdminRole = originalRole === "super_admin" || originalRole === "village_admin";
      if (isAdminRole && refreshedRole !== originalRole) {
        clearAdminAuth(originalRole);
        try {
          sessionStorage.setItem(
            "admin_forced_logout_message",
            "Your session expired. Please login again."
          );
        } catch {
          // Ignore storage errors.
        }
        emitApiActivity();
        return response;
      }
      replaceStoredToken(originalToken, nextAccessToken);
      const headers = new Headers(
        init?.headers ||
          (input && typeof input === "object" && "headers" in input ? input.headers : undefined) ||
          {}
      );
      headers.set("Authorization", `Bearer ${nextAccessToken}`);
      const requestInit = {
        method: init?.method || (input && typeof input === "object" ? input.method : undefined),
        headers,
        body: init?.body,
        credentials:
          init?.credentials ||
          (input && typeof input === "object" ? input.credentials : undefined),
        mode: init?.mode || (input && typeof input === "object" ? input.mode : undefined),
        cache: init?.cache || (input && typeof input === "object" ? input.cache : undefined),
        redirect:
          init?.redirect || (input && typeof input === "object" ? input.redirect : undefined),
        referrer:
          init?.referrer || (input && typeof input === "object" ? input.referrer : undefined),
        referrerPolicy:
          init?.referrerPolicy ||
          (input && typeof input === "object" ? input.referrerPolicy : undefined),
        integrity:
          init?.integrity || (input && typeof input === "object" ? input.integrity : undefined),
        keepalive:
          init?.keepalive || (input && typeof input === "object" ? input.keepalive : undefined),
        signal: init?.signal || (input && typeof input === "object" ? input.signal : undefined),
      };
      const retried = await nativeFetch(url, requestInit);
      emitApiActivity();
      return retried;
    } catch {
      const activeAdminRole = getActiveAdminRole();
      if (activeAdminRole) {
        clearAdminAuth(activeAdminRole);
      } else {
        clearAuth();
      }
      emitApiActivity();
      return response;
    }
  };
};
