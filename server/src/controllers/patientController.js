const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');

/**
 * GET /api/patients
 * Admin/doctor only. Supports ?search=&page=&limit=&gender=
 * Dynamic search across name, email, and phone.
 */
const listPatients = asyncHandler(async (req, res) => {
  const { search = '', page = 1, limit = 10, gender } = req.query;

  const userMatch = { role: 'patient' };
  if (search) {
    const regex = new RegExp(search, 'i');
    userMatch.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }];
  }

  const users = await User.find(userMatch)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await User.countDocuments(userMatch);
  const userIds = users.map((u) => u._id);

  const profileFilter = { user: { $in: userIds } };
  if (gender) profileFilter.gender = gender;
  const profiles = await PatientProfile.find(profileFilter);
  const profileByUser = new Map(profiles.map((p) => [p.user.toString(), p]));

  const results = users
    .filter((u) => !gender || profileByUser.has(u._id.toString()))
    .map((u) => ({ ...u.toSafeObject(), profile: profileByUser.get(u._id.toString()) || null }));

  res.json({ data: results, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

/**
 * GET /api/patients/:id
 */
const getPatient = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'patient' });
  if (!user) {
    res.status(404);
    throw new Error('Patient not found');
  }
  const profile = await PatientProfile.findOne({ user: user._id });
  res.json({ ...user.toSafeObject(), profile });
});

/**
 * PUT /api/patients/:id
 * Patients may update their own profile; admins/doctors may update any.
 */
const updatePatient = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, avatarUrl, ...profileFields } = req.body;

  const user = await User.findOne({ _id: req.params.id, role: 'patient' });
  if (!user) {
    res.status(404);
    throw new Error('Patient not found');
  }

  Object.assign(user, { firstName, lastName, phone, avatarUrl });
  await user.save();

  const profile = await PatientProfile.findOneAndUpdate(
    { user: user._id },
    { $set: profileFields },
    { new: true, upsert: true, runValidators: true }
  );

  res.json({ ...user.toSafeObject(), profile });
});

/**
 * DELETE /api/patients/:id
 * Admin only — soft delete (deactivate) rather than destroy history.
 */
const deactivatePatient = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'patient' },
    { isActive: false },
    { new: true }
  );
  if (!user) {
    res.status(404);
    throw new Error('Patient not found');
  }
  res.json({ message: 'Patient account deactivated', user: user.toSafeObject() });
});

module.exports = { listPatients, getPatient, updatePatient, deactivatePatient };
