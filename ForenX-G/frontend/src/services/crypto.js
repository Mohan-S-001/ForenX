// SHA-256 hash a file using the browser's SubtleCrypto API
export const hashFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

// Generate a random seal ID
export const generateSealId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const seg   = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `SEAL-${seg(4)}-${seg(4)}-${seg(4)}`;
};

// Generate a unique evidence ID
export const generateEvidenceId = () => {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `EVD-${ts}-${rnd}`;
};

// Short-form wallet address
export const shortAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "—";

// Format timestamp
export const formatDate = (ts) => {
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleString();
};

export const statusColor = (status) => {
  const map = {
    COLLECTED: "blue", IN_TRANSIT: "yellow", AT_LAB: "purple",
    VERIFIED: "green", TAMPERED: "red", AT_POLICE: "blue",
    JUDICIAL_REVIEW: "purple", CLOSED: "gray",
  };
  return map[status] || "gray";
};

// Route IPFS CIDs through our local backend gateway to handle MOCK CIDs gracefully
export const getIPFSUrl = (cid) => {
  if (!cid) return "#";
  return `http://localhost:5001/api/ipfs/${cid}`;
};

