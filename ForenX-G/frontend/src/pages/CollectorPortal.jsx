import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "../contexts/AuthContext";
import { useWeb3 } from "../contexts/Web3Context";
import { addEvidence } from "../services/blockchain";
import { hashFile, generateSealId, generateEvidenceId } from "../services/crypto";
import QRGenerator from "../components/QRGenerator";
import { Upload, FileCheck, Hash, Shield, QrCode, Check, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";

const STEPS = ["Upload File", "Hash & IPFS", "Seal & Sign", "Blockchain", "QR Codes"];

export default function CollectorPortal() {
  const { user } = useAuth();
  const { signer, connected, connect } = useWeb3();
  const navigate = useNavigate();

  const [step,     setStep]     = useState(0);
  const [file,     setFile]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [caseId,   setCaseId]   = useState("");
  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [sealId,   setSealId]   = useState(generateSealId());
  const [result,   setResult]   = useState(null);   // { fileHash, ipfsHash, txHash, evidenceId, innerQR, outerQR }

  const onDrop = useCallback((files) => {
    if (files[0]) { setFile(files[0]); setError(""); }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

  const handleProcess = async () => {
    if (!file || !caseId || !title) { setError("File, Case ID, and Title are required."); return; }
    if (!connected) { try { await connect(); } catch(e) { setError(e.message); return; } }
    setLoading(true); setError("");

    try {
      // Step 1: Hash file in browser
      setStep(1);
      const fileHash = await hashFile(file);
      toast.success("SHA-256 hash computed");

      // Step 2: Upload to IPFS via backend
      const formData = new FormData();
      formData.append("file", file);
      const { data: uploadData } = await API.post("/evidence/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!uploadData.success) throw new Error("IPFS upload failed");
      const ipfsHash = uploadData.ipfsHash;
      toast.success("File uploaded to IPFS");

      // Step 3: Sign with MetaMask
      setStep(2);
      const evidenceId = generateEvidenceId();
      const signPayload = JSON.stringify({ evidenceId, fileHash, ipfsHash, sealId });
      const digitalSignature = await signer.signMessage(signPayload);
      toast.success("Evidence signed with MetaMask");

      // Step 4 & 5: Save to backend MongoDB & Relayed Blockchain Execute
      setStep(3);
      const timestamp = new Date().toISOString();
      const innerQRData = { evidenceId, fileHash, ipfsHash, sealId, timestamp, digitalSignature };
      const outerQRData = { evidenceId, sealId, currentStage: "COLLECTED" };

      const { data: dbEntry } = await API.post("/evidence", {
        evidenceId, caseId, title, description: desc,
        fileHash, ipfsHash, sealId,
        fileName: file.name, fileSize: file.size, fileType: file.type,
        digitalSignature, innerQRData, outerQRData,
      });

      if (!dbEntry.success) throw new Error("Backend save failed");
      const txHash = dbEntry.txHash;

      setResult({ fileHash, ipfsHash, txHash, evidenceId, innerQRData, outerQRData });
      setStep(4);
      toast.success("Evidence recorded entirely gas-free!");
    } catch (err) {
      setError(err.message);
      toast.error("Process failed");
    } finally { setLoading(false); }
  };

  const STEP_ICONS = [<Upload />, <Hash />, <Shield />, <FileCheck />, <QrCode />];

  return (
    <div className="layout-with-sidebar">
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-title">Collector Portal</div>
          <Link to="/collector"  className="sidebar-link active"><Upload size={16} /> Submit Evidence</Link>
          <Link to="/evidence"   className="sidebar-link"><FileCheck size={16} /> My Evidence</Link>
          <Link to="/scan"       className="sidebar-link"><QrCode size={16} /> QR Scanner</Link>
        </div>
        <div className="sidebar-section" style={{ marginTop: "auto" }}>
          <div className="card" style={{ padding: 16, fontSize: "0.82rem" }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>📋 Logged in as</div>
            <div style={{ color: "var(--text-secondary)" }}>{user?.name}</div>
            <div className="badge badge-blue" style={{ marginTop: 8 }}>Collector</div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h1>📦 Submit Evidence</h1>
          <p>Upload, hash, seal, and register evidence on the blockchain</p>
        </div>

        {/* Steps */}
        <div className="steps" style={{ marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`step ${step === i ? "active" : step > i ? "done" : ""}`}>
                <div className="step-num">{step > i ? "✓" : i + 1}</div>
                <span className="step-label" style={{ display: i > 1 ? "none" : "block" }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="step-divider" />}
            </div>
          ))}
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}><AlertCircle size={16} />{error}</div>}

        {/* Result — QR Codes */}
        {result ? (
          <div>
            <div className="alert alert-success" style={{ marginBottom: 24 }}>
              <Check size={16} /> Evidence <strong>{result.evidenceId}</strong> successfully registered on blockchain!
            </div>
            <div className="grid-2" style={{ marginBottom: 24 }}>
              <div className="card text-center">
                <QRGenerator data={result.innerQRData} label="INNER QR (High Security)" filename={`inner_${result.evidenceId}`} />
                <p style={{ marginTop: 12, fontSize: "0.8rem" }}>Contains: evidenceId, fileHash, ipfsHash, signature</p>
              </div>
              <div className="card text-center">
                <QRGenerator data={result.outerQRData} label="OUTER QR (Tracking)" filename={`outer_${result.evidenceId}`} />
                <p style={{ marginTop: 12, fontSize: "0.8rem" }}>Contains: evidenceId, sealId, stage</p>
              </div>
            </div>
            <div className="card" style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 12 }}>Evidence Details</h4>
              <div className="grid-2">
                <div><div className="form-label">Evidence ID</div><div className="hash-display">{result.evidenceId}</div></div>
                <div><div className="form-label">Seal ID</div><div className="hash-display">{sealId}</div></div>
                <div><div className="form-label">IPFS CID</div><div className="hash-display">{result.ipfsHash}</div></div>
                <div><div className="form-label">TX Hash</div><div className="hash-display">{result.txHash || "N/A"}</div></div>
              </div>
              <div style={{ marginTop: 12 }}><div className="form-label">SHA-256 File Hash</div><div className="hash-display">{result.fileHash}</div></div>
            </div>
            <button className="btn btn-primary" onClick={() => { setResult(null); setStep(0); setFile(null); setTitle(""); setDesc(""); setSealId(generateSealId()); }}>
              Submit Another Evidence
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Case + Title */}
            <div className="card">
              <h3 style={{ marginBottom: 20 }}>Evidence Information</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Case ID *</label>
                  <input className="form-input" placeholder="e.g. CASE-1234-ABCD" value={caseId} onChange={e => setCaseId(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Evidence Title *</label>
                  <input className="form-input" placeholder="e.g. Crime Scene Photo #1" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" placeholder="Details about the evidence…" value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
              </div>
            </div>

            {/* File upload */}
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Evidence File</h3>
              <div {...getRootProps()} className={`upload-zone ${isDragActive ? "drag-over" : ""}`}>
                <input {...getInputProps()} />
                {file ? (
                  <div>
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📄</div>
                    <strong>{file.name}</strong>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>
                      {(file.size / 1024).toFixed(1)} KB — {file.type || "unknown type"}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="upload-icon">⬆️</div>
                    <strong>Drop file here</strong>
                    <p style={{ fontSize: "0.85rem", marginTop: 4 }}>or click to browse (image, video, PDF)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Seal ID */}
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Tamper-Proof Seal</h3>
              <div className="form-group">
                <label className="form-label">Seal ID (auto-generated or enter manually)</label>
                <div className="flex gap-2">
                  <input className="form-input" value={sealId} onChange={e => setSealId(e.target.value)} />
                  <button className="btn btn-secondary" onClick={() => setSealId(generateSealId())}>🔄 Generate</button>
                </div>
                <span className="form-hint">Attach this ID to the physical evidence package.</span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleProcess}
              disabled={loading || !file || !caseId || !title}
            >
              {loading
                ? <><div className="spinner" /> {STEPS[step]}…</>
                : <><Shield size={18} /> Submit Evidence to Blockchain</>}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
