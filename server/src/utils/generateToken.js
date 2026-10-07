const jwt = require('jsonwebtoken');

/**
 * Short-lived access token carried in the Authorization header.
 */
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

/**
 * Longer-lived refresh token, stored (hashed) on the user document and
 * set as an httpOnly cookie so it never touches client-side JS.
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), tokenVersion: user.tokenVersion || 0 },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

module.exports = { generateAccessToken, generateRefreshToken };
