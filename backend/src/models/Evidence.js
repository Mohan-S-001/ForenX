const mongoose = require("mongoose");

const EvidenceSchema = new mongoose.Schema(
  {
    evidenceId:       { type: String, required: true, unique: true },
    caseId:           { type: String, required: true },
    title:            { type: String, required: true },
    description:      { type: String },
    fileHash:         { type: String, required: true },   // SHA-256
    ipfsHash:         { type: String, required: true },   // IPFS CID
    sealId:           { type: String, required: true },
    fileName:         { type: String },
    fileSize:         { type: Number },
    fileType:         { type: String },
    digitalSignature: { type: String },
    collectorWallet:  { type: String, required: true },
    currentOwner:     { type: String, required: true },
    status: {
      type: String,
      enum: ["COLLECTED", "IN_TRANSIT", "AT_LAB", "VERIFIED", "TAMPERED", "AT_POLICE", "JUDICIAL_REVIEW", "CLOSED"],
      default: "COLLECTED",
    },
    txHash:           { type: String },   // blockchain tx
    innerQRData:      { type: Object },
    outerQRData:      { type: Object },
    labReport: {
      reportIpfsHash: String,
      reportFileHash: String,
      tampered:       Boolean,
      verifiedBy:     String,
      verifiedAt:     Date,
      notes:          String,
    },
    policeDecision: {
      decision:   { type: String, enum: ["approved", "rejected"] },
      notes:      String,
      decisionBy: String,
      decisionAt: Date,
    },
    judicialDecision: {
      decision:   { type: String, enum: ["admitted", "rejected", "inconclusive"] },
      notes:      String,
      decisionBy: String,
      decisionAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Evidence", EvidenceSchema);
