const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the Bearer access token, loads the corresponding user
 * (minus password) and attaches it to req.user. Rejects with 401 on
 * any failure (missing token, expired, invalid signature, deactivated
 * account, or user no longer existing).
 */
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated' });
    }

    req.user = user; // full mongoose doc; controllers can call toSafeObject()
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access token expired' });
    }
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
}

module.exports = { protect };
