const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const ApprovalSetting = require("../models/ApprovalSetting");
const { sendForgotPasswordOtpEmail } = require("../services/mailService");
const { emitUpdate } = require("../services/realtime");
const SURNAME = "Dholakiya";
// Active window for admin status in milliseconds (2 minutes)
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = Number(process.env.OTP_RESEND_COOLDOWN_MS || 60 * 1000);
const OTP_MAX_VERIFY_ATTEMPTS = Number(process.env.OTP_MAX_VERIFY_ATTEMPTS || 5);
const OTP_LOCK_MS = Number(process.env.OTP_LOCK_MS || 30 * 60 * 1000);
const USER_ACCESS_TOKEN_EXPIRES_IN = "15m";
const ADMIN_ACCESS_TOKEN_EXPIRES_IN = "12h";
const REFRESH_COOKIE_NAME = "refresh_token";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
const IS_PROD = process.env.NODE_ENV === "production";
const REFRESH_COOKIE_SAMESITE = String(process.env.REFRESH_COOKIE_SAMESITE || "strict")
  .trim()
  .toLowerCase();
const REFRESH_COOKIE_DOMAIN = String(process.env.REFRESH_COOKIE_DOMAIN || "").trim();

const emitAdminSessionUpdate = (payload = {}) => {
  emitUpdate("admin-session", payload);
};

const normalizeMobile = (value) => String(value || "").replace(/\D/g, "");
// Accepts +91XXXXXXXXXX / +91 XXXXXXXXXX / XXXXXXXXXX and normalizes to 10-digit mobile.
const toCanonicalIndianMobile = (value) => {
  const digits = normalizeMobile(value);
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return "";
};
const hashOtp = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(String(token || "")).digest("hex");

const getRefreshTokenTtlMs = (role, rememberMe) => {
  if (role === "super_admin") return 3 * 24 * 60 * 60 * 1000;
  if (role === "village_admin") return 7 * 24 * 60 * 60 * 1000;
  return rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
};

const getRefreshCookieOptions = (maxAgeMs = 0) => ({
  httpOnly: true,
  secure: IS_PROD,
  sameSite: ["strict", "lax", "none"].includes(REFRESH_COOKIE_SAMESITE)
    ? REFRESH_COOKIE_SAMESITE
    : "strict",
  path: "/api/auth",
  ...(REFRESH_COOKIE_DOMAIN ? { domain: REFRESH_COOKIE_DOMAIN } : {}),
  maxAge: maxAgeMs,
});

const parseCookies = (req) => {
  const raw = String(req.headers.cookie || "");
  if (!raw) return {};
  return raw.split(";").reduce((acc, part) => {
    const [k, ...rest] = part.trim().split("=");
    if (!k) return acc;
    acc[k] = decodeURIComponent(rest.join("=") || "");
    return acc;
  }, {});
};

const signAccessToken = (user) => {
  const role = String(user?.role || "").toLowerCase();
  const expiresIn =
    role === "super_admin" || role === "village_admin"
      ? ADMIN_ACCESS_TOKEN_EXPIRES_IN
      : USER_ACCESS_TOKEN_EXPIRES_IN;
  return (
  jwt.sign(
    {
      id: String(user._id),
      role: user.role,
      village: user.village,
      name: user.name,
      email: user.email,
      firstName: user.firstName,
      tokenVersion: Number(user.tokenVersion || 0),
      accountStatus: user.accountStatus || "active",
    },
    process.env.JWT_SECRET,
    { expiresIn }
  )
  );
};

const signRefreshToken = ({ userId, role, rememberMe, tokenVersion }) => {
  const ttlMs = getRefreshTokenTtlMs(role, rememberMe);
  const expiresAt = new Date(Date.now() + ttlMs);
  const token = jwt.sign(
    {
      sub: String(userId),
      role,
      rememberMe: Boolean(rememberMe),
      tokenVersion: Number(tokenVersion || 0),
      type: "refresh",
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: Math.floor(ttlMs / 1000) }
  );
  return { token, ttlMs, expiresAt };
};

const persistRefreshToken = async ({ userId, role, rememberMe, refreshToken, expiresAt }) => {
  const tokenHash = hashRefreshToken(refreshToken);
  await RefreshToken.create({
    userId,
    tokenHash,
    role,
    rememberMe: Boolean(rememberMe),
    expiresAt,
  });
  return tokenHash;
};

