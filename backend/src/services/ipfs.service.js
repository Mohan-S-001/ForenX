const axios     = require("axios");
const FormData  = require("form-data");
const fs        = require("fs");

const PINATA_BASE = "https://api.pinata.cloud";

const getHeaders = () => ({
  pinata_api_key:    process.env.PINATA_API_KEY,
  pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
});

/**
 * Upload a file buffer to IPFS via Pinata
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @returns {Promise<string>} IPFS CID
 */
const uploadFile = async (fileBuffer, fileName) => {
  if (!process.env.PINATA_API_KEY) {
    console.warn("⚠️ IPFS Mock: No Pinata keys found. Simulating IPFS upload.");
    return `mock-cid-file-${Math.random().toString(36).substring(7)}`;
  }
  try {
    const formData = new FormData();
    formData.append("file", fileBuffer, { filename: fileName });
    formData.append("pinataMetadata", JSON.stringify({ name: fileName }));
    formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const response = await axios.post(`${PINATA_BASE}/pinning/pinFileToIPFS`, formData, {
      headers: { ...formData.getHeaders(), ...getHeaders() },
      maxBodyLength: Infinity,
    });
    return response.data.IpfsHash;
  } catch (err) {
    console.warn(`IPFS upload failed (${err.message}). Falling back to MOCK CID.`);
    return `mock-cid-file-${Math.random().toString(36).substring(7)}`;
  }
};

/**
 * Upload JSON metadata to IPFS
 */
const uploadJSON = async (jsonData, name = "metadata") => {
  if (!process.env.PINATA_API_KEY) {
    return `mock-cid-json-${Math.random().toString(36).substring(7)}`;
  }
  try {
    const response = await axios.post(
      `${PINATA_BASE}/pinning/pinJSONToIPFS`,
      { pinataMetadata: { name }, pinataContent: jsonData },
      { headers: { "Content-Type": "application/json", ...getHeaders() } }
    );
    return response.data.IpfsHash;
  } catch (err) {
    return `mock-cid-json-${Math.random().toString(36).substring(7)}`;
  }
};

/**
 * Get IPFS gateway URL from CID
 */
const getIPFSUrl = (cid) => `https://gateway.pinata.cloud/ipfs/${cid}`;

module.exports = { uploadFile, uploadJSON, getIPFSUrl };
