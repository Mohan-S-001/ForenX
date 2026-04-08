import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw } from "lucide-react";

export default function QRScanner({ onScan, onError }) {
  const scannerRef  = useRef(null);
  const [active,    setActive]   = useState(false);
  const [scanned,   setScanned]  = useState(null);
  const [error,     setError]    = useState("");
  const instanceRef = useRef(null);
  const divId       = "qr-reader-div";

  const startScanner = async () => {
    setError("");
    setScanned(null);
    try {
      const scanner = new Html5Qrcode(divId);
      instanceRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopScanner();
          let parsed;
          try { parsed = JSON.parse(decodedText); }
          catch { parsed = { raw: decodedText }; }
          setScanned(parsed);
          onScan && onScan(parsed);
        },
        (err) => {}
      );
      setActive(true);
    } catch (err) {
      setError("Camera access denied or not available.");
      onError && onError(err.message);
    }
  };

  const stopScanner = async () => {
    if (instanceRef.current) {
      try { await instanceRef.current.stop(); } catch {}
      instanceRef.current = null;
    }
    setActive(false);
  };

  useEffect(() => () => stopScanner(), []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {/* Scanner viewport */}
      <div
        id={divId}
        style={{
          width: "100%", maxWidth: 400,
          minHeight: active ? 300 : 0,
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: active ? "2px solid var(--accent-blue)" : "none",
          transition: "all 0.3s",
        }}
      />

      {!active && !scanned && (
        <div className="card" style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
          <Camera size={48} style={{ color: "var(--accent-blue)", marginBottom: 12 }} />
          <p style={{ marginBottom: 16 }}>Activate camera to scan a QR code</p>
          <button className="btn btn-primary btn-full" onClick={startScanner}>
            <Camera size={16} /> Start QR Scanner
          </button>
        </div>
      )}

      {active && (
        <button className="btn btn-danger btn-sm" onClick={stopScanner}>
          <CameraOff size={14} /> Stop Scanner
        </button>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {scanned && (
        <div className="card" style={{ width: "100%", maxWidth: 500 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
            <h4 style={{ color: "var(--accent-green)" }}>✅ QR Scanned</h4>
            <button className="btn btn-secondary btn-sm" onClick={() => { setScanned(null); startScanner(); }}>
              <RefreshCw size={12} /> Scan Again
            </button>
          </div>
          <pre className="hash-display" style={{ whiteSpace: "pre-wrap", fontSize: "0.78rem" }}>
            {JSON.stringify(scanned, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
