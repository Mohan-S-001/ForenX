require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const connectDB = require("./config/db");

// Routes
const authRoutes     = require("./routes/auth.routes");
const kycRoutes      = require("./routes/kyc.routes");
const evidenceRoutes = require("./routes/evidence.routes");
const caseRoutes     = require("./routes/case.routes");
const adminRoutes    = require("./routes/admin.routes");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"], credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ success: true, message: "ForenX API running", timestamp: new Date() }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/kyc",      kycRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/cases",    caseRoutes);
app.use("/api/admin",    adminRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 ForenX API running on http://localhost:${PORT}`));
});