const issueSessionTokens = async ({ user, rememberMe, res }) => {
  const accessToken = signAccessToken(user);
  const { token: refreshToken, ttlMs, expiresAt } = signRefreshToken({
    userId: user._id,
    role: user.role,
    rememberMe,
    tokenVersion: user.tokenVersion,
  });
  await persistRefreshToken({
    userId: user._id,
    role: user.role,
    rememberMe,
    refreshToken,
    expiresAt,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions(ttlMs));
  return { accessToken, refreshToken };
};

const getOrCreateApprovalSetting = async () => {
  let setting = await ApprovalSetting.findOne({ key: "default" });
  if (!setting) {
    setting = await ApprovalSetting.create({ key: "default", globalEnabled: true, villageOverrides: [] });
  }
  return setting;
};

const getEffectiveApprovalRequired = (setting, villageValue) => {
  if (!setting?.globalEnabled) return false;
  const village = String(villageValue || "").trim();
  if (!village) return Boolean(setting.globalEnabled);
  const override = (setting.villageOverrides || []).find(
    (item) => String(item.village || "").trim().toLowerCase() === village.toLowerCase()
  );
  return override ? Boolean(override.enabled) : Boolean(setting.globalEnabled);
};

// Utility: clears OTP fields once used/expired, so OTP can't be reused.
const clearForgotPasswordOtp = (user) => {
  user.forgotPasswordOtpHash = null;
  user.forgotPasswordOtpExpiresAt = null;
  user.forgotPasswordOtpChannel = null;
  user.forgotPasswordOtpTarget = null;
};

const clearForgotPasswordOtpSecurityState = (user) => {
  user.forgotPasswordOtpFailedAttempts = 0;
  user.forgotPasswordOtpLockedUntil = null;
};

// Utility: fetch user by selected channel (email or mobile) for forgot password.
const findUserByChannelAndIdentifier = async (channel, identifier) => {
  if (channel === "email") {
    return User.findOne({ email: String(identifier || "").trim().toLowerCase() });
  }

  const canonicalInputMobile = toCanonicalIndianMobile(identifier);
  if (!canonicalInputMobile) return null;

  // Fast path for canonical data (current app stores 10-digit mobile).
  const exactMatches = await User.find({ mobile: canonicalInputMobile }).limit(2);
  if (exactMatches.length > 1) return "AMBIGUOUS_MOBILE";
  if (exactMatches.length === 1) return exactMatches[0];

  // Fallback for legacy formatted numbers (+91/spaces) without scanning every request forever.
  const usersWithMobile = await User.find({ mobile: { $exists: true, $ne: "" } }).limit(5000);
  const matchedUsers = usersWithMobile.filter(
    (user) => toCanonicalIndianMobile(user.mobile) === canonicalInputMobile
  );

  // If multiple accounts share same mobile, block reset for safety.
  if (matchedUsers.length > 1) return "AMBIGUOUS_MOBILE";
  return matchedUsers[0] || null;
};

// Utility: fetch all users matching a normalized mobile.
const findUsersByNormalizedMobile = async (identifier) => {
  const canonicalInputMobile = toCanonicalIndianMobile(identifier);
  if (!canonicalInputMobile) return [];
  const exactMatches = await User.find({ mobile: canonicalInputMobile });
  if (exactMatches.length) return exactMatches;
  const usersWithMobile = await User.find({ mobile: { $exists: true, $ne: "" } }).limit(5000);
  return usersWithMobile.filter(
    (user) => toCanonicalIndianMobile(user.mobile) === canonicalInputMobile
  );
};

// User Signup (public)
const register = async (req, res, next) => {
  try {
    const { name, firstName, fatherName, email, password, mobile, village, gender } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedMobile = toCanonicalIndianMobile(mobile);
    const cleanedFirst = (firstName || "").replace(/\s+/g, " ").trim();
    const cleanedFather = (fatherName || "").replace(/\s+/g, " ").trim();
    const baseName = (name || `${cleanedFirst} ${cleanedFather}`).trim();

    // Check if name contains Gujarati characters
    const isGujarati = /[\u0A80-\u0AFF]/.test(baseName);

    let finalName;
    if (isGujarati) {
      // If Gujarati, assume the user provided the full correct name (which includes Surname)
      // or we just use what they gave. We don't prepend English "Dholakiya".
      finalName = baseName;
    } else {
      // For English, ensure Dholakiya prefix
      const sanitized = baseName.replace(new RegExp(`^${SURNAME}\\s*`, "i"), "").trim();
      finalName = [SURNAME, sanitized].filter(Boolean).join(" ").trim();
    }

    if (!cleanedFirst || !cleanedFather || !normalizedEmail || !password || !normalizedMobile) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existingByEmail = await User.findOne({ email: normalizedEmail });
    const existingByMobileList = await findUsersByNormalizedMobile(normalizedMobile);
    const existingByMobile = existingByMobileList[0] || null;

    if (existingByEmail && existingByMobile && String(existingByEmail._id) === String(existingByMobile._id)) {
      return res.status(409).json({ message: "User already registered with this email and mobile." });
    }
    if (existingByEmail) return res.status(409).json({ message: "Email already registered." });
    if (existingByMobile) return res.status(409).json({ message: "Mobile number already registered." });

    const setting = await getOrCreateApprovalSetting();
    const approvalRequired = getEffectiveApprovalRequired(setting, village);
    const accountStatus = approvalRequired ? "pending" : "active";
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: finalName,
      email: normalizedEmail,
      passwordHash,
      role: "user",
      // Store canonical 10-digit mobile to keep one format in DB.
      mobile: normalizedMobile,
      village: village || "",
      gender: gender || "Male",
      firstName: cleanedFirst,
      fatherName: cleanedFather,
      approvalRequired,
      accountStatus,
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      approvalRequired: user.approvalRequired,
      message:
        user.accountStatus === "pending"
          ? "Registration successful. Account is pending admin approval."
          : "Registration successful. Account is active.",
    });
  } catch (err) {
    next(err);
  }
};

