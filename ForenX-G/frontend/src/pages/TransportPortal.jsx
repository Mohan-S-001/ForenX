import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "../contexts/AuthContext";
import { useWeb3 } from "../contexts/Web3Context";
import { transferEvidence } from "../services/blockchain";
import QRScanner from "../components/QRScanner";
import ChainOfCustody from "../components/ChainOfCustody";
import { Truck, QrCode, CheckCircle, XCircle, Search } from "lucide-react";
import { formatDate, shortAddress } from "../services/crypto";
import toast from "react-hot-toast";

export default function TransportPortal() {
  const { user } = useAuth();
  const { signer, connected, connect } = useWeb3();

  const [tab,       setTab]       = useState("scan");
  const [evidence,  setEvidence]  = useState(null);
  const [logs,      setLogs]      = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [notes,     setNotes]     = useState("");
  const [recipient, setRecipient] = useState("");
  const [searchId,  setSearchId]  = useState("");

  const loadEvidence = async (evidenceId) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/evidence/${evidenceId}`);
      setEvidence(data.evidence);
      toast.success("Evidence loaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Evidence not found");
    } finally { setLoading(false); }
  };

  const handleScan = (parsed) => {
    const id = parsed?.evidenceId || parsed?.raw;
    if (id) loadEvidence(id);
  };

  const handleTransfer = async (action) => {
    if (!evidence) return;
    if (!connected) { try { await connect(); } catch(e) { toast.error(e.message); return; } }
    setLoading(true);
    try {
      const newStatus = action === "accept" ? "IN_TRANSIT" : "COLLECTED";
      // Blockchain transfer
      if (action === "accept" && recipient) {
        await transferEvidence(signer, {
          evidenceId: evidence.evidenceId,
          newOwner:   recipient,
          newStatus:  1, // IN_TRANSIT
          notes:      notes || "Transport accepted",
        });
      }
      // Backend update
      await API.patch(`/evidence/${evidence.evidenceId}/transfer`, {
        newOwner: action === "accept" ? (recipient || user.walletAddress) : evidence.collectorWallet,
        status:   newStatus,
        notes:    notes || (action === "accept" ? "Accepted for transport" : "Rejected — returned to collector"),
      });
      toast.success(action === "accept" ? "Evidence accepted for transport" : "Evidence rejected");
      loadEvidence(evidence.evidenceId);
      setNotes(""); setRecipient("");
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="layout-with-sidebar">
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-title">Transport Portal</div>
          <div className={`sidebar-link ${tab === "scan" ? "active" : ""}`} onClick={() => setTab("scan")}><QrCode size={16} /> Scan QR</div>
          <div className={`sidebar-link ${tab === "search" ? "active" : ""}`} onClick={() => setTab("search")}><Search size={16} /> Search ID</div>
        </div>
        <div className="sidebar-section">
          <div className="card" style={{ padding: 16, fontSize: "0.82rem" }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>🚚 Transport Officer</div>
            <div style={{ color: "var(--text-secondary)" }}>{user?.name}</div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h1>🚚 Transport Portal</h1>
          <p>Scan evidence QR codes to accept or reject custody transfer</p>
        </div>

        {tab === "scan" && (
          <div className="card" style={{ maxWidth: 500, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Scan OUTER QR</h3>
            <QRScanner onScan={handleScan} />
          </div>
        )}

        {tab === "search" && (
          <div className="card" style={{ maxWidth: 500, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Search by Evidence ID</h3>
            <div className="flex gap-2">
              <input className="form-input" placeholder="EVD-xxxx-xxxx" value={searchId} onChange={e => setSearchId(e.target.value)} />
              <button className="btn btn-primary" onClick={() => loadEvidence(searchId)}><Search size={16} /></button>
            </div>
          </div>
        )}

        {loading && <div className="loading-overlay"><div className="spinner spinner-lg" /></div>}

        {evidence && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Evidence details */}
            <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                <h3>{evidence.title}</h3>
                <span className={`badge badge-${evidence.status === "TAMPERED" ? "red" : evidence.status === "VERIFIED" ? "green" : "yellow"}`}>
                  {evidence.status}
                </span>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div><div className="form-label">Evidence ID</div><div className="mono" style={{ fontSize: "0.8rem" }}>{evidence.evidenceId}</div></div>
                <div><div className="form-label">Case ID</div><div>{evidence.caseId}</div></div>
                <div><div className="form-label">Seal ID</div><div className="mono" style={{ fontSize: "0.8rem" }}>{evidence.sealId}</div></div>
                <div><div className="form-label">Current Owner</div><div className="mono" style={{ fontSize: "0.8rem" }}>{shortAddress(evidence.currentOwner)}</div></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="form-label">SHA-256 Hash</div>
                <div className="hash-display">{evidence.fileHash}</div>
              </div>
            </div>

            {/* Seal confirmation + action */}
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Seal Verification</h3>
              <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                ⚠️ Physically inspect the seal <strong>{evidence.sealId}</strong> before accepting.
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Recipient Wallet (optional)</label>
                <input className="form-input" placeholder="0x..." value={recipient} onChange={e => setRecipient(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Seal verified intact, transport initiated" style={{ minHeight: 70 }} />
              </div>
              <div className="flex gap-3">
                <button className="btn btn-success" onClick={() => handleTransfer("accept")} disabled={loading}>
                  <CheckCircle size={16} /> Accept Custody
                </button>
                <button className="btn btn-danger" onClick={() => handleTransfer("reject")} disabled={loading}>
                  <XCircle size={16} /> Reject Evidence
                </button>
              </div>
            </div>

            {/* Chain of custody */}
            <div className="card">
              <h3 style={{ marginBottom: 20 }}>Chain of Custody</h3>
              <ChainOfCustody logs={[]} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
