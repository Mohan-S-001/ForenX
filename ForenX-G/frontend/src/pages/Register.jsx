import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";
import { useAuth } from "../contexts/AuthContext";
import { API } from "../contexts/AuthContext";
import { ShieldCheck, Wallet, ArrowRight, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const ROLES = [
  { value: "collector", label: "Evidence Collector", icon: "📦" },
  { value: "transport", label: "Transport Officer",  icon: "🚚" },
  { value: "lab",       label: "Forensic Lab",       icon: "🔬" },
  { value: "police",    label: "Police Inspector",   icon: "👮" },
  { value: "judicial",  label: "Judicial Authority", icon: "⚖️" },
];

export default function Register() {
  const { connect, account, connected, signMessage } = useWeb3();
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [step,     setStep]  = useState(1);
  const [form,     setForm]  = useState({ name: "", email: "", role: "" });
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");

  const handleConnect = async () => {
    try { await connect(); setStep(2); }
    catch (e) { setError(e.message); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.role) { setError("Name and role are required."); return; }
    setLoading(true); setError("");
    try {
      await API.post("/auth/register", { walletAddress: account, ...form });
      toast.success("Registered! Please login and complete KYC.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div className="text-center" style={{ marginBottom: 32 }}>
          <ShieldCheck size={40} style={{ color: "var(--accent-blue)", marginBottom: 12 }} />
          <h1 style={{ fontSize: "1.8rem", marginBottom: 8 }}>Create Account</h1>
          <p>Join the ForenX forensic evidence network</p>
        </div>

        {/* Steps indicator */}
        <div className="steps" style={{ marginBottom: 32 }}>
          <div className={`step ${step >= 1 ? (step > 1 ? "done" : "active") : ""}`}>
            <div className="step-num">{step > 1 ? "✓" : "1"}</div>
            <span className="step-label">Connect Wallet</span>
          </div>
          <div className="step-divider" />
          <div className={`step ${step >= 2 ? "active" : ""}`}>
            <div className="step-num">2</div>
            <span className="step-label">Your Details</span>
          </div>
        </div>

        <div className="card-glass">
          {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>{error}</div>}

          {step === 1 && (
            <div className="text-center" style={{ padding: "24px 0" }}>
              <Wallet size={48} style={{ color: "var(--accent-blue)", marginBottom: 16 }} />
              <h3 style={{ marginBottom: 8 }}>Connect MetaMask</h3>
              <p style={{ marginBottom: 24, fontSize: "0.9rem" }}>
                Your wallet address becomes your identity on ForenX.
              </p>
              <button className="btn btn-primary btn-full btn-lg" onClick={handleConnect}>
                <Wallet size={18} /> Connect MetaMask
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="alert alert-info" style={{ fontSize: "0.83rem" }}>
                <CheckCircle size={14} />
                Wallet connected: <strong>{account}</strong>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="e.g. Dr. Rajan Mehta" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>

              <div className="form-group">
                <label className="form-label">Email (optional)</label>
                <input className="form-input" type="email" placeholder="you@agency.gov" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {ROLES.map(r => (
                    <div
                      key={r.value}
                      onClick={() => setForm(f => ({ ...f, role: r.value }))}
                      style={{
                        padding: "12px 14px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                        border: `1px solid ${form.role === r.value ? "var(--accent-blue)" : "var(--border)"}`,
                        background: form.role === r.value ? "rgba(59,130,246,0.1)" : "var(--bg-secondary)",
                        display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
                      }}
                    >
                      <span>{r.icon}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
                {loading ? <><div className="spinner" /> Registering…</> : <>Register <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          <div className="text-center" style={{ marginTop: 20, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Already registered? <Link to="/login">Login with MetaMask</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
