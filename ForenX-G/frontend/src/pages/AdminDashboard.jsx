import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "../contexts/AuthContext";
import { Users, FileText, CheckCircle, XCircle, Clock, BarChart3, Shield } from "lucide-react";
import { shortAddress, formatDate } from "../services/crypto";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats,     setStats]     = useState(null);
  const [kycUsers,  setKycUsers]  = useState([]);
  const [allUsers,  setAllUsers]  = useState([]);
  const [tab,       setTab]       = useState("overview");
  const [loading,   setLoading]   = useState(true);

  const loadStats = async () => {
    try {
      const [s, k] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/kyc/pending"),
      ]);
      setStats(s.data.stats);
      setKycUsers(k.data.users);
    } catch {}
  };

  const loadUsers = async () => {
    try {
      const r = await API.get("/admin/users");
      setAllUsers(r.data.users);
    } catch {}
  };

  useEffect(() => {
    loadStats().finally(() => setLoading(false));
    loadUsers();
  }, []);

  const handleKYC = async (userId, action, reason = "") => {
    try {
      if (action === "approve") await API.patch(`/kyc/${userId}/approve`);
      else await API.patch(`/kyc/${userId}/reject`, { reason: reason || "Insufficient documentation" });
      toast.success(`KYC ${action}d`);
      loadStats(); loadUsers();
    } catch (err) { toast.error(err.response?.data?.message || "Action failed"); }
  };

  const TABS = [
    { id: "overview", label: "Overview",     icon: <BarChart3 size={16} /> },
    { id: "kyc",      label: `KYC Review (${kycUsers.length})`, icon: <Shield size={16} /> },
    { id: "users",    label: "All Users",    icon: <Users size={16} /> },
  ];

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg" /><p>Loading dashboard…</p></div>;

  return (
    <div className="layout-with-sidebar">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-title">Admin Panel</div>
          {TABS.map(t => (
            <div key={t.id} className={`sidebar-link ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </div>
          ))}
        </div>
        <div className="sidebar-section">
          <div className="sidebar-title">Quick Links</div>
          <Link to="/evidence" className="sidebar-link"><FileText size={16} /> Evidence List</Link>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="page-header">
          <h1>🛡️ Admin Dashboard</h1>
          <p>Manage users, KYC approvals, and system overview</p>
        </div>

        {/* Overview */}
        {tab === "overview" && stats && (
          <>
            <div className="grid-4" style={{ marginBottom: 32 }}>
              <div className="stat-card blue"><div className="stat-value">{stats.users}</div><div className="stat-label">Total Users</div></div>
              <div className="stat-card yellow"><div className="stat-value">{stats.pendingKYC}</div><div className="stat-label">Pending KYC</div></div>
              <div className="stat-card purple"><div className="stat-value">{stats.totalEvidence}</div><div className="stat-label">Total Evidence</div></div>
              <div className="stat-card green"><div className="stat-value">{stats.totalCases}</div><div className="stat-label">Total Cases</div></div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Evidence by Status</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {stats.evidenceByStatus?.map(s => (
                  <div key={s._id} className="badge badge-blue">{s._id}: {s.count}</div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* KYC */}
        {tab === "kyc" && (
          <div>
            <h3 style={{ marginBottom: 20 }}>Pending KYC Applications</h3>
            {kycUsers.length === 0 ? (
              <div className="card text-center"><p style={{ padding: 32 }}>No pending KYC applications.</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {kycUsers.map(u => (
                  <div key={u._id} className="card">
                    <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                      <div>
                        <h4 style={{ marginBottom: 4 }}>{u.name}</h4>
                        <div className="mono" style={{ fontSize: "0.78rem" }}>{u.walletAddress}</div>
                      </div>
                      <span className="badge badge-purple" style={{ textTransform: "capitalize" }}>{u.role}</span>
                    </div>
                    <div className="grid-2" style={{ marginBottom: 16 }}>
                      <div>
                        <div className="form-label">ID Proof (IPFS)</div>
                        {u.idProofCID
                          ? <a href={`https://gateway.pinata.cloud/ipfs/${u.idProofCID}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">View Document</a>
                          : <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Not uploaded</span>}
                      </div>
                      <div>
                        <div className="form-label">Selfie (IPFS)</div>
                        {u.selfieCID
                          ? <a href={`https://gateway.pinata.cloud/ipfs/${u.selfieCID}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">View Selfie</a>
                          : <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Not uploaded</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-success btn-sm" onClick={() => handleKYC(u._id, "approve")}>
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => {
                        const reason = prompt("Rejection reason:");
                        if (reason !== null) handleKYC(u._id, "reject", reason);
                      }}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Users */}
        {tab === "users" && (
          <div>
            <h3 style={{ marginBottom: 20 }}>All Users ({allUsers.length})</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Wallet</th><th>Role</th><th>KYC Status</th><th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(u => (
                    <tr key={u._id}>
                      <td><strong>{u.name}</strong></td>
                      <td><span className="mono">{shortAddress(u.walletAddress)}</span></td>
                      <td><span className="badge badge-purple" style={{ textTransform: "capitalize" }}>{u.role}</span></td>
                      <td>
                        <span className={`badge badge-${u.kycStatus === "approved" ? "green" : u.kycStatus === "rejected" ? "red" : "yellow"}`}>
                          {u.kycStatus}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.82rem" }}>{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
