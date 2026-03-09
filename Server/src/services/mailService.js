let transporter = null;

const getRequiredEnv = (name) => String(process.env[name] || "").trim();
const getNumberEnv = (name, fallback) => {
  const raw = String(process.env[name] || "").trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const getBoolEnv = (name, fallback = false) => {
  const raw = String(process.env[name] || "").trim().toLowerCase();
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw);
};

const validateMailEnv = () => {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"];
  const missing = required.filter((key) => !getRequiredEnv(key));
  if (missing.length > 0) {
    throw new Error(`SMTP is not configured. Missing: ${missing.join(", ")}`);
  }
};

const isResendConfigured = () =>
  Boolean(getRequiredEnv("RESEND_API_KEY")) && Boolean(getRequiredEnv("SMTP_FROM"));

const getTransporter = () => {
  if (transporter) return transporter;

  let nodemailer;
  try {
    // Keep dynamic require so server can boot even if package is not installed yet.
    nodemailer = require("nodemailer");
  } catch (err) {
    throw new Error("Nodemailer is not installed. Run `npm install` inside Server folder.");
  }

  validateMailEnv();
  transporter = nodemailer.createTransport({
    host: getRequiredEnv("SMTP_HOST"),
    port: Number(getRequiredEnv("SMTP_PORT")),
    secure: getBoolEnv("SMTP_SECURE", false),
    // Prefer IPv4 by default. Some hosts fail on IPv6 with ENETUNREACH.
    family: getNumberEnv("SMTP_IP_FAMILY", 4),
    pool: getBoolEnv("SMTP_POOL", true),
    maxConnections: getNumberEnv("SMTP_MAX_CONNECTIONS", 5),
    maxMessages: getNumberEnv("SMTP_MAX_MESSAGES", 100),
    connectionTimeout: getNumberEnv("SMTP_CONNECTION_TIMEOUT_MS", 10000),
    greetingTimeout: getNumberEnv("SMTP_GREETING_TIMEOUT_MS", 10000),
    socketTimeout: getNumberEnv("SMTP_SOCKET_TIMEOUT_MS", 15000),
    auth: {
      user: getRequiredEnv("SMTP_USER"),
      pass: getRequiredEnv("SMTP_PASS"),
    },
  });

  return transporter;
};

const sendViaResend = async ({ toEmail, subject, text, html }) => {
  const apiKey = getRequiredEnv("RESEND_API_KEY");
  const from = getRequiredEnv("SMTP_FROM");
  if (!apiKey) throw new Error("RESEND_API_KEY is missing");
  if (!from) throw new Error("SMTP_FROM is missing");

  const timeoutMs = getNumberEnv("MAIL_HTTP_TIMEOUT_MS", 15000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [toEmail],
        subject,
        text,
        html,
      }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || `Resend API failed (${res.status})`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
};

const sendForgotPasswordOtpEmail = async ({ toEmail, otp, userName = "User" }) => {
  const clientName = getRequiredEnv("APP_NAME") || "Snehmilan Connect";
  const from = getRequiredEnv("SMTP_FROM");
  const startedAt = Date.now();

  const subject = `${clientName} Password Reset OTP`;
  const text = `Hello ${userName}, your OTP for password reset is ${otp}. It will expire in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
      <h2 style="margin-bottom: 8px;">${clientName}</h2>
      <p style="margin: 0 0 16px;">Hi ${userName},</p>
      <p style="margin: 0 0 10px;">Use this OTP to reset your password:</p>
      <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; margin: 10px 0 14px;">${otp}</div>
      <p style="margin: 0 0 12px;">This OTP expires in <b>10 minutes</b>.</p>
      <p style="margin: 0; color: #a00;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  let info;
  if (isResendConfigured()) {
    info = await sendViaResend({ toEmail, subject, text, html });
  } else {
    const mailer = getTransporter();
    info = await mailer.sendMail({
      from,
      to: toEmail,
      subject,
      text,
      html,
    });
  }

  // Timing log helps identify slow SMTP or provider latency in production diagnostics.
  console.log(
    `[Mail] OTP email sent to=${toEmail} provider=${isResendConfigured() ? "resend" : "smtp"} messageId=${info?.messageId || info?.id || "n/a"} in ${Date.now() - startedAt}ms`
  );
};

module.exports = {
  sendForgotPasswordOtpEmail,
};
