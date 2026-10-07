const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * FIELD_ENCRYPTION_KEY must be a 32-byte key, base64 or hex encoded,
 * supplied via environment variables (never committed to source).
 * Generate one with: `openssl rand -base64 32`
 */
function getKey() {
  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('FIELD_ENCRYPTION_KEY is not set in environment variables');
  }
  const key = Buffer.from(raw, raw.length === 64 ? 'hex' : 'base64');
  if (key.length !== 32) {
    throw new Error('FIELD_ENCRYPTION_KEY must decode to exactly 32 bytes');
  }
  return key;
}

/**
 * Encrypts a plaintext string into a single stored payload:
 * base64(iv):base64(authTag):base64(ciphertext)
 */
function encrypt(plainText) {
  if (plainText === undefined || plainText === null || plainText === '') return plainText;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
}

/**
 * Reverses encrypt(). Returns the original string unchanged if it
 * doesn't look like an encrypted payload (defensive for legacy data).
 */
function decrypt(payload) {
  if (!payload || typeof payload !== 'string' || payload.split(':').length !== 3) return payload;
  try {
    const key = getKey();
    const [ivB64, authTagB64, cipherB64] = payload.split(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(cipherB64, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (err) {
    return '[unable to decrypt]';
  }
}

module.exports = { encrypt, decrypt };
