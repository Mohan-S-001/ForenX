const router = require("express").Router();

/**
 * GET /api/ipfs/:cid
 * Acts as a local gateway for mock CIDs and a relay for real ones.
 */
router.get("/:cid", (req, res) => {
  const { cid } = req.params;

  // 1. Handle Mock File CIDs
  if (cid.startsWith("mock-cid-file")) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>ForenX - Mock Evidence Preview</title>
        <style>
          body { background: #0f172a; color: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #1e293b; padding: 40px; border-radius: 12px; border: 1px solid #334155; text-align: center; max-width: 500px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
          .icon { font-size: 64px; margin-bottom: 20px; }
          h1 { margin: 0; font-size: 24px; color: #38bdf8; }
          p { color: #94a3b8; margin: 15px 0 25px; line-height: 1.6; }
          .badge { background: #0ea5e9; color: white; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .footer { font-size: 11px; color: #475569; margin-top: 30px; border-top: 1px solid #334155; pt: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">📄</div>
          <span class="badge">DEMO MODE</span>
          <h1>Forensic Asset Preview</h1>
          <p>This is a simulated preview of the evidence file (ID: ${cid}). In production, this would be retrieved from the decentralized IPFS network.</p>
          <div style="background: #000; height: 200px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px dashed #475569;">
            <span style="color: #475569; font-size: 14px;">[ Simulated Evidence Content ]</span>
          </div>
          <div class="footer">
            ForenX Blockchain Forensic System &copy; 2026
          </div>
        </div>
      </body>
      </html>
    `);
  }

  // 2. Handle Mock JSON CIDs
  if (cid.startsWith("mock-cid-json")) {
    return res.json({
      success: true,
      mode: "DEMO_MOCK",
      cid: cid,
      timestamp: new Date().toISOString(),
      message: "This is a simulated JSON response for the ForenX Lab Report.",
      data: {
        authenticity: "VERIFIED",
        signatureMatch: true,
        summary: "Evidence integrity confirmed by Forensic AI."
      }
    });
  }

  // 3. Handle Real CIDs (Redirect to Pinata)
  return res.redirect(`https://gateway.pinata.cloud/ipfs/${cid}`);
});

module.exports = router;
