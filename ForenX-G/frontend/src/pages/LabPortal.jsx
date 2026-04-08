import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "../contexts/AuthContext";
import { useWeb3 } from "../contexts/Web3Context";
import { verifyEvidence, getEvidence, getTransferLogs } from "../services/blockchain";
import { hashFile } from "../services/crypto";
import QRScanner from "../components/QRScanner";
import TamperAlert from "../components/TamperAlert";
import ChainOfCustody from "../components/ChainOfCustody";
import { Microscope, QrCode, Search, Upload, Shield, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import { shortAddress } from "../services/crypto";

export default function LabPortal() {
  const { user } = useAuth();
  const { signer, provider, connected, connect } = useWeb3();

  const [tab,          setTab]          = useState("scan");
  const [evidence,     setEvidence]     = useState(null);
  const [onChainData,  setOnChainData]  = useState(null);
  const [onChainLogs,  setOnChainLogs]  = useState([]);
  const [reFile,       setReFile]       = useState(null);
  const [computedHash, setComputedHash] = useState("");
  const [loading,      setLoading]      = useState(false);
  const [verified,     setVerified]     = useState(null);  // true/false/null
  const [reportFile,   setReportFile]   = useState(null);
  const [reportNotes,  setReportNotes]  = useState("");
  const [searchId,     setSearchId]     = useState("");

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => files[0] && setReFile(files[0]),
    maxFiles: 1,
  });

  const loadEvidence = async (evidenceId) => {
    setLoading(true);
    setComputedHash(""); setVerified(null); setOnChainData(null);
    try {
      const { data } = await API.get(`/evidence/${evidenceId}`);
      setEvidence(data.evidence);

      // Also fetch from blockchain if provider available
      if (provider) {
        try {
          const onChain = await getEvidence(provider, evidenceId);
          setOnChainData(onChain);
          const logs = await getTransferLogs(provider, evidenceId);
          setOnChainLogs([...logs]);
        } catch {}
      }
      toast.success("Evidence loaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Not found");
    } finally { setLoading(false); }
  };

  const handleScan = (parsed) => {
    const id = parsed?.evidenceId || parsed?.raw;
    if (id) loadEvidence(id);
  };

  const handleReHash = async () => {
    if (!reFile) { toast.error("Please upload the file to verify"); return; }
    const hash = await hashFile(reFile);
    setComputedHash(hash);
    const storedHash = evidence?.fileHash;
    const match = hash === storedHash;
    setVerified(match);
    toast(match ? "✅ Hash matches — evidence intact" : "🚨 Hash MISMATCH — evidence tampered!", {
      style: match ? { background: "#064e3b", color: "#6ee7b7" } : { background: "#7f1d1d", color: "#fca5a5" },
    });
  };

  const handleSubmitReport = async () => {
    if (!evidence) return;
    if (!connected) { try { await connect(); } catch(e) { toast.error(e.message); return; } }
    setLoading(true);
    try {
      let reportIpfsHash = "";
      let reportFileHash = "";
      if (reportFile) {
        const formData = new FormData();
        formData.append("file", reportFile);
        const { data } = await API.post("/evidence/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        reportIpfsHash = data.ipfsHash;
        reportFileHash = data.fileHash;
      }

      const tampered = verified === false;

      // Blockchain verification
      await verifyEvidence(signer, {
        evidenceId: evidence.evidenceId,
        computedHash,
        reportIpfsHash,
        reportFileHash,
        tampered,
      });

      // Backend update
      await API.patch(`/evidence/${evidence.evidenceId}/lab-report`, {
        reportIpfsHash, reportFileHash, tampered, notes: reportNotes,
      });

      toast.success(`Evidence marked as ${tampered ? "TAMPERED" : "VERIFIED"}`);
      loadEvidence(evidence.evidenceId);
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="layout-with-sidebar">
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-title">Lab Portal</div>
          <div className={`sidebar-link ${tab === "scan" ? "active" : ""}`} onClick={() => setTab("scan")}><QrCode size={16} /> Scan QR</div>
          <div className={`sidebar-link ${tab === "search" ? "active" : ""}`} onClick={() => setTab("search")}><Search size={16} /> Search ID</div>
        </div>
        <div className="sidebar-section">
          <div className="card" style={{ padding: 16, fontSize: "0.82rem" }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>🔬 Forensic Lab</div>
            <div style={{ color: "var(--text-secondary)" }}>{user?.name}</div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h1>🔬 Forensic Lab Portal</h1>
          <p>Scan inner QR, re-hash evidence file, verify blockchain integrity</p>
        </div>

        {tab === "scan" && (
          <div className="card" style={{ maxWidth: 500, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Scan INNER QR</h3>
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
            {/* Evidence info */}
            <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                <h3>{evidence.title}</h3>
                <span className={`badge badge-${evidence.status === "TAMPERED" ? "red" : evidence.status === "VERIFIED" ? "green" : "purple"}`}>{evidence.status}</span>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div><div className="form-label">Evidence ID</div><div className="mono" style={{ fontSize: "0.8rem" }}>{evidence.evidenceId}</div></div>
                <div><div className="form-label">Seal ID</div><div className="mono" style={{ fontSize: "0.8rem" }}>{evidence.sealId}</div></div>
                <div><div className="form-label">Collector</div><div className="mono" style={{ fontSize: "0.8rem" }}>{shortAddress(evidence.collectorWallet)}</div></div>
                <div>
                  <div className="form-label">IPFS File</div>
                  <a href={`https://gateway.pinata.cloud/ipfs/${evidence.ipfsHash}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">Download from IPFS</a>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="form-label">Stored Blockchain Hash</div>
                <div className="hash-display">{evidence.fileHash}</div>
              </div>
            </div>

            {/* Re-hash verification */}
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>File Integrity Verification</h3>
              <p style={{ marginBottom: 16, fontSize: "0.9rem" }}>Download the file from IPFS, then upload it here to recompute its SHA-256 hash.</p>
              <div {...getRootProps()} className={`upload-zone`} style={{ padding: 24 }}>
                <input {...getInputProps()} />
                {reFile ? <div>📄 <strong>{reFile.name}</strong></div>
                  : <div><div style={{ fontSize: "1.5rem" }}>📁</div>Drop the evidence file to re-hash</div>}
              </div>
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={handleReHash} disabled={!reFile}>
                <Shield size={16} /> Recompute SHA-256 Hash
              </button>
            </div>

            {/* Tamper alert */}
            {computedHash && (
              <TamperAlert
                status={verified === true ? "VERIFIED" : verified === false ? "TAMPERED" : null}
                computedHash={computedHash}
                storedHash={evidence.fileHash}
              />
            )}

            {/* Submit Lab Report */}
            {verified !== null && (
              <div className="card">
                <h3 style={{ marginBottom: 16 }}>Submit Lab Report</h3>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Report File (optional — upload PDF)</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={e => setReportFile(e.target.files[0])}
                    style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }} />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Lab Notes</label>
                  <textarea className="form-textarea" value={reportNotes} onChange={e => setReportNotes(e.target.value)} placeholder="Describe findings…" />
                </div>
                <button className="btn btn-primary" onClick={handleSubmitReport} disabled={loading}>
                  {loading ? <><div className="spinner" /> Submitting…</> : <><CheckCircle size={16} /> Submit Report to Blockchain</>}
                </button>
              </div>
            )}

            {/* Chain of Custody */}
            <div className="card">
              <h3 style={{ marginBottom: 20 }}>Chain of Custody</h3>
              <ChainOfCustody onChainLogs={onChainLogs} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
