const crypto = require("crypto");

/**
 * Compute SHA-256 hash of a buffer
 * @param {Buffer} buffer
 * @returns {string} hex hash
 */
const hashBuffer = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

/**
 * Compute SHA-256 hash of a string
 */
const hashString = (str) => crypto.createHash("sha256").update(str).digest("hex");

module.exports = { hashBuffer, hashString };
