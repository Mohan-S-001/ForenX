import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";
import { useAuth } from "../contexts/AuthContext";
import { API } from "../contexts/AuthContext";
import { ShieldCheck, Wallet, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

const ROLE_REDIRECT = {
  admin:     "/admin",
  collector: "/collector",
  transport: "/transport",
  lab:       "/lab",
  police:    "/police",
  judicial:  "/judicial",
};

export default function Login() {
  const { connect, account, connected, signMessage } = useWeb3();
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");

  const handleLogin = async () => {
    setLoading(true); setError("");
    try {
      let addr = account;
      if (!connected) addr = await connect();

      // Step 1: get nonce
      const { data: nonceData } = await API.get(`/auth/nonce/${addr}`);
      if (!nonceData.registered) {
        setError("Wallet not registered. Please create an account first.");
        setLoading(false); return;
      }

      // Step 2: sign nonce
      const message   = `ForenX Login: ${nonceData.nonce}`;
      const signature = await signMessage(message);

      // Step 3: exchange for JWT
      const { data: loginData } = await API.post("/auth/login", { walletAddress: addr, signature });
      login(loginData.token, loginData.user);
      toast.success(`Welcome back, ${loginData.user.name}!`);
      navigate(ROLE_REDIRECT[loginData.user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div className="text-center" style={{ marginBottom: 32 }}>
          <ShieldCheck size={40} style={{ color: "var(--accent-blue)", marginBottom: 12 }} />
          <h1 style={{ fontSize: "1.8rem", marginBottom: 8 }}>Login to ForenX</h1>
          <p>Sign in securely with your MetaMask wallet</p>
        </div>

        <div className="card-glass" style={{ padding: 32 }}>
          {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>{error}</div>}

          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <Wallet size={56} style={{ color: "var(--accent-blue)", marginBottom: 20 }} />
            <p style={{ marginBottom: 8, fontSize: "0.9rem" }}>
              {connected
                ? <>Wallet connected: <strong style={{ color: "var(--accent-cyan)", fontSize: "0.8rem" }}>{account}</strong></>
                : "Connect your MetaMask wallet to authenticate."
              }
            </p>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 28 }}>
              You'll be asked to sign a message — no ETH will be spent.
            </p>
            <button className="btn btn-primary btn-full btn-lg" onClick={handleLogin} disabled={loading}>
              {loading
                ? <><div className="spinner" /> Authenticating…</>
                : <><Wallet size={18} /> {connected ? "Sign & Login" : "Connect & Login"} <ArrowRight size={16} /></>
              }
            </button>
          </div>

          <div style={{
            marginTop: 24, padding: 16, background: "rgba(59,130,246,0.05)",
            borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
          }}>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              🔐 ForenX uses MetaMask cryptographic signatures — no passwords stored.
              Your private key never leaves your browser.
            </p>
          </div>

          <div className="text-center" style={{ marginTop: 20, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            No account? <Link to="/register">Register here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
