import { useState, useEffect } from "react";
import { useAuth, API } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import ChainOfCustody from "../components/ChainOfCustody";
import EvidenceCard from "../components/EvidenceCard";
import { ShieldCheck, FileText, CheckCircle, XCircle, Search } from "lucide-react";
import { formatDate } from "../services/crypto";
import toast from "react-hot-toast";

export default function PolicePortal() {
  const { user } = useAuth();
  const [cases,    setCases]    = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab,      setTab]      = useState("cases");
  const [loading,  setLoading]  = useState(true);
  const [decision, setDecision] = useState("");
  const [notes,    setNotes]    = useState("");
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    Promise.all([
      API.get("/cases").then(r => setCases(r.data.items || [])),
      API.get("/evidence").then(r => setEvidence(r.data.items || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const handleDecision = async (evidenceId) => {
    if (!decision) { toast.error("Select a decision"); return; }
    try {
      await API.patch(`/evidence/${evidenceId}/police-decision`, { decision, notes });
      toast.success(`Evidence ${decision}`);
      const r = await API.get("/evidence");
      setEvidence(r.data.items || []);
      setSelected(null); setDecision(""); setNotes("");
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
  };

  const filtered = evidence.filter(e =>
    !search || e.evidenceId.includes(search) || e.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>;

  return (
    <div className="layout-with-sidebar">
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-title">Police Portal</div>
          <div className={`sidebar-link ${tab === "cases" ? "active" : ""}`} onClick={() => setTab("cases")}><FileText size={16} /> Cases</div>
          <div className={`sidebar-link ${tab === "evidence" ? "active" : ""}`} onClick={() => setTab("evidence")}><ShieldCheck size={16} /> Evidence Review</div>
        </div>
        <div className="sidebar-section">
          <div className="card" style={{ padding: 16, fontSize: "0.82rem" }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>👮 Police Inspector</div>
            <div style={{ color: "var(--text-secondary)" }}>{user?.name}</div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h1>👮 Police Inspector Portal</h1>
          <p>Review evidence, access lab reports, approve or reject for prosecution</p>
        </div>

        {/* Cases */}
        {tab === "cases" && (
          <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
              <h3>Assigned Cases ({cases.length})</h3>
              <Link to="/cases/new" className="btn btn-primary btn-sm">+ New Case</Link>
            </div>
            {cases.length === 0 ? (
              <div className="card text-center"><p style={{ padding: 32 }}>No cases assigned yet.</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {cases.map(c => (
                  <div key={c._id} className="card">
                    <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                      <h4>{c.title}</h4>
                      <span className={`badge badge-${c.status === "open" ? "green" : c.status === "closed" ? "gray" : "yellow"}`}>{c.status}</span>
                    </div>
                    <div className="grid-2" style={{ gap: 8, fontSize: "0.85rem" }}>
                      <div><span style={{ color: "var(--text-muted)" }}>Case ID:</span> {c.caseId}</div>
                      <div><span style={{ color: "var(--text-muted)" }}>Evidence:</span> {c.evidenceCount}</div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <Link to={`/evidence?caseId=${c.caseId}`} className="btn btn-secondary btn-sm">View Evidence</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Evidence Review */}
        {tab === "evidence" && (
          <div>
            <div className="flex gap-2" style={{ marginBottom: 20 }}>
              <input className="form-input" placeholder="Search evidence…" value={search} onChange={e => setSearch(e.target.value)} />
              <button className="btn btn-secondary"><Search size={16} /></button>
            </div>

            {selected ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <button className="btn btn-secondary btn-sm" style={{ width: "fit-content" }} onClick={() => setSelected(null)}>← Back</button>

                <div className="card">
                  <h3 style={{ marginBottom: 16 }}>Evidence: {selected.title}</h3>
                  <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
                    <div><div className="form-label">Status</div>
                      <span className={`badge badge-${selected.status === "VERIFIED" ? "green" : selected.status === "TAMPERED" ? "red" : "yellow"}`}>{selected.status}</span>
                    </div>
                    <div><div className="form-label">Case</div>{selected.caseId}</div>
                  </div>
                  <div><div className="form-label">File Hash</div><div className="hash-display">{selected.fileHash}</div></div>
                  {selected.labReport?.verifiedBy && (
                    <div style={{ marginTop: 12 }}>
                      <div className="form-label">Lab Report</div>
                      <div className={`alert ${selected.labReport.tampered ? "alert-danger" : "alert-success"}`} style={{ marginTop: 6 }}>
                        {selected.labReport.tampered ? "🚨 Tampered" : "✅ Verified"} — {selected.labReport.notes || "No notes"}
                        {selected.labReport.reportIpfsHash && (
                          <a href={`https://gateway.pinata.cloud/ipfs/${selected.labReport.reportIpfsHash}`} target="_blank" rel="noreferrer" style={{ marginLeft: 12 }} className="btn btn-secondary btn-sm">View Report</a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card">
                  <h3 style={{ marginBottom: 16 }}>Police Decision</h3>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Decision</label>
                    <div className="flex gap-3">
                      {["approved", "rejected"].map(d => (
                        <div key={d} onClick={() => setDecision(d)} style={{
                          padding: "10px 20px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                          border: `1px solid ${decision === d ? "var(--accent-blue)" : "var(--border)"}`,
                          background: decision === d ? "rgba(59,130,246,0.1)" : "var(--bg-secondary)",
                          textTransform: "capitalize", fontWeight: 600,
                        }}>
                          {d === "approved" ? "✅" : "❌"} {d}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Notes</label>
                    <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Remarks…" style={{ minHeight: 70 }} />
                  </div>
                  <button className="btn btn-primary" onClick={() => handleDecision(selected.evidenceId)} disabled={!decision}>
                    <CheckCircle size={16} /> Submit Decision
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid-3">
                {filtered.map(e => (
                  <div key={e._id} onClick={() => setSelected(e)} style={{ cursor: "pointer" }}>
                    <EvidenceCard evidence={e} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
