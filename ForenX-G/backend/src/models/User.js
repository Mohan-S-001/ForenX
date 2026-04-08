const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    role: {
      type: String,
      enum: ["admin", "collector", "transport", "lab", "police", "judicial"],
      required: true,
    },
    kycStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    kycRejectionReason: { type: String },
    idProofCID:  { type: String },   // IPFS CID for ID document
    selfieCID:   { type: String },   // IPFS CID for selfie
    nonce:       { type: String },   // MetaMask sign nonce
    isActive:    { type: Boolean, default: true },
    lastLogin:   { type: Date },
    reviewedBy:  { type: String },   // Admin wallet who reviewed KYC
    reviewedAt:  { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
