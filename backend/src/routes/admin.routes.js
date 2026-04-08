const router       = require("express").Router();
const User         = require("../models/User");
const Evidence     = require("../models/Evidence");
const Case         = require("../models/Case");
const authenticate = require("../middleware/auth.middleware");
const requireRole  = require("../middleware/role.middleware");

// GET /api/admin/stats
router.get("/stats", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const [users, pendingKYC, totalEvidence, totalCases] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ kycStatus: "pending" }),
      Evidence.countDocuments(),
      Case.countDocuments(),
    ]);
    const evidenceByStatus = await Evidence.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    res.json({ success: true, stats: { users, pendingKYC, totalEvidence, totalCases, evidenceByStatus } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users
router.get("/users", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { role, kycStatus, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role)      filter.role      = role;
    if (kycStatus) filter.kycStatus = kycStatus;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter).select("-nonce").sort({ createdAt: -1 }).skip((+page-1)*+limit).limit(+limit);
    res.json({ success: true, total, page: +page, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/users/:id/toggle-active
router.patch("/users/:id/toggle-active", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/users — admin creates a user directly (e.g. seeding admin accounts)
router.post("/users", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { walletAddress, name, email, role, kycStatus } = req.body;
    const wallet = walletAddress?.toLowerCase();
    if (!wallet || !name || !role) return res.status(400).json({ success: false, message: "Missing fields" });

    const existing = await User.findOne({ walletAddress: wallet });
    if (existing) return res.status(409).json({ success: false, message: "Wallet already exists" });

    const user = await User.create({ walletAddress: wallet, name, email, role, kycStatus: kycStatus || "approved", nonce: "0" });
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