// Create another Super Admin (only for existing super admin)
const createSuperAdmin = async (req, res, next) => {
  try {
    const { name, email, password, mobile, village } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const safeName = (name || "Dholakiya Super Admin").trim();
    const user = await User.create({
      name: safeName,
      email,
      passwordHash,
      role: "super_admin",
      mobile: mobile || "",
      village: village || "",
    });
    emitAdminSessionUpdate({
      action: "created",
      targetAdminIds: [String(user._id)],
      actorId: req.user?.id || null,
      message: "Super Admin added a new admin account.",
    });

    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
};

// Create admin (super_admin or village_admin) by existing super admin
const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, mobile, village, role } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Validate role
    const allowedRoles = ["super_admin", "village_admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Village is required for village_admin
    if (role === "village_admin" && !village) {
      return res.status(400).json({ message: "Village required for village admin" });
    }

    // Prevent duplicate email
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    // Hash password and create admin
    const passwordHash = await bcrypt.hash(password, 10);
    const safeName = (name || "Dholakiya Admin").trim();
    const user = await User.create({
      name: safeName,
      email,
      passwordHash,
      role,
      mobile: mobile || "",
      village: village || "",
    });
    emitAdminSessionUpdate({
      action: "created",
      targetAdminIds: [String(user._id)],
      actorId: req.user?.id || null,
      message: "Super Admin added a new admin account.",
    });

    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
};

