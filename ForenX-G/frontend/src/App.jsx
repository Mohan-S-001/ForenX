import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Web3Provider } from "./contexts/Web3Context";

import Navbar          from "./components/Navbar";
import Landing         from "./pages/Landing";
import Register        from "./pages/Register";
import Login           from "./pages/Login";
import KYCPage         from "./pages/KYCPage";
import AdminDashboard  from "./pages/AdminDashboard";
import CollectorPortal from "./pages/CollectorPortal";
import TransportPortal from "./pages/TransportPortal";
import LabPortal       from "./pages/LabPortal";
import PolicePortal    from "./pages/PolicePortal";
import JudicialPortal  from "./pages/JudicialPortal";
import QRScanPage      from "./pages/QRScanPage";

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-overlay" style={{ height: "100vh" }}>
      <div className="spinner spinner-lg" />
      <p>Loading…</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.kycStatus !== "approved" && user.role !== "admin") return <Navigate to="/kyc" replace />;
  if (roles.length > 0 && !roles.includes(user.role)) return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card text-center" style={{ maxWidth: 400, padding: 40 }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🚫</div>
        <h2>Access Denied</h2>
        <p style={{ marginTop: 8 }}>You need the <strong>{roles.join(" or ")}</strong> role to access this portal.</p>
      </div>
    </div>
  );
  return children;
}

// ─── KYC Guard ────────────────────────────────────────────────────────────────
function KYCGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ─── App Layout ───────────────────────────────────────────────────────────────
function AppLayout() {
  return (
    <>
      <Navbar />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#111827", color: "#f0f4ff", border: "1px solid rgba(99,179,237,0.2)" },
          duration: 4000,
        }}
      />
      <Routes>
        <Route path="/"        element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login"    element={<Login />} />

        <Route path="/kyc" element={<KYCGuard><KYCPage /></KYCGuard>} />

        <Route path="/admin"     element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/collector" element={<ProtectedRoute roles={["collector","admin"]}><CollectorPortal /></ProtectedRoute>} />
        <Route path="/transport" element={<ProtectedRoute roles={["transport","admin"]}><TransportPortal /></ProtectedRoute>} />
        <Route path="/lab"       element={<ProtectedRoute roles={["lab","admin"]}><LabPortal /></ProtectedRoute>} />
        <Route path="/police"    element={<ProtectedRoute roles={["police","admin"]}><PolicePortal /></ProtectedRoute>} />
        <Route path="/judicial"  element={<ProtectedRoute roles={["judicial","admin"]}><JudicialPortal /></ProtectedRoute>} />
        <Route path="/scan"      element={<ProtectedRoute><QRScanPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Web3Provider>
          <AppLayout />
        </Web3Provider>
      </AuthProvider>
    </BrowserRouter>
  );
}
