import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "../contexts/AuthContext";
import { ShieldCheck, Upload, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";

export default function KYCPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [step, setStep] = useState(user?.kycStatus === "pending" ? 1 : 0);
  const [idProof, setIdProof] = useState(null);
  const [selfie,  setSelfie]  = useState(null);
  const [loading, setLoading] = useState(false);

  const idDrop  = useDropzone({ onDrop: f => setIdProof(f[0]), accept: { "image/*": [], "application/pdf": [] }, maxFiles: 1 });
  const selfDrop = useDropzone({ onDrop: f => setSelfie(f[0]),  accept: { "image/*": [] }, maxFiles: 1 });

  const handleSubmit = async () => {
    if (!idProof || !selfie) { toast.error("Both ID and selfie are required"); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("idProof", idProof);
      form.append("selfie",  selfie);
      await API.post("/kyc/submit", form, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("KYC submitted! Awaiting admin review.");
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  };

  if (user?.kycStatus === "approved") {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card text-center" style={{ maxWidth: 400, padding: 48 }}>
          <CheckCircle size={56} style={{ color: "var(--accent-green)", marginBottom: 16 }} />
          <h2 style={{ marginBottom: 8 }}>KYC Approved ✅</h2>
          <p style={{ marginBottom: 24 }}>Your identity has been verified. You have full access.</p>
          <button className="btn btn-primary btn-full" onClick={() => navigate(-1)}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div className="text-center" style={{ marginBottom: 32 }}>
          <ShieldCheck size={40} style={{ color: "var(--accent-blue)", marginBottom: 12 }} />
          <h1 style={{ fontSize: "1.8rem", marginBottom: 8 }}>KYC Verification</h1>
          <p>Upload your ID and selfie to get verified. Files are stored on IPFS.</p>
        </div>

        {user?.kycStatus === "rejected" && (
          <div className="alert alert-danger" style={{ marginBottom: 24 }}>
            ❌ KYC Rejected: {user?.kycRejectionReason || "Please re-submit with valid documents."}
          </div>
        )}

        {step === 1 ? (
          <div className="card text-center" style={{ padding: 40 }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>⏳</div>
            <h3 style={{ marginBottom: 12 }}>Verification Pending</h3>
            <p style={{ marginBottom: 24 }}>Your KYC documents have been submitted and are under admin review. You'll be notified once approved.</p>
            <div className="badge badge-yellow" style={{ display: "inline-flex" }}>Pending Admin Review</div>
          </div>
        ) : (
          <div className="card-glass" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
            {/* ID Proof */}
            <div>
              <div className="form-label" style={{ marginBottom: 8 }}>Government-Issued ID *</div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 12 }}>
                Aadhar, Passport, Driving License, or Officer ID
              </p>
              <div {...idDrop.getRootProps()} className={`upload-zone ${idDrop.isDragActive ? "drag-over" : ""}`}>
                <input {...idDrop.getInputProps()} />
                {idProof
                  ? <div>📄 <strong>{idProof.name}</strong><br /><span style={{ color: "var(--accent-green)", fontSize: "0.82rem" }}>✓ Selected</span></div>
                  : <div><div style={{ fontSize: "2rem" }}>🪪</div>Drop ID document or click to browse</div>}
              </div>
            </div>

            {/* Selfie */}
            <div>
              <div className="form-label" style={{ marginBottom: 8 }}>Live Selfie *</div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 12 }}>
                Take a clear photo of yourself holding your ID
              </p>
              <div {...selfDrop.getRootProps()} className={`upload-zone ${selfDrop.isDragActive ? "drag-over" : ""}`}>
                <input {...selfDrop.getInputProps()} />
                {selfie
                  ? <div>🤳 <strong>{selfie.name}</strong><br /><span style={{ color: "var(--accent-green)", fontSize: "0.82rem" }}>✓ Selected</span></div>
                  : <div><div style={{ fontSize: "2rem" }}>📷</div>Drop selfie photo or click to browse</div>}
              </div>
            </div>

            <div className="alert alert-info" style={{ fontSize: "0.82rem" }}>
              🔐 Documents are encrypted and stored on IPFS — only accessible to admins via CID hash.
            </div>

            <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading || !idProof || !selfie}>
              {loading ? <><div className="spinner" /> Uploading to IPFS…</> : <><Upload size={16} /> Submit KYC</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