// User Login (public)
const login = async (req, res, next) => {
  try {
    // Accept both old and new payloads for compatibility.
    const {
      loginWith = "mobile",
      identifier,
      email,
      mobile,
      password,
      remember = false,
      loginPortal,
    } = req.body;
    const normalizedLoginWith = String(loginWith || "").trim().toLowerCase();
    const normalizedIdentifier = String(identifier || "").trim();
    const normalizedEmail = String(email || "").trim();
    const normalizedMobile = String(mobile || "").trim();

    // Fallback support: infer channel when legacy payload only sends { email, password }.
    const resolvedLoginWith =
      normalizedLoginWith === "email" || normalizedLoginWith === "mobile"
        ? normalizedLoginWith
        : normalizedEmail
          ? "email"
          : normalizedMobile
            ? "mobile"
            : normalizedIdentifier.includes("@")
              ? "email"
              : "mobile";
    const resolvedIdentifier =
      normalizedIdentifier ||
      (resolvedLoginWith === "email" ? normalizedEmail : normalizedMobile);

    if (!resolvedIdentifier || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    let user = null;
    if (resolvedLoginWith === "email") {
      user = await User.findOne({ email: resolvedIdentifier.toLowerCase() });
    } else {
      user = await findUserByChannelAndIdentifier("mobile", resolvedIdentifier);
      if (user === "AMBIGUOUS_MOBILE") {
        return res.status(409).json({ message: "Multiple users found with this mobile. Please login with email." });
      }
    }

    if (!user) return res.status(404).json({ message: "Account not found. Please register first." });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid password" });

    const normalizedLoginPortal = String(loginPortal || "").trim().toLowerCase();
    if (normalizedLoginPortal === "user" && user.role !== "user") {
      return res.status(403).json({
        message: "This login page is for users only. Please use the admin login page.",
      });
    }
    if (
      normalizedLoginPortal === "admin" &&
      !["super_admin", "village_admin"].includes(String(user.role || ""))
    ) {
      return res.status(403).json({
        message: "This login page is for admins only. Please use the user login page.",
      });
    }

    // Update last login timestamp and backfill canonical mobile for older records.
    const canonicalMobile = toCanonicalIndianMobile(user.mobile);
    if (canonicalMobile && user.mobile !== canonicalMobile) {
      user.mobile = canonicalMobile;
    }
    user.lastLogin = new Date();
    await user.save();

    // Keep admin sessions multi-device capable.
    // Existing sessions stay valid unless explicitly revoked
    // (logout-all, password/admin update tokenVersion, admin delete).
    const rememberMe = user.role === "user" ? Boolean(remember) : false;
    const { accessToken } = await issueSessionTokens({ user, rememberMe, res });

    res.json({
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        village: user.village,
        gender: user.gender,
        mobile: user.mobile,
        firstName: user.firstName,
        fatherName: user.fatherName,
        accountStatus: user.accountStatus,
        approvalRequired: Boolean(user.approvalRequired),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Step-1: request OTP for forgot password (public)
const requestForgotPasswordOtp = async (req, res, next) => {
  try {
    const { channel = "email", identifier } = req.body;
    if (!channel || !identifier) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!["email", "mobile"].includes(channel)) {
      return res.status(400).json({ message: "Invalid channel. Use email or mobile." });
    }
    if (channel === "mobile") {
      return res.status(501).json({ message: "Mobile OTP is not configured yet. Please use email OTP." });
    }

    const user = await findUserByChannelAndIdentifier(channel, identifier);
    if (user === "AMBIGUOUS_MOBILE") {
      return res.status(409).json({
        message: "Multiple users found with this mobile. Please use email reset.",
      });
    }

    if (!user) {
      return res.status(404).json({ message: "No account found with provided details." });
    }

    const now = Date.now();
    const lockedUntil = user.forgotPasswordOtpLockedUntil
      ? new Date(user.forgotPasswordOtpLockedUntil).getTime()
      : 0;
    if (lockedUntil && lockedUntil > now) {
      const retryAfterSec = Math.ceil((lockedUntil - now) / 1000);
      return res.status(429).json({
        message: `Too many failed attempts. Try again in ${retryAfterSec} seconds.`,
      });
    }

    const lastSentAt = user.forgotPasswordOtpLastSentAt
      ? new Date(user.forgotPasswordOtpLastSentAt).getTime()
      : 0;
    if (lastSentAt && now - lastSentAt < OTP_RESEND_COOLDOWN_MS) {
      const retryAfterSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - lastSentAt)) / 1000);
      return res.status(429).json({
        message: `Please wait ${retryAfterSec} seconds before requesting another OTP.`,
      });
    }

    const otp = generateOtp();
    user.forgotPasswordOtpHash = hashOtp(otp);
    user.forgotPasswordOtpExpiresAt = new Date(now + OTP_EXPIRY_MS);
    user.forgotPasswordOtpChannel = channel;
    user.forgotPasswordOtpTarget = String(identifier).trim();
    user.forgotPasswordOtpLastSentAt = new Date(now);
    clearForgotPasswordOtpSecurityState(user);
    await user.save();

    // Real email OTP delivery via configured SMTP service.
    try {
      await sendForgotPasswordOtpEmail({
        toEmail: user.email,
        otp,
        userName: user.name || "User",
      });
    } catch (mailErr) {
      clearForgotPasswordOtp(user);
      await user.save();
      return res.status(500).json({
        message: `Unable to send OTP email. ${mailErr.message}`,
      });
    }

    return res.json({ message: "OTP sent successfully." });
  } catch (err) {
    next(err);
  }
};

// Step-2: verify OTP and reset password (public)
const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const { channel = "email", identifier, otp, newPassword } = req.body;
    if (!channel || !identifier || !otp || !newPassword) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!["email", "mobile"].includes(channel)) {
      return res.status(400).json({ message: "Invalid channel. Use email or mobile." });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await findUserByChannelAndIdentifier(channel, identifier);
    if (!user || user === "AMBIGUOUS_MOBILE") {
      return res.status(400).json({ message: "Invalid OTP or identifier" });
    }

    const now = Date.now();
    const lockedUntil = user.forgotPasswordOtpLockedUntil
      ? new Date(user.forgotPasswordOtpLockedUntil).getTime()
      : 0;
    if (lockedUntil && lockedUntil > now) {
      const retryAfterSec = Math.ceil((lockedUntil - now) / 1000);
      return res.status(429).json({
        message: `Too many failed attempts. Try again in ${retryAfterSec} seconds.`,
      });
    }

    const otpExpiry = user.forgotPasswordOtpExpiresAt
      ? new Date(user.forgotPasswordOtpExpiresAt).getTime()
      : 0;

    if (
      !user.forgotPasswordOtpHash ||
      !user.forgotPasswordOtpChannel ||
      user.forgotPasswordOtpChannel !== channel
    ) {
      return res.status(400).json({ message: "No valid OTP request found." });
    }

    if (!otpExpiry || otpExpiry < now) {
      clearForgotPasswordOtp(user);
      clearForgotPasswordOtpSecurityState(user);
      await user.save();
      return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
    }

    if (user.forgotPasswordOtpHash !== hashOtp(otp)) {
      user.forgotPasswordOtpFailedAttempts = (user.forgotPasswordOtpFailedAttempts || 0) + 1;
      if (user.forgotPasswordOtpFailedAttempts >= OTP_MAX_VERIFY_ATTEMPTS) {
        user.forgotPasswordOtpLockedUntil = new Date(now + OTP_LOCK_MS);
        clearForgotPasswordOtp(user);
        await user.save();
        return res.status(429).json({
          message: "Too many invalid OTP attempts. Reset is locked for 30 minutes.",
        });
      }
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    clearForgotPasswordOtp(user);
    clearForgotPasswordOtpSecurityState(user);
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
};

// List admins with active status (super admin only)
const getAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({
      role: { $in: ["super_admin", "village_admin"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const now = Date.now();
    const data = admins.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      village: u.village,
      lastLogin: u.lastLogin,
      active: u.lastLogin ? now - new Date(u.lastLogin).getTime() <= ACTIVE_WINDOW_MS : false,
    }));

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Update admin presence (heartbeat)
const heartbeatAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Clear admin presence on logout
const logoutAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await User.findByIdAndUpdate(userId, { lastLogin: null });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

const refreshSession = async (req, res, next) => {
  try {
    const cookies = parseCookies(req);
    const incomingRefreshToken = cookies[REFRESH_COOKIE_NAME];
    if (!incomingRefreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    let decoded;
    try {
      decoded = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    if (decoded?.type !== "refresh" || !decoded?.sub) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const tokenHash = hashRefreshToken(incomingRefreshToken);
    const now = new Date();
    const existing = await RefreshToken.findOneAndUpdate({
      tokenHash,
      userId: decoded.sub,
      revokedAt: null,
      expiresAt: { $gt: now },
    }, {
      $set: { revokedAt: now },
    }, { new: true });
    if (!existing) {
      return res.status(401).json({ message: "Refresh token expired or revoked" });
    }

    const user = await User.findById(decoded.sub).select(
      "_id role village name email firstName tokenVersion accountStatus"
    );
    if (!user) {
      await RefreshToken.deleteMany({ userId: decoded.sub });
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions(0));
      return res.status(401).json({ message: "Account not found" });
    }

    if (Number(decoded.tokenVersion ?? -1) !== Number(user.tokenVersion ?? 0)) {
      await RefreshToken.deleteMany({ userId: user._id });
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions(0));
      return res.status(401).json({ message: "Session invalidated. Please login again." });
    }

    const rememberMe = Boolean(existing.rememberMe);
    const { accessToken, refreshToken } = await issueSessionTokens({ user, rememberMe, res });
    const replacementHash = hashRefreshToken(refreshToken);
    await RefreshToken.updateOne(
      { _id: existing._id },
      { $set: { replacedByTokenHash: replacementHash } }
    );

    return res.json({ token: accessToken });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const cookies = parseCookies(req);
    const incomingRefreshToken = cookies[REFRESH_COOKIE_NAME];
    if (incomingRefreshToken) {
      const tokenHash = hashRefreshToken(incomingRefreshToken);
      await RefreshToken.updateOne(
        { tokenHash, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions(0));
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

const logoutAllDevices = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    await RefreshToken.deleteMany({ userId });
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions(0));
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

const getSessionState = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const now = new Date();
    const activeSessions = await RefreshToken.countDocuments({
      userId,
      revokedAt: null,
      expiresAt: { $gt: now },
    });

    return res.json({
      activeSessions,
      hasOtherActiveSessions: activeSessions > 1,
    });
  } catch (err) {
    next(err);
  }
};

// Get active admin count only
const getActiveAdminCount = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - ACTIVE_WINDOW_MS);
    const count = await User.countDocuments({
      role: { $in: ["super_admin", "village_admin"] },
      lastLogin: { $gte: since },
    });
    res.json({ activeCount: count });
  } catch (err) {
    next(err);
  }
};

