const mongoose = require("mongoose");

const CaseSchema = new mongoose.Schema(
  {
    caseId:      { type: String, required: true, unique: true },
    title:       { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["open", "under_investigation", "closed", "archived"],
      default: "open",
    },
    createdBy:       { type: String, required: true },    // wallet address
    assignedPolice:  [{ type: String }],
    assignedLab:     [{ type: String }],
    evidenceCount:   { type: Number, default: 0 },
    closedAt:        { type: Date },
    closedReason:    { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Case", CaseSchema);
