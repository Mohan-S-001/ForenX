import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ShieldCheck, Lock, QrCode, Database, Cpu, Eye, ArrowRight, CheckCircle } from "lucide-react";

const FEATURES = [
  { icon: <ShieldCheck size={24} />, title: "Tamper-Proof Chain", desc: "Every custody transfer is immutably logged on Ethereum blockchain." },
  { icon: <Lock size={24} />,        title: "Dual QR Security",    desc: "Inner (encrypted) + Outer (tracking) QR codes on each evidence package." },
  { icon: <Database size={24} />,    title: "IPFS Evidence Store", desc: "Files are stored decentralized on IPFS — no central point of failure." },
  { icon: <Cpu size={24} />,         title: "SHA-256 Integrity",   desc: "File hashes are computed and verified at collection, lab, and trial." },
  { icon: <Eye size={24} />,         title: "Full Audit Trail",    desc: "Every action is logged — from collection to judicial verdict." },
  { icon: <QrCode size={24} />,      title: "QR Scan Verify",      desc: "Scan any QR code to instantly fetch blockchain records." },
];

const ROLES = [
  { role: "Collector",  color: "blue",   icon: "📦", path: "/collector" },
  { role: "Transport",  color: "yellow", icon: "🚚", path: "/transport" },
  { role: "Forensic Lab", color: "purple", icon: "🔬", path: "/lab" },
  { role: "Police",     color: "blue",   icon: "👮", path: "/police" },
  { role: "Judicial",   color: "green",  icon: "⚖️", path: "/judicial" },
  { role: "Admin",      color: "red",    icon: "🛡️", path: "/admin" },
];

const ROLE_PORTALS = {
  admin:     "/admin",
  collector: "/collector",
  transport: "/transport",
  lab:       "/lab",
  police:    "/police",
  judicial:  "/judicial",
};

export default function Landing() {
  const { user } = useAuth();
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "80px 24px 60px", position: "relative",
      }}>
        {/* Glow orbs */}
        <div style={{
          position: "absolute", top: "20%", left: "10%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "20%", right: "10%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 800, position: "relative" }}>
          <div className="badge badge-blue" style={{ marginBottom: 24, display: "inline-flex", padding: "8px 20px" }}>
            <ShieldCheck size={14} /> Blockchain-Powered Forensic Evidence Management
          </div>
          <h1 style={{ marginBottom: 24, lineHeight: 1.1 }}>
            Tamper-Proof Evidence.{" "}
            <span className="gradient-text">Unbreakable Trust.</span>
          </h1>
          <p style={{ fontSize: "1.15rem", marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            ForenX ensures every piece of forensic evidence is cryptographically secured,
            blockchain-verified, and transparently tracked — from crime scene to courtroom.
          </p>
          <div className="flex gap-4 justify-center" style={{ flexWrap: "wrap" }}>
            {user ? (
              <Link to={ROLE_PORTALS[user.role]} className="btn btn-primary btn-lg">
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  Login with MetaMask
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 24px", maxWidth: 1280, margin: "0 auto" }}>
        <div className="text-center" style={{ marginBottom: 56 }}>
          <h2 style={{ marginBottom: 12 }}>Security at Every Layer</h2>
          <p>Multi-layered cryptographic protection for forensic evidence integrity.</p>
        </div>
        <div className="grid-3">
          {FEATURES.map((f, i) => (
            <div key={i} className="card" style={{ textAlign: "center", padding: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "var(--radius-md)",
                background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", color: "var(--accent-blue)",
              }}>
                {f.icon}
              </div>
              <h3 style={{ marginBottom: 8, fontSize: "1rem" }}>{f.title}</h3>
              <p style={{ fontSize: "0.9rem" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role portals */}
      <section style={{ padding: "60px 24px 80px", maxWidth: 1280, margin: "0 auto" }}>
        <div className="text-center" style={{ marginBottom: 48 }}>
          <h2 style={{ marginBottom: 12 }}>Role-Based Access Control</h2>
          <p>Each role has a dedicated portal with exactly the permissions they need.</p>
        </div>
        <div className="grid-3">
          {ROLES.filter(r => !user || user.role === "admin" || r.path.includes(user.role)).map((r, i) => (
            <Link key={i} to={r.path} style={{ textDecoration: "none" }}>
              <div className="card" style={{ textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>{r.icon}</div>
                <h3 style={{ marginBottom: 8 }}>{r.role}</h3>
                <span className={`badge badge-${r.color}`}>Access Portal</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Flow */}
      <section style={{ padding: "60px 24px 100px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ marginBottom: 40 }}>Evidence Lifecycle</h2>
        <div className="flex items-center justify-center" style={{ flexWrap: "wrap", gap: 8 }}>
          {["Collect", "Hash + IPFS", "Seal + QR", "Transport", "Lab Verify", "Police Review", "Judicial Verdict"].map((s, i, arr) => (
            <div key={i} className="flex items-center gap-2">
              <div style={{
                background: `rgba(59,130,246,${0.1 + i * 0.04})`,
                border: "1px solid rgba(59,130,246,0.25)",
                borderRadius: "var(--radius-md)", padding: "10px 16px",
                fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)",
              }}>
                {s}
              </div>
              {i < arr.length - 1 && <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
