const PREFIX = "api_cache_v1:";

export function getCachedData(key, ttlMs) {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { timestamp, data } = parsed;
    if (typeof timestamp !== "number") return null;
    if (Date.now() - timestamp > ttlMs) return null;
    return data;
  } catch {
    return null;
  }
}

export function setCachedData(key, data) {
  try {
    sessionStorage.setItem(
      `${PREFIX}${key}`,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Ignore cache write failures.
  }
}
