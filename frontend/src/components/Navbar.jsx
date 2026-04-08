import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWeb3 } from "../contexts/Web3Context";
import { ShieldCheck, LogOut, Wallet, Menu } from "lucide-react";
import { shortAddress } from "../services/crypto";

const ROLE_PORTALS = {
  admin:     "/admin",
  collector: "/collector",
  transport: "/transport",
  lab:       "/lab",
  police:    "/police",
  judicial:  "/judicial",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { account, connected, connect } = useWeb3();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to={user ? ROLE_PORTALS[user.role] : "/"} className="navbar-logo" style={{ textDecoration: "none" }}>
          <ShieldCheck size={24} style={{ color: "#3b82f6" }} />
          <span>ForenX</span>
        </Link>

        {/* Nav links */}
        <div className="navbar-links">
          {user && (
            <Link
              to={ROLE_PORTALS[user.role] || "/"}
              className={`navbar-link ${location.pathname.startsWith(ROLE_PORTALS[user.role]) ? "active" : ""}`}
            >
              Dashboard
            </Link>
          )}
          {user && ["collector","transport","lab","police","judicial"].includes(user.role) && (
            <Link to="/scan" className={`navbar-link ${location.pathname === "/scan" ? "active" : ""}`}>
              QR Scanner
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Wallet */}
          {connected ? (
            <div className="badge badge-blue" style={{ gap: 6 }}>
              <Wallet size={12} />
              {shortAddress(account)}
            </div>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={connect}>
              <Wallet size={14} /> Connect Wallet
            </button>
          )}

          {/* User info */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="badge badge-purple" style={{ textTransform: "capitalize" }}>
                {user.role}
              </div>
              <span className="navbar-link" style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                {user.name}
              </span>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={handleLogout} title="Logout">
                <LogOut size={14} />
              </button>
            </div>
          )}

          {!user && (
            <div className="flex gap-2">
              <Link to="/login"    className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
