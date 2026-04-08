const requireKYC = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });
  if (req.user.kycStatus !== "approved") {
    return res.status(403).json({
      success: false,
      message: `KYC not approved. Current status: ${req.user.kycStatus}`,
      kycStatus: req.user.kycStatus,
    });
  }
  next();
};

module.exports = requireKYC;
