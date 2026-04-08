const router       = require("express").Router();
const multer       = require("multer");
const { v4: uuid } = require("uuid");
const Evidence     = require("../models/Evidence");
const Case         = require("../models/Case");
const authenticate = require("../middleware/auth.middleware");
const requireKYC   = require("../middleware/kyc.middleware");
const requireRole  = require("../middleware/role.middleware");
const { uploadFile } = require("../services/ipfs.service");
const { hashBuffer } = require("../services/crypto.service");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// POST /api/evidence/upload — collector uploads evidence file, returns hash + IPFS CID
router.post(
  "/upload",
  authenticate, requireKYC, requireRole("collector", "admin"),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

      const fileBuffer = req.file.buffer;
      const fileHash   = hashBuffer(fileBuffer);
      const ipfsHash   = await uploadFile(fileBuffer, req.file.originalname);

      res.json({ success: true, fileHash, ipfsHash, fileName: req.file.originalname, fileSize: req.file.size, fileType: req.file.mimetype });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// POST /api/evidence — register evidence in MongoDB after blockchain tx
router.post(
  "/",
  authenticate, requireKYC, requireRole("collector", "admin"),
  async (req, res) => {
    try {
      const { evidenceId, caseId, title, description, fileHash, ipfsHash, sealId,
              fileName, fileSize, fileType, digitalSignature, txHash, innerQRData, outerQRData } = req.body;

      if (!evidenceId || !caseId || !title || !fileHash || !ipfsHash || !sealId)
        return res.status(400).json({ success: false, message: "Missing required fields" });

      // Verify case exists
      const caseDoc = await Case.findOne({ caseId });
      if (!caseDoc) return res.status(404).json({ success: false, message: "Case not found" });

      const evidence = await Evidence.create({
        evidenceId, caseId, title, description, fileHash, ipfsHash, sealId,
        fileName, fileSize, fileType, digitalSignature, txHash, innerQRData, outerQRData,
        collectorWallet: req.user.walletAddress,
        currentOwner:    req.user.walletAddress,
        status: "COLLECTED",
      });

      // Increment case evidence count
      await Case.updateOne({ caseId }, { $inc: { evidenceCount: 1 } });

      res.status(201).json({ success: true, evidence });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// GET /api/evidence — list evidence (filtered by role)
router.get("/", authenticate, requireKYC, async (req, res) => {
  try {
    const { caseId, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (caseId) filter.caseId = caseId;
    if (status)  filter.status = status;

    // Collectors only see their own
    if (req.user.role === "collector") filter.collectorWallet = req.user.walletAddress;

    const total = await Evidence.countDocuments(filter);
    const items = await Evidence.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit);
    res.json({ success: true, total, page: +page, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/evidence/:evidenceId
router.get("/:evidenceId", authenticate, requireKYC, async (req, res) => {
  try {
    const evidence = await Evidence.findOne({ evidenceId: req.params.evidenceId });
    if (!evidence) return res.status(404).json({ success: false, message: "Evidence not found" });
    res.json({ success: true, evidence });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/evidence/:evidenceId/transfer — transport/lab updates ownership
router.patch("/:evidenceId/transfer", authenticate, requireKYC, async (req, res) => {
  try {
    const { newOwner, status, notes, txHash } = req.body;
    const evidence = await Evidence.findOne({ evidenceId: req.params.evidenceId });
    if (!evidence) return res.status(404).json({ success: false, message: "Evidence not found" });

    if (evidence.currentOwner.toLowerCase() !== req.user.walletAddress.toLowerCase())
      return res.status(403).json({ success: false, message: "You are not the current evidence owner" });

    evidence.currentOwner = newOwner;
    if (status) evidence.status = status;
    if (txHash) evidence.txHash = txHash;
    await evidence.save();

    res.json({ success: true, message: "Evidence transferred", evidence });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/evidence/:evidenceId/lab-report — forensic lab submits verification result
router.patch(
  "/:evidenceId/lab-report",
  authenticate, requireKYC, requireRole("lab", "admin"),
  async (req, res) => {
    try {
      const { reportIpfsHash, reportFileHash, tampered, notes } = req.body;
      const evidence = await Evidence.findOne({ evidenceId: req.params.evidenceId });
      if (!evidence) return res.status(404).json({ success: false, message: "Evidence not found" });

      evidence.labReport = {
        reportIpfsHash, reportFileHash,
        tampered: !!tampered,
        verifiedBy: req.user.walletAddress,
        verifiedAt: new Date(),
        notes,
      };
      evidence.status = tampered ? "TAMPERED" : "VERIFIED";
      await evidence.save();

      res.json({ success: true, message: `Evidence marked as ${evidence.status}`, evidence });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// PATCH /api/evidence/:evidenceId/police-decision
router.patch(
  "/:evidenceId/police-decision",
  authenticate, requireKYC, requireRole("police", "admin"),
  async (req, res) => {
    try {
      const { decision, notes } = req.body;
      const evidence = await Evidence.findOne({ evidenceId: req.params.evidenceId });
      if (!evidence) return res.status(404).json({ success: false, message: "Evidence not found" });

      evidence.policeDecision = { decision, notes, decisionBy: req.user.walletAddress, decisionAt: new Date() };
      evidence.status = "AT_POLICE";
      await evidence.save();
      res.json({ success: true, evidence });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// PATCH /api/evidence/:evidenceId/judicial-decision
router.patch(
  "/:evidenceId/judicial-decision",
  authenticate, requireKYC, requireRole("judicial", "admin"),
  async (req, res) => {
    try {
      const { decision, notes } = req.body;
      const evidence = await Evidence.findOne({ evidenceId: req.params.evidenceId });
      if (!evidence) return res.status(404).json({ success: false, message: "Evidence not found" });

      evidence.judicialDecision = { decision, notes, decisionBy: req.user.walletAddress, decisionAt: new Date() };
      evidence.status = "JUDICIAL_REVIEW";
      await evidence.save();
      res.json({ success: true, evidence });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
