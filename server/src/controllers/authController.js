const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

// In production the client and API are usually on different origins
// (e.g. a static site + a Render web service). Browsers do not send
// SameSite=Lax cookies on cross-origin fetch/XHR, which would silently
// break token refresh and persistent login — so production uses
// SameSite=None (which requires Secure, i.e. HTTPS). Locally, Vite's
// proxy keeps everything same-origin over http, where Lax is correct.
const isProd = process.env.NODE_ENV === 'production';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/**
 * POST /api/auth/register
 * Public self-registration is only for patients. Admins create doctor
 * and admin accounts through /api/admin (see adminController).
 */
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, dateOfBirth, gender } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    role: 'patient',
  });

  await PatientProfile.create({ user: user._id, dateOfBirth, gender });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(201).json({ user: user.toSafeObject(), accessToken });
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated. Contact an administrator.');
  }

  user.lastLogin = new Date();
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.json({ user: user.toSafeObject(), accessToken });
});

/**
 * POST /api/auth/refresh
 * Reads the httpOnly refresh cookie and issues a new access token.
 */
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401);
    throw new Error('No refresh token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('User not found or deactivated');
  }

  const accessToken = generateAccessToken(user);
  res.json({ accessToken });
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Requires `protect` middleware.
 */
const getMe = asyncHandler(async (req, res) => {
  let profile = null;
  if (req.user.role === 'patient') {
    profile = await PatientProfile.findOne({ user: req.user._id });
  } else if (req.user.role === 'doctor') {
    profile = await DoctorProfile.findOne({ user: req.user._id });
  }
  res.json({ user: req.user.toSafeObject(), profile });
});

module.exports = { register, login, refresh, logout, getMe };
