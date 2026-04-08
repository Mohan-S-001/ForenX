const router  = require("express").Router();
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const { verifySignature, generateNonce } = require("../services/signature.service");

// GET /api/auth/nonce/:wallet  — get sign challenge
router.get("/nonce/:wallet", async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    let user = await User.findOne({ walletAddress: wallet });
    const nonce = generateNonce();
    if (user) {
      user.nonce = nonce;
      await user.save();
    } else {
      // Return nonce even for unregistered wallets (registration check later)
      return res.json({ success: true, nonce, registered: false });
    }
    res.json({ success: true, nonce, registered: true, kycStatus: user.kycStatus, role: user.role });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login  — verify signature and issue JWT
router.post("/login", async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;
    if (!walletAddress || !signature)
      return res.status(400).json({ success: false, message: "walletAddress and signature required" });

    const wallet = walletAddress.toLowerCase();
    const user   = await User.findOne({ walletAddress: wallet });
    if (!user) return res.status(404).json({ success: false, message: "User not registered. Please register first." });

    const message  = `ForenX Login: ${user.nonce}`;
    const recovered = verifySignature(message, signature);
    if (recovered !== wallet)
      return res.status(401).json({ success: false, message: "Signature verification failed" });

    // Refresh nonce so it can't be reused
    user.nonce     = generateNonce();
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { walletAddress: wallet, role: user.role, userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      success: true,
      token,
      user: { name: user.name, walletAddress: wallet, role: user.role, kycStatus: user.kycStatus },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/register  — new user signup (before KYC)
router.post("/register", async (req, res) => {
  try {
    const { walletAddress, name, email, role } = req.body;
    const wallet = walletAddress?.toLowerCase();
    if (!wallet || !name || !role)
      return res.status(400).json({ success: false, message: "walletAddress, name, and role are required" });

    const validRoles = ["collector", "transport", "lab", "police", "judicial"];
    if (!validRoles.includes(role))
      return res.status(400).json({ success: false, message: "Invalid role" });

    const existing = await User.findOne({ walletAddress: wallet });
    if (existing) return res.status(409).json({ success: false, message: "Wallet already registered" });

    const nonce = generateNonce();
    const user  = await User.create({ walletAddress: wallet, name, email, role, nonce });

    res.status(201).json({
      success: true,
      message: "Registration successful. Please complete KYC.",
      user: { name: user.name, walletAddress: wallet, role: user.role, kycStatus: user.kycStatus },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
const authenticate = require("../middleware/auth.middleware");
router.get("/me", authenticate, (req, res) => {
  const u = req.user;
  res.json({
    success: true,
    user: { name: u.name, walletAddress: u.walletAddress, role: u.role, kycStatus: u.kycStatus, email: u.email },
  });
});

module.exports = router;
