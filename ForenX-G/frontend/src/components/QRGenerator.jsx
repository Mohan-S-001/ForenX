import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Copy, Check } from "lucide-react";

export default function QRGenerator({ data, label = "QR Code", filename = "qr" }) {
  const canvasRef = useRef(null);
  const [copied, setCopied]   = useState(false);
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    if (!data) return;
    const jsonStr = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    QRCode.toCanvas(canvasRef.current, jsonStr, {
      width: 220,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "H",
    });
    QRCode.toDataURL(jsonStr, { width: 220, margin: 2, errorCorrectionLevel: "H" })
      .then(setDataUrl);
  }, [data]);

  const handleCopy = () => {
    const jsonStr = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${filename}_${Date.now()}.png`;
    a.click();
  };

  if (!data) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div className="qr-label">{label}</div>
      <div className="qr-box">
        <canvas ref={canvasRef} />
      </div>
      <div className="flex gap-2">
        <button className="btn btn-secondary btn-sm" onClick={handleDownload}>
          <Download size={14} /> Download
        </button>
        <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy JSON</>}
        </button>
      </div>
    </div>
  );
}
