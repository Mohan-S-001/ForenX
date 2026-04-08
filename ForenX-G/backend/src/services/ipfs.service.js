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
    throw new Error(`IPFS upload failed: ${err.message}`);
  }
};

/**
 * Upload JSON metadata to IPFS
 */
const uploadJSON = async (jsonData, name = "metadata") => {
  try {
    const response = await axios.post(
      `${PINATA_BASE}/pinning/pinJSONToIPFS`,
      { pinataMetadata: { name }, pinataContent: jsonData },
      { headers: { "Content-Type": "application/json", ...getHeaders() } }
    );
    return response.data.IpfsHash;
  } catch (err) {
    throw new Error(`IPFS JSON upload failed: ${err.message}`);
  }
};

/**
 * Get IPFS gateway URL from CID
 */
const getIPFSUrl = (cid) => `https://gateway.pinata.cloud/ipfs/${cid}`;

module.exports = { uploadFile, uploadJSON, getIPFSUrl };
