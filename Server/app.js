const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const authRoutes = require("./src/routes/auth");
const resultRoutes = require("./src/routes/results");
const galleryRoutes = require("./src/routes/gallery");
const announcementRoutes = require("./src/routes/announcements");
const heroRoutes = require("./src/routes/hero");
const proxyRoutes = require("./src/routes/proxy");
const exportRoutes = require("./routes/export");


const app = express();
const rawOrigins = String(process.env.CORS_ORIGIN || "").trim();
const envOrigins = rawOrigins
  ? rawOrigins.split(",").map((x) => x.trim().replace(/\/+$/, "")).filter(Boolean)
  : [];
const defaultProdOrigins = [
  "https://dholakiyaparivar.vercel.app",
  "https://www.dholakiyaparivar.vercel.app",
];
const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultProdOrigins]));
const isProd = process.env.NODE_ENV === "production";
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  return allowedOrigins.includes(String(origin).replace(/\/+$/, ""));
};

// Core middleware
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin) return callback(null, true);
//       if (!isProd) return callback(null, true);
//       if (!allowedOrigins.length) {
//         return callback(new Error("CORS is not configured for production."));
//       }
//       if (isAllowedOrigin(origin)) return callback(null, true);
//       return callback(new Error("Origin not allowed by CORS."));
//     },
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!isProd) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true,
  })
);  
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Basic security headers without extra dependency.
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/", (req, res) => {
  res.send("Snehmilan Connect Server Running");
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/hero", heroRoutes);
app.use("/api/proxy", proxyRoutes);
app.use("/api/export", exportRoutes);


// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = Number(err?.status || err?.statusCode || 500);
  const message = status >= 500 ? "Server error" : err.message || "Request failed";
  const payload = { message };
  if (process.env.NODE_ENV !== "production") {
    payload.error = err.message;
  }
  res.status(status).json(payload);
});

module.exports = app;
