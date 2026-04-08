import { Link } from "react-router-dom";
import { statusColor, shortAddress, formatDate } from "../services/crypto";
import { FileText, ExternalLink } from "lucide-react";

const STATUS_ICONS = {
  COLLECTED: "📦", IN_TRANSIT: "🚚", AT_LAB: "🔬",
  VERIFIED: "✅", TAMPERED: "🚨", AT_POLICE: "👮",
  JUDICIAL_REVIEW: "⚖️", CLOSED: "🔒",
};

export default function EvidenceCard({ evidence }) {
  const { evidenceId, title, status, caseId, collectorWallet, createdAt, fileHash, sealId } = evidence;
  const color = statusColor(status);

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="flex justify-between items-center">
        <span className={`badge badge-${color}`}>
          {STATUS_ICONS[status] || "📌"} {status?.replace(/_/g, " ")}
        </span>
        <Link to={`/evidence/${evidenceId}`} style={{ color: "var(--accent-blue)", display: "flex", alignItems: "center", gap: 4, fontSize: "0.8rem" }}>
          View <ExternalLink size={12} />
        </Link>
      </div>

      <div>
        <h3 style={{ marginBottom: 4, fontSize: "1rem" }}>{title}</h3>
        <div className="mono" style={{ fontSize: "0.75rem" }}>{evidenceId}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <div className="form-label" style={{ fontSize: "0.7rem" }}>Case ID</div>
          <div style={{ fontSize: "0.82rem" }}>{caseId}</div>
        </div>
        <div>
          <div className="form-label" style={{ fontSize: "0.7rem" }}>Seal ID</div>
          <div className="mono" style={{ fontSize: "0.75rem" }}>{sealId}</div>
        </div>
        <div>
          <div className="form-label" style={{ fontSize: "0.7rem" }}>Collector</div>
          <div className="mono" style={{ fontSize: "0.75rem" }}>{shortAddress(collectorWallet)}</div>
        </div>
        <div>
          <div className="form-label" style={{ fontSize: "0.7rem" }}>Collected</div>
          <div style={{ fontSize: "0.82rem" }}>{formatDate(createdAt)}</div>
        </div>
      </div>

      <div>
        <div className="form-label" style={{ fontSize: "0.7rem" }}>File Hash (SHA-256)</div>
        <div className="hash-display" style={{ fontSize: "0.7rem" }}>
          {fileHash?.slice(0, 32)}…
        </div>
      </div>
    </div>
  );
}