// Update admin by id (super admin only)
const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, mobile, village, role } = req.body;

    // Prevent self update for role deletion and critical changes if needed
    if (String(id) === String(req.user?.id) && role && role !== "super_admin") {
      return res.status(400).json({ message: "Cannot change your own role" });
    }

    if (role && !["super_admin", "village_admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (role === "village_admin" && !village) {
      return res.status(400).json({ message: "Village required for village admin" });
    }

    const admin = await User.findById(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (name !== undefined) admin.name = name;
    if (email !== undefined) admin.email = email;
    if (mobile !== undefined) admin.mobile = mobile;
    if (village !== undefined) admin.village = village;
    if (role !== undefined) admin.role = role;
    if (password) {
      admin.passwordHash = await bcrypt.hash(password, 10);
    }
    admin.tokenVersion = Number(admin.tokenVersion || 0) + 1;

    const updated = await admin.save();
    if (!updated) return res.status(404).json({ message: "Admin not found" });

    emitAdminSessionUpdate({
      action: "updated",
      targetAdminIds: [String(updated._id)],
      actorId: req.user?.id || null,
      message: "Your admin access was changed by Super Admin. Please login again.",
    });

    res.json({
      id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      village: updated.village,
      mobile: updated.mobile,
    });
  } catch (err) {
    next(err);
  }
};

