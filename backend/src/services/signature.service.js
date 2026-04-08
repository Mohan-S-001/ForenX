const { ethers } = require("ethers");

/**
 * Verify a MetaMask-signed message
 * @param {string} message  - original message that was signed
 * @param {string} signature
 * @returns {string} recovered wallet address (lowercase)
 */
const verifySignature = (message, signature) => {
  try {
    const recovered = ethers.verifyMessage(message, signature);
    return recovered.toLowerCase();
  } catch (err) {
    throw new Error(`Signature verification failed: ${err.message}`);
  }
};

/**
 * Generate a random nonce for sign challenge
 */
const generateNonce = () => Math.floor(Math.random() * 1_000_000).toString();

module.exports = { verifySignature, generateNonce };
