const router = require("express").Router();
const {
  register,
  login,
  requestForgotPasswordOtp,
  resetPasswordWithOtp,
  refreshSession,
  logout,
  logoutAllDevices,
  getSessionState,
  createSuperAdmin,
  createAdmin,
  getAdmins,
  getActiveAdminCount,
  heartbeatAdmin,
  logoutAdmin,
  updateAdmin,
  deleteAdmin,
  bulkDeleteAdmins,
  getMe,
  listPendingUsers,
  approveUser,
  bulkApproveUsers,
  rejectUser,
  getApprovalSettings,
  updateGlobalApprovalSetting,
  updateVillageApprovalSetting,
} = require("../controllers/authController");
const { authRequired, roleRequired } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/rateLimit");

const registerLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: "register",
  message: "Too many registration attempts. Please try again later.",
});
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  keyPrefix: "login",
  message: "Too many login attempts. Please try again later.",
});
const forgotRequestLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  keyPrefix: "forgot_request",
  message: "Too many OTP requests. Please try again later.",
});
const forgotResetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: "forgot_reset",
  message: "Too many OTP verification attempts. Please try again later.",
});

// Auth routes
router.post("/register", registerLimiter, register); // Signup
router.post("/login", loginLimiter, login);       // Login
router.post("/refresh", refreshSession);
router.post("/logout", logout);
router.post("/logout-all-devices", authRequired, logoutAllDevices);
router.get("/session-state", authRequired, getSessionState);
// Forgot password with OTP verification in 2 steps
router.post("/forgot-password/request-otp", forgotRequestLimiter, requestForgotPasswordOtp);
router.post("/forgot-password/reset", forgotResetLimiter, resetPasswordWithOtp);
router.get("/me", authRequired, getMe);
// Super admin can create more super admins
router.post("/super-admins", authRequired, roleRequired("super_admin"), createSuperAdmin);
// Super admin can create super_admin or village_admin
router.post("/admins", authRequired, roleRequired("super_admin"), createAdmin);
// Super admin can list all admins
router.get("/admins", authRequired, roleRequired("super_admin"), getAdmins);
// Active admin count only (super admin)
router.get("/admins/active-count", authRequired, roleRequired("super_admin"), getActiveAdminCount);
// Admin heartbeat (super_admin and village_admin)
router.post("/admins/heartbeat", authRequired, roleRequired("super_admin", "village_admin"), heartbeatAdmin);
// Admin logout presence update
router.post("/admins/logout", authRequired, roleRequired("super_admin", "village_admin"), logoutAdmin);
// Update admin
router.patch("/admins/:id", authRequired, roleRequired("super_admin"), updateAdmin);
// Delete admin
router.delete("/admins/:id", authRequired, roleRequired("super_admin"), deleteAdmin);
// Bulk delete admins
router.post("/admins/bulk-delete", authRequired, roleRequired("super_admin"), bulkDeleteAdmins);
// Account approval queue for super/village admins
router.get("/users/pending", authRequired, roleRequired("super_admin", "village_admin"), listPendingUsers);
router.patch("/users/:id/approve", authRequired, roleRequired("super_admin", "village_admin"), approveUser);
router.post("/users/bulk-approve", authRequired, roleRequired("super_admin", "village_admin"), bulkApproveUsers);
router.patch("/users/:id/reject", authRequired, roleRequired("super_admin", "village_admin"), rejectUser);
// Account approval settings (super admin)
router.get("/approval-settings", authRequired, roleRequired("super_admin"), getApprovalSettings);
router.patch(
  "/approval-settings/global",
  authRequired,
  roleRequired("super_admin"),
  updateGlobalApprovalSetting
);
router.patch(
  "/approval-settings/village",
  authRequired,
  roleRequired("super_admin"),
  updateVillageApprovalSetting
);

module.exports = router;
