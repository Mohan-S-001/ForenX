const router      = require("express").Router();
const multer      = require("multer");
const User        = require("../models/User");
const authenticate = require("../middleware/auth.middleware");
const requireRole  = require("../middleware/role.middleware");
const { uploadFile } = require("../services/ipfs.service");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/kyc/submit  — upload ID + selfie to IPFS, update user record
router.post(
  "/submit",
  authenticate,
  upload.fields([{ name: "idProof", maxCount: 1 }, { name: "selfie", maxCount: 1 }]),
  async (req, res) => {
    try {
      const user = req.user;
      if (user.kycStatus === "approved")
        return res.status(400).json({ success: false, message: "KYC already approved" });

      const idProofFile = req.files?.idProof?.[0];
      const selfieFile  = req.files?.selfie?.[0];

      if (!idProofFile || !selfieFile)
        return res.status(400).json({ success: false, message: "Both idProof and selfie are required" });

      const idProofCID = await uploadFile(idProofFile.buffer, `idproof_${user.walletAddress}_${Date.now()}`);
      const selfieCID  = await uploadFile(selfieFile.buffer, `selfie_${user.walletAddress}_${Date.now()}`);

      user.idProofCID = idProofCID;
      user.selfieCID  = selfieCID;
      user.kycStatus  = "pending";
      await user.save();

      res.json({ success: true, message: "KYC submitted successfully. Awaiting admin review.", idProofCID, selfieCID });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// GET /api/kyc/status
router.get("/status", authenticate, (req, res) => {
  res.json({
    success: true,
    kycStatus:         req.user.kycStatus,
    kycRejectionReason: req.user.kycRejectionReason,
  });
});

// GET /api/kyc/pending  — admin: list all pending KYC
router.get("/pending", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const users = await User.find({ kycStatus: "pending" }).select("-nonce").sort({ createdAt: 1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/kyc/all  — admin: list all users with KYC info
router.get("/all", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { kycStatus: status } : {};
    const users = await User.find(filter).select("-nonce").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/kyc/:userId/approve
router.patch("/:userId/approve", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.kycStatus  = "approved";
    user.reviewedBy = req.user.walletAddress;
    user.reviewedAt = new Date();
    user.kycRejectionReason = undefined;
    await user.save();

    res.json({ success: true, message: "KYC approved", user: { name: user.name, kycStatus: user.kycStatus } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/kyc/:userId/reject
router.patch("/:userId/reject", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.kycStatus          = "rejected";
    user.kycRejectionReason = reason || "No reason provided";
    user.reviewedBy         = req.user.walletAddress;
    user.reviewedAt         = new Date();
    await user.save();

    res.json({ success: true, message: "KYC rejected", user: { name: user.name, kycStatus: user.kycStatus } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