// Delete admin by id (super admin only)
const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (String(id) === String(req.user?.id)) {
      return res.status(400).json({ message: "You cannot delete yourself" });
    }

    const admin = await User.findById(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (admin.role === "super_admin") {
      const superCount = await User.countDocuments({ role: "super_admin" });
      if (superCount <= 1) {
        return res.status(400).json({ message: "At least one super admin required" });
      }
    }

    await User.findByIdAndDelete(id);
    await RefreshToken.deleteMany({ userId: id });
    emitAdminSessionUpdate({
      action: "deleted",
      targetAdminIds: [String(id)],
      actorId: req.user?.id || null,
      message: "Your admin account was removed by Super Admin.",
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Bulk delete admins (super admin only)
const bulkDeleteAdmins = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No ids provided" });
    }

    // Filter out self id
    const safeIds = ids.filter((x) => String(x) !== String(req.user?.id));

    // Prevent deleting last super admin
    const superAdminsToDelete = await User.countDocuments({
      _id: { $in: safeIds },
      role: "super_admin",
    });
    if (superAdminsToDelete > 0) {
      const superCount = await User.countDocuments({ role: "super_admin" });
      if (superCount - superAdminsToDelete <= 0) {
        return res.status(400).json({ message: "At least one super admin required" });
      }
    }

    await User.deleteMany({ _id: { $in: safeIds } });
    await RefreshToken.deleteMany({ userId: { $in: safeIds } });
    emitAdminSessionUpdate({
      action: "bulk_deleted",
      targetAdminIds: safeIds.map((x) => String(x)),
      actorId: req.user?.id || null,
      message: "Your admin account was removed by Super Admin.",
    });
    res.json({ ok: true, deleted: safeIds.length });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.id).select(
      "_id name email role village gender mobile firstName fatherName accountStatus approvalRequired"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      village: user.village,
      gender: user.gender,
      mobile: user.mobile,
      firstName: user.firstName,
      fatherName: user.fatherName,
      accountStatus: user.accountStatus || "active",
      approvalRequired: Boolean(user.approvalRequired),
    });
  } catch (err) {
    next(err);
  }
};

