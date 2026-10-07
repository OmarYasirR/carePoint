const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');

/**
 * GET /api/doctors
 * Public-ish (any authenticated role) — patients need this to browse
 * and book. Supports ?search=&specialty=&onlineOnly=
 */
const listDoctors = asyncHandler(async (req, res) => {
  const { search = '', specialty, onlineOnly } = req.query;

  const profileFilter = {};
  if (specialty) profileFilter.specialty = specialty;
  if (onlineOnly === 'true') profileFilter.isOnline = true;

  const profiles = await DoctorProfile.find(profileFilter).populate({
    path: 'user',
    match: search
      ? {
          role: 'doctor',
          $or: [
            { firstName: new RegExp(search, 'i') },
            { lastName: new RegExp(search, 'i') },
          ],
        }
      : { role: 'doctor' },
  });

  const results = profiles
    .filter((p) => p.user) // drop entries where populate match excluded the user
    .map((p) => ({ ...p.user.toSafeObject(), profile: p }));

  res.json({ data: results, total: results.length });
});

/**
 * GET /api/doctors/:id
 */
const getDoctor = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'doctor' });
  if (!user) {
    res.status(404);
    throw new Error('Doctor not found');
  }
  const profile = await DoctorProfile.findOne({ user: user._id });
  res.json({ ...user.toSafeObject(), profile });
});

/**
 * POST /api/doctors
 * Admin only — creates the User (role=doctor) + DoctorProfile together.
 */
const createDoctor = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    specialty,
    qualifications,
    licenseNumber,
    yearsOfExperience,
    consultationFee,
    bio,
  } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ firstName, lastName, email, password, phone, role: 'doctor' });
  const profile = await DoctorProfile.create({
    user: user._id,
    specialty,
    qualifications,
    licenseNumber,
    yearsOfExperience,
    consultationFee,
    bio,
  });

  res.status(201).json({ ...user.toSafeObject(), profile });
});

/**
 * PUT /api/doctors/:id
 * Doctor may update their own bio/fee/qualifications; admin can update any field.
 */
const updateDoctor = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, avatarUrl, ...profileFields } = req.body;

  const user = await User.findOne({ _id: req.params.id, role: 'doctor' });
  if (!user) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  if (firstName || lastName || phone || avatarUrl) {
    Object.assign(user, {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
      ...(avatarUrl && { avatarUrl }),
    });
    await user.save();
  }

  const profile = await DoctorProfile.findOneAndUpdate(
    { user: user._id },
    { $set: profileFields },
    { new: true, runValidators: true }
  );

  res.json({ ...user.toSafeObject(), profile });
});

/**
 * PUT /api/doctors/:id/availability
 * Doctor (own) or admin — sets the weekly shift schedule.
 */
const updateAvailability = asyncHandler(async (req, res) => {
  const { weeklyAvailability } = req.body;

  const profile = await DoctorProfile.findOneAndUpdate(
    { user: req.params.id },
    { $set: { weeklyAvailability } },
    { new: true, runValidators: true }
  );
  if (!profile) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }
  res.json(profile);
});

/**
 * DELETE /api/doctors/:id — admin only, soft delete.
 */
const deactivateDoctor = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'doctor' },
    { isActive: false },
    { new: true }
  );
  if (!user) {
    res.status(404);
    throw new Error('Doctor not found');
  }
  res.json({ message: 'Doctor account deactivated', user: user.toSafeObject() });
});

module.exports = {
  listDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  updateAvailability,
  deactivateDoctor,
};
