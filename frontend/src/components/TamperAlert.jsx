import { statusColor } from "../services/crypto";

export default function TamperAlert({ status, computedHash, storedHash }) {
  const isTampered = status === "TAMPERED" ||
    (computedHash && storedHash && computedHash !== storedHash);
  const isVerified = status === "VERIFIED" ||
    (computedHash && storedHash && computedHash === storedHash);

  if (isTampered) return (
    <div className="tamper-alert">
      <div style={{ fontSize: "3rem", marginBottom: 8 }}>🚨</div>
      <h3 style={{ color: "var(--accent-red)", marginBottom: 8 }}>TAMPER DETECTED</h3>
      <p style={{ color: "#fca5a5", marginBottom: 12 }}>
        Hash mismatch — this evidence has been compromised.
      </p>
      {computedHash && (
        <div style={{ textAlign: "left", marginTop: 12 }}>
          <div className="form-label" style={{ marginBottom: 4 }}>Computed Hash</div>
          <div className="hash-display" style={{ color: "var(--accent-red)" }}>{computedHash}</div>
          <div className="form-label" style={{ marginTop: 8, marginBottom: 4 }}>Stored Hash</div>
          <div className="hash-display">{storedHash}</div>
        </div>
      )}
    </div>
  );

  if (isVerified) return (
    <div className="verified-badge">
      <div style={{ fontSize: "3rem", marginBottom: 8 }}>✅</div>
      <h3 style={{ color: "var(--accent-green)", marginBottom: 8 }}>EVIDENCE VERIFIED</h3>
      <p style={{ color: "#6ee7b7" }}>Hash matches — integrity confirmed on blockchain.</p>
      {computedHash && (
        <div style={{ marginTop: 12 }}>
          <div className="hash-display" style={{ color: "var(--accent-green)" }}>{computedHash}</div>
        </div>
      )}
    </div>
  );

  return null;
}