const listPendingUsers = async (req, res, next) => {
  try {
    const isSuper = req.user?.role === "super_admin";
    const filter = { role: "user", accountStatus: "pending" };
    if (!isSuper) {
      if (!req.user?.village) return res.status(403).json({ message: "Village not assigned" });
      filter.village = req.user.village;
    }
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .select("_id name firstName fatherName email mobile village gender createdAt accountStatus");
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const approveUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "user") return res.status(404).json({ message: "User not found" });
    if (req.user?.role === "village_admin" && String(req.user?.village || "") !== String(user.village || "")) {
      return res.status(403).json({ message: "Forbidden" });
    }
    user.accountStatus = "active";
    user.approvalRequired = true;
    user.approvedAt = new Date();
    user.approvedBy = req.user?.id || null;
    user.rejectedAt = null;
    user.rejectedBy = null;
    await user.save();
    res.json({ ok: true, id: user._id, accountStatus: user.accountStatus });
  } catch (err) {
    next(err);
  }
};

const bulkApproveUsers = async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (ids.length === 0) {
      return res.status(400).json({ message: "No user ids provided" });
    }

    const filter = {
      _id: { $in: ids },
      role: "user",
      accountStatus: "pending",
    };
    if (req.user?.role === "village_admin") {
      if (!req.user?.village) return res.status(403).json({ message: "Village not assigned" });
      filter.village = req.user.village;
    }

    const update = {
      accountStatus: "active",
      approvalRequired: true,
      approvedAt: new Date(),
      approvedBy: req.user?.id || null,
      rejectedAt: null,
      rejectedBy: null,
    };
    const result = await User.updateMany(filter, { $set: update });
    return res.json({
      ok: true,
      requested: ids.length,
      approved: Number(result.modifiedCount || 0),
    });
  } catch (err) {
    next(err);
  }
};

const rejectUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "user") return res.status(404).json({ message: "User not found" });
    if (req.user?.role === "village_admin" && String(req.user?.village || "") !== String(user.village || "")) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const deletedId = user._id;
    await User.findByIdAndDelete(deletedId);
    await RefreshToken.deleteMany({ userId: deletedId });
    res.json({
      ok: true,
      id: deletedId,
      deleted: true,
      message: "Account request rejected and user account deleted.",
    });
  } catch (err) {
    next(err);
  }
};

const getApprovalSettings = async (req, res, next) => {
  try {
    const setting = await getOrCreateApprovalSetting();
    res.json({
      globalEnabled: Boolean(setting.globalEnabled),
      villageOverrides: (setting.villageOverrides || []).map((item) => ({
        village: item.village,
        enabled: Boolean(item.enabled),
      })),
    });
  } catch (err) {
    next(err);
  }
};

const updateGlobalApprovalSetting = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") return res.status(400).json({ message: "enabled must be boolean" });
    const setting = await getOrCreateApprovalSetting();
    setting.globalEnabled = enabled;
    await setting.save();
    res.json({ ok: true, globalEnabled: Boolean(setting.globalEnabled) });
  } catch (err) {
    next(err);
  }
};

const updateVillageApprovalSetting = async (req, res, next) => {
  try {
    const { village, enabled } = req.body;
    const normalizedVillage = String(village || "").trim();
    if (!normalizedVillage) return res.status(400).json({ message: "village is required" });
    if (typeof enabled !== "boolean") return res.status(400).json({ message: "enabled must be boolean" });
    const setting = await getOrCreateApprovalSetting();
    const index = (setting.villageOverrides || []).findIndex(
      (item) => String(item.village || "").trim().toLowerCase() === normalizedVillage.toLowerCase()
    );
    if (index >= 0) {
      setting.villageOverrides[index].enabled = enabled;
      setting.villageOverrides[index].village = normalizedVillage;
    } else {
      setting.villageOverrides.push({ village: normalizedVillage, enabled });
    }
    await setting.save();
    res.json({
      ok: true,
      villageOverrides: (setting.villageOverrides || []).map((item) => ({
        village: item.village,
        enabled: Boolean(item.enabled),
      })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
