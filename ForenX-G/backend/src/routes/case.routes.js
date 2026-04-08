const router       = require("express").Router();
const { v4: uuid } = require("uuid");
const Case         = require("../models/Case");
const Evidence     = require("../models/Evidence");
const authenticate = require("../middleware/auth.middleware");
const requireKYC   = require("../middleware/kyc.middleware");
const requireRole  = require("../middleware/role.middleware");

// POST /api/cases
router.post("/", authenticate, requireKYC, requireRole("admin", "police"), async (req, res) => {
  try {
    const { title, description, assignedPolice, assignedLab } = req.body;
    if (!title) return res.status(400).json({ success: false, message: "Title required" });

    const caseId = `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const caseDoc = await Case.create({
      caseId, title, description,
      createdBy: req.user.walletAddress,
      assignedPolice: assignedPolice || [],
      assignedLab:    assignedLab    || [],
    });
    res.status(201).json({ success: true, case: caseDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/cases
router.get("/", authenticate, requireKYC, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    // Police: only their cases
    if (req.user.role === "police") filter.assignedPolice = req.user.walletAddress;
    if (req.user.role === "lab")    filter.assignedLab    = req.user.walletAddress;

    const total = await Case.countDocuments(filter);
    const items = await Case.find(filter).sort({ createdAt: -1 }).skip((+page - 1) * +limit).limit(+limit);
    res.json({ success: true, total, page: +page, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/cases/:caseId
router.get("/:caseId", authenticate, requireKYC, async (req, res) => {
  try {
    const caseDoc  = await Case.findOne({ caseId: req.params.caseId });
    if (!caseDoc) return res.status(404).json({ success: false, message: "Case not found" });
    const evidences = await Evidence.find({ caseId: req.params.caseId }).sort({ createdAt: -1 });
    res.json({ success: true, case: caseDoc, evidences });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/cases/:caseId
router.patch("/:caseId", authenticate, requireKYC, requireRole("admin", "police"), async (req, res) => {
  try {
    const { title, description, status, assignedPolice, assignedLab, closedReason } = req.body;
    const caseDoc = await Case.findOne({ caseId: req.params.caseId });
    if (!caseDoc) return res.status(404).json({ success: false, message: "Case not found" });

    if (title)           caseDoc.title           = title;
    if (description)     caseDoc.description     = description;
    if (status)          caseDoc.status          = status;
    if (assignedPolice)  caseDoc.assignedPolice  = assignedPolice;
    if (assignedLab)     caseDoc.assignedLab     = assignedLab;
    if (closedReason)    caseDoc.closedReason    = closedReason;
    if (status === "closed") caseDoc.closedAt    = new Date();

    await caseDoc.save();
    res.json({ success: true, case: caseDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
