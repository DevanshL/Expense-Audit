const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// Derive a 32-byte key from the secret
const getKey = () => crypto.createHash('sha256').update(SECRET).digest();

/**
 * Encrypt a plaintext string
 * @param {string} text
 * @returns {string} iv:encryptedHex
 */
const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * Decrypt an encrypted string produced by encrypt()
 * @param {string} encryptedText  iv:encryptedHex
 * @returns {string} plaintext
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  const [ivHex, encryptedHex] = encryptedText.split(':');
  if (!ivHex || !encryptedHex) return null;
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
};

module.exports = { encrypt, decrypt };