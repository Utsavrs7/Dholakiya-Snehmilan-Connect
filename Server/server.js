require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./src/config/db.js");
const { setIO } = require("./src/services/realtime");
const run = require("./scripts/seedSuperAdmin");

const PORT = process.env.PORT || 5000;
const rawOrigins = String(process.env.CORS_ORIGIN || "").trim();
const allowedOrigins = rawOrigins
  ? rawOrigins.split(",").map((x) => x.trim()).filter(Boolean)
  : [];
const isProd = process.env.NODE_ENV === "production";
const socketCorsOrigin = isProd ? allowedOrigins : true;

if (isProd && !allowedOrigins.length) {
  console.error("CORS_ORIGIN is required in production.");
  process.exit(1);
}

// Start server only after DB connects
connectDB()
  .then(async () => {
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: socketCorsOrigin,
        credentials: true,
      },
    });
    setIO(io);
    io.on("connection", (socket) => {
      socket.emit("connected", { ok: true });
    });
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    await run(); // Seed super admin on startup
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });
