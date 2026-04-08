import { useState, useEffect } from "react";
import { useAuth, API } from "../contexts/AuthContext";
import { useWeb3 } from "../contexts/Web3Context";
import { getEvidence, getTransferLogs } from "../services/blockchain";
import ChainOfCustody from "../components/ChainOfCustody";
import EvidenceCard from "../components/EvidenceCard";
import TamperAlert from "../components/TamperAlert";
import { Scale, FileText, Search, Download } from "lucide-react";
import { formatDate } from "../services/crypto";
import toast from "react-hot-toast";
import QRCode from "qrcode";

export default function JudicialPortal() {
  const { user } = useAuth();
  const { provider } = useWeb3();
  const [evidence,    setEvidence]    = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [onChainData, setOnChainData] = useState(null);
  const [onChainLogs, setOnChainLogs] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [decision,    setDecision]    = useState("");
  const [notes,       setNotes]       = useState("");

  useEffect(() => {
    API.get("/evidence").then(r => setEvidence(r.data.items || [])).finally(() => setLoading(false));
  }, []);

  const loadOnChain = async (ev) => {
    if (!provider) return;
    try {
      const data = await getEvidence(provider, ev.evidenceId);
      setOnChainData(data);
      const logs = await getTransferLogs(provider, ev.evidenceId);
      setOnChainLogs([...logs]);
    } catch {}
  };

  const handleSelect = (ev) => {
    setSelected(ev);
    setDecision(""); setNotes("");
    loadOnChain(ev);
  };

  const handleDecision = async () => {
    if (!selected || !decision) { toast.error("Select a verdict first"); return; }
    try {
      await API.patch(`/evidence/${selected.evidenceId}/judicial-decision`, { decision, notes });
      toast.success(`Case verdict: ${decision}`);
      const r = await API.get("/evidence");
      setEvidence(r.data.items || []);
      setSelected(null);
    } catch (err) { toast.error(err.message); }
  };

  const handlePrintReport = async () => {
    if (!selected) return;
    // Generate report QR
    const reportData = {
      evidenceId:   selected.evidenceId,
      caseId:       selected.caseId,
      title:        selected.title,
      fileHash:     selected.fileHash,
      status:       selected.status,
      verdict:      decision || selected.judicialDecision?.decision,
      verifiedBy:   user.walletAddress,
      timestamp:    new Date().toISOString(),
    };
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(reportData), { width: 200 });
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>ForenX Judicial Report</title>
      <style>body{font-family:monospace;padding:40px;background:#fff;color:#000}
      table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:8px;text-align:left}
      </style></head><body>
      <h1>🏛️ ForenX — Judicial Verification Report</h1>
      <img src="${qrDataUrl}" /><br/>
      <table>
        <tr><th>Field</th><th>Value</th></tr>
        <tr><td>Evidence ID</td><td>${selected.evidenceId}</td></tr>
        <tr><td>Case ID</td><td>${selected.caseId}</td></tr>
        <tr><td>Title</td><td>${selected.title}</td></tr>
        <tr><td>Status</td><td>${selected.status}</td></tr>
        <tr><td>SHA-256 Hash</td><td style="font-size:11px">${selected.fileHash}</td></tr>
        <tr><td>Collector</td><td>${selected.collectorWallet}</td></tr>
        <tr><td>Verdict</td><td><strong>${decision || selected.judicialDecision?.decision || "Pending"}</strong></td></tr>
        <tr><td>Judicial Notes</td><td>${notes || selected.judicialDecision?.notes || "—"}</td></tr>
        <tr><td>Generated</td><td>${new Date().toISOString()}</td></tr>
      </table>
      <script>window.print();</script></body></html>
    `);
  };

  const filtered = evidence.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.evidenceId.includes(search)
  );

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>;

  return (
    <div className="layout-with-sidebar">
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-title">Judicial Portal</div>
          <div className="sidebar-link active"><Scale size={16} /> Evidence Review</div>
        </div>
        <div className="sidebar-section">
          <div className="card" style={{ padding: 16, fontSize: "0.82rem" }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>⚖️ Judicial Authority</div>
            <div style={{ color: "var(--text-secondary)" }}>{user?.name}</div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h1>⚖️ Judicial Authority Portal</h1>
          <p>View full audit trail, verify integrity, and make case verdicts</p>
        </div>

        {!selected ? (
          <>
            <div className="flex gap-2" style={{ marginBottom: 20 }}>
              <input className="form-input" placeholder="Search evidence…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="grid-3">
              {filtered.map(e => (
                <div key={e._id} onClick={() => handleSelect(e)} style={{ cursor: "pointer" }}>
                  <EvidenceCard evidence={e} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <button className="btn btn-secondary btn-sm" style={{ width: "fit-content" }} onClick={() => setSelected(null)}>← Back</button>

            {/* Evidence detail */}
            <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                <h3>{selected.title}</h3>
                <span className={`badge badge-${selected.status === "VERIFIED" ? "green" : selected.status === "TAMPERED" ? "red" : "yellow"}`}>
                  {selected.status}
                </span>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div><div className="form-label">Evidence ID</div><div className="mono" style={{ fontSize: "0.78rem" }}>{selected.evidenceId}</div></div>
                <div><div className="form-label">Case ID</div>{selected.caseId}</div>
                <div><div className="form-label">Collector</div><div className="mono" style={{ fontSize: "0.78rem" }}>{selected.collectorWallet}</div></div>
                <div><div className="form-label">Seal ID</div><div className="mono" style={{ fontSize: "0.78rem" }}>{selected.sealId}</div></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="form-label">SHA-256 Hash</div>
                <div className="hash-display">{selected.fileHash}</div>
              </div>
              {selected.ipfsHash && (
                <div style={{ marginTop: 12 }}>
                  <a href={`https://gateway.pinata.cloud/ipfs/${selected.ipfsHash}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    <Download size={14} /> Download Evidence File (IPFS)
                  </a>
                </div>
              )}
            </div>

            {/* Blockchain integrity */}
            {onChainData && (
              <TamperAlert
                status={Number(onChainData.status) === 3 ? "VERIFIED" : Number(onChainData.status) === 4 ? "TAMPERED" : null}
              />
            )}

            {/* Lab report */}
            {selected.labReport?.verifiedBy && (
              <div className="card">
                <h3 style={{ marginBottom: 12 }}>Lab Report</h3>
                <div className={`alert ${selected.labReport.tampered ? "alert-danger" : "alert-success"}`} style={{ marginBottom: 12 }}>
                  {selected.labReport.tampered ? "🚨 TAMPERED" : "✅ VERIFIED BY LAB"} — {selected.labReport.notes}
                </div>
                {selected.labReport.reportIpfsHash && (
                  <a href={`https://gateway.pinata.cloud/ipfs/${selected.labReport.reportIpfsHash}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    View Lab Report (IPFS)
                  </a>
                )}
              </div>
            )}

            {/* Full audit trail */}
            <div className="card">
              <h3 style={{ marginBottom: 20 }}>Complete Chain of Custody</h3>
              <ChainOfCustody onChainLogs={onChainLogs} />
            </div>

            {/* Judicial verdict */}
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Judicial Verdict</h3>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Verdict</label>
                <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                  {[
                    { v: "admitted",      label: "✅ Admitted",      color: "green" },
                    { v: "rejected",      label: "❌ Rejected",      color: "red" },
                    { v: "inconclusive",  label: "⚠️ Inconclusive",  color: "yellow" },
                  ].map(d => (
                    <div key={d.v} onClick={() => setDecision(d.v)} style={{
                      padding: "10px 20px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                      border: `1px solid ${decision === d.v ? "var(--accent-blue)" : "var(--border)"}`,
                      background: decision === d.v ? "rgba(59,130,246,0.1)" : "var(--bg-secondary)",
                      fontWeight: 600, fontSize: "0.9rem",
                    }}>
                      {d.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Judicial Notes</label>
                <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Legal reasoning, observations…" />
              </div>
              <div className="flex gap-3">
                <button className="btn btn-primary" onClick={handleDecision} disabled={!decision}>
                  <Scale size={16} /> Submit Verdict
                </button>
                <button className="btn btn-secondary" onClick={handlePrintReport}>
                  <Download size={16} /> Print Report
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
