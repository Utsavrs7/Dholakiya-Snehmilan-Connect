const buckets = new Map();

// Lightweight in-memory rate limiter (per process).
// Good for single-instance deployment; use Redis-backed limiter for multi-instance scale.
const createRateLimiter = ({ windowMs, max, keyPrefix = "global", message }) => {
  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
    const key = `${keyPrefix}:${ip}`;
    const record = buckets.get(key);

    if (!record || now > record.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        message: message || `Too many requests. Please try again in ${retryAfterSec} seconds.`,
      });
    }

    return next();
  };
};

module.exports = {
  createRateLimiter,
};
