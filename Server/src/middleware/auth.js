const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes: requires valid JWT
const authRequired = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      "_id role village name email tokenVersion accountStatus"
    );
    if (!user) {
      const isAdminToken = ["super_admin", "village_admin"].includes(decoded.role);
      return res.status(401).json({
        message: isAdminToken
          ? "Your admin account was removed by Super Admin. Please login again."
          : "Account not found. Please login again.",
        code: isAdminToken ? "ADMIN_REMOVED" : "ACCOUNT_NOT_FOUND",
      });
    }
    const isAdminRole = ["super_admin", "village_admin"].includes(user.role);
    if (isAdminRole && Number(decoded.tokenVersion ?? -1) !== Number(user.tokenVersion ?? 0)) {
      return res.status(401).json({
        message: "Your admin access was changed by Super Admin. Please login again.",
        code: "ADMIN_SESSION_INVALIDATED",
      });
    }
    req.user = {
      id: String(user._id),
      role: user.role,
      village: user.village,
      name: user.name,
      email: user.email,
      tokenVersion: user.tokenVersion,
      accountStatus: user.accountStatus || "active",
    };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const normalizeRoleName = (role) => {
  const value = String(role || "").trim();
  if (!value) return "";
  const lower = value.toLowerCase();
  if (lower === "admin") return "admin";
  if (lower === "superadmin" || lower === "super_admin") return "super_admin";
  if (lower === "villageadmin" || lower === "village_admin") return "village_admin";
  if (lower === "user") return "user";
  return lower;
};

// Role guard: restricts access to specific roles
const roleRequired = (...allowedRoles) => {
  // Supports both roleRequired("a", "b") and roleRequired(["a", "b"]).
  const flatAllowed = allowedRoles.flat(Infinity);
  const normalizedAllowed = flatAllowed.flatMap((role) => {
    const normalized = normalizeRoleName(role);
    if (!normalized) return [];
    if (normalized === "admin") return ["village_admin", "super_admin"];
    return [normalized];
  });
  // Return middleware that checks user role
  return (req, res, next) => {
    const currentRole = normalizeRoleName(req.user?.role);
    // Block request if role is missing or not allowed
    if (!currentRole || !normalizedAllowed.includes(currentRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    // Role allowed, continue
    next();
  };
};

const requireAuth = authRequired;
const requireRole = roleRequired;

module.exports = { authRequired, roleRequired, requireAuth, requireRole };
