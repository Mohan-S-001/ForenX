import { formatDate, shortAddress, statusColor } from "../services/crypto";

const STAGE_ICONS = {
  COLLECTED: "📦", IN_TRANSIT: "🚚", AT_LAB: "🔬",
  VERIFIED: "✅", TAMPERED: "🚨", AT_POLICE: "👮",
  JUDICIAL_REVIEW: "⚖️", CLOSED: "🔒",
};

const DOT_COLORS = {
  COLLECTED: "", IN_TRANSIT: "yellow", AT_LAB: "purple",
  VERIFIED: "green", TAMPERED: "red", AT_POLICE: "",
  JUDICIAL_REVIEW: "purple", CLOSED: "",
};

export default function ChainOfCustody({ logs = [], onChainLogs = [] }) {
  // Merge and deduplicate logs from DB + blockchain
  const allLogs = onChainLogs.length > 0 ? onChainLogs : logs;

  if (!allLogs || allLogs.length === 0) return (
    <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
      No custody records found.
    </div>
  );

  return (
    <div className="timeline">
      {allLogs.map((log, i) => {
        const stage = typeof log.stage === "number"
          ? ["COLLECTED","IN_TRANSIT","AT_LAB","VERIFIED","TAMPERED","AT_POLICE","JUDICIAL_REVIEW","CLOSED"][log.stage]
          : (log.stage || "COLLECTED");
        const dotColor = DOT_COLORS[stage] || "";
        const ts = log.timestamp
          ? (typeof log.timestamp === "bigint" ? formatDate(Number(log.timestamp)) : formatDate(log.timestamp))
          : "";

        return (
          <div key={i} className="timeline-item">
            <div className={`timeline-dot ${dotColor}`} />
            <div className="timeline-time">{ts}</div>
            <div className="timeline-title">
              {STAGE_ICONS[stage] || "📌"} {stage.replace(/_/g, " ")}
            </div>
            <div className="timeline-desc">{log.notes || "Custody updated"}</div>
            {log.from && log.from !== "0x0000000000000000000000000000000000000000" && (
              <div style={{ marginTop: 4, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                From: <span className="mono">{shortAddress(log.from)}</span>
                {log.to && <> → To: <span className="mono">{shortAddress(log.to)}</span></>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
