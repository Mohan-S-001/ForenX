import { useState } from "react";
import { useAuth, API } from "../contexts/AuthContext";
import { useWeb3 } from "../contexts/Web3Context";
import { getEvidence, getTransferLogs, STATUS_MAP } from "../services/blockchain";
import QRScanner from "../components/QRScanner";
import ChainOfCustody from "../components/ChainOfCustody";
import TamperAlert from "../components/TamperAlert";
import { QrCode, Search, Database } from "lucide-react";
import { formatDate, shortAddress } from "../services/crypto";
import toast from "react-hot-toast";

export default function QRScanPage() {
  const { provider }  = useWeb3();
  const [evidence,    setEvidence]    = useState(null);
  const [onChainData, setOnChainData] = useState(null);
  const [onChainLogs, setOnChainLogs] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [manualId,    setManualId]    = useState("");

  const loadAll = async (evidenceId) => {
    setLoading(true);
    setEvidence(null); setOnChainData(null); setOnChainLogs([]);
    try {
      const { data } = await API.get(`/evidence/${evidenceId}`);
      setEvidence(data.evidence);

      if (provider) {
        try {
          const chain = await getEvidence(provider, evidenceId);
          setOnChainData(chain);
          const logs  = await getTransferLogs(provider, evidenceId);
          setOnChainLogs([...logs]);
        } catch (e) {
          toast("Blockchain data unavailable — showing DB record only", { icon: "ℹ️" });
        }
      }
      toast.success("Evidence loaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Evidence not found");
    } finally { setLoading(false); }
  };

  const handleScan = (parsed) => {
    const id = parsed?.evidenceId || parsed?.raw;
    if (id) loadAll(id);
    else toast.error("No evidenceId found in QR");
  };

  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-header">
          <h1><QrCode style={{ display: "inline", marginRight: 10 }} size={28} /> QR Scanner & Evidence Verifier</h1>
          <p>Scan any ForenX QR code to instantly retrieve and verify blockchain records</p>
        </div>

        <div className="grid-2" style={{ marginBottom: 32 }}>
          {/* Scanner */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Camera Scanner</h3>
            <QRScanner onScan={handleScan} />
          </div>

          {/* Manual lookup */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Manual Lookup</h3>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Evidence ID</label>
              <input className="form-input" placeholder="EVD-xxxx-xxxx" value={manualId} onChange={e => setManualId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && loadAll(manualId)} />
            </div>
            <button className="btn btn-primary btn-full" onClick={() => loadAll(manualId)} disabled={!manualId || loading}>
              <Search size={16} /> Look Up Evidence
            </button>

            <div style={{ marginTop: 24 }}>
              <h4 style={{ marginBottom: 12, fontSize: "0.9rem" }}>How to use:</h4>
              <ol style={{ color: "var(--text-secondary)", fontSize: "0.85rem", paddingLeft: 20, lineHeight: 2 }}>
                <li>Scan the <strong>OUTER QR</strong> for tracking info</li>
                <li>Scan the <strong>INNER QR</strong> for full verification</li>
                <li>System fetches blockchain + database records</li>
                <li>Integrity is verified automatically</li>
              </ol>
            </div>
          </div>
        </div>

        {loading && <div className="loading-overlay"><div className="spinner spinner-lg" /><p>Fetching evidence…</p></div>}

        {evidence && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Integrity check */}
            {onChainData && (
              <TamperAlert
                status={STATUS_MAP[Number(onChainData.status)]}
              />
            )}

            {/* Evidence detail */}
            <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                <h3>{evidence.title}</h3>
                <span className={`badge badge-${evidence.status === "VERIFIED" ? "green" : evidence.status === "TAMPERED" ? "red" : "blue"}`}>
                  {evidence.status}
                </span>
              </div>

              <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
                <div>
                  <div className="form-label">Evidence ID</div>
                  <div className="hash-display" style={{ fontSize: "0.78rem" }}>{evidence.evidenceId}</div>
                </div>
                <div>
                  <div className="form-label">Seal ID</div>
                  <div className="hash-display" style={{ fontSize: "0.78rem" }}>{evidence.sealId}</div>
                </div>
              </div>

              {/* Hash comparison */}
              <div style={{ marginBottom: 12 }}>
                <div className="form-label">SHA-256 Hash (Database)</div>
                <div className="hash-display">{evidence.fileHash}</div>
              </div>
              {onChainData && (
                <div style={{ marginBottom: 12 }}>
                  <div className="form-label">SHA-256 Hash (Blockchain)</div>
                  <div className="hash-display" style={{ color: onChainData.fileHash === evidence.fileHash ? "var(--accent-green)" : "var(--accent-red)" }}>
                    {onChainData.fileHash}
                    {onChainData.fileHash === evidence.fileHash
                      ? " ✅ Matches"
                      : " 🚨 MISMATCH"}
                  </div>
                </div>
              )}

              <div className="grid-2" style={{ gap: 12 }}>
                <div>
                  <div className="form-label">IPFS CID</div>
                  <a href={`https://gateway.pinata.cloud/ipfs/${evidence.ipfsHash}`} target="_blank" rel="noreferrer"
                    className="mono" style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>
                    {evidence.ipfsHash}
                  </a>
                </div>
                <div>
                  <div className="form-label">Collector</div>
                  <div className="mono" style={{ fontSize: "0.78rem" }}>{shortAddress(evidence.collectorWallet)}</div>
                </div>
              </div>
            </div>

            {/* Chain of custody */}
            {onChainLogs.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: 20 }}>
                  <Database size={18} style={{ display: "inline", marginRight: 8, color: "var(--accent-blue)" }} />
                  Blockchain Chain of Custody
                </h3>
                <ChainOfCustody onChainLogs={onChainLogs} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
