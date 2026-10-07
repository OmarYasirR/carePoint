const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Prescription = require('../models/Prescription');

/**
 * GET /api/admin/metrics
 * Powers the "Quick Stats" widgets on the admin dashboard: total
 * patients, today's appointments, doctors online, pending
 * prescriptions (status=Active, i.e. issued but not yet fulfilled).
 */
const getDashboardMetrics = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [totalPatients, todaysAppointments, doctorsOnline, pendingPrescriptions, recentPatients] = await Promise.all([
    User.countDocuments({ role: 'patient', isActive: true }),
    Appointment.countDocuments({ startTime: { $gte: startOfDay, $lte: endOfDay } }),
    DoctorProfile.countDocuments({ isOnline: true }),
    Prescription.countDocuments({ status: 'Active' }),
    User.find({ role: 'patient' }).sort({ createdAt: -1 }).limit(5),
  ]);

  res.json({
    totalPatients,
    todaysAppointments,
    doctorsOnline,
    pendingPrescriptions,
    recentPatients: recentPatients.map((p) => p.toSafeObject()),
  });
});

/**
 * GET /api/admin/appointment-trends?days=7
 * Daily appointment counts for the trends chart.
 */
const getAppointmentTrends = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 7;
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const trends = await Appointment.aggregate([
    { $match: { startTime: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json(trends);
});

/**
 * GET /api/admin/users?role=&search=&page=&limit=
 * Full account listing/management for the admin panel.
 */
const listUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 10 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
  }

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  const total = await User.countDocuments(filter);

  res.json({
    data: users.map((u) => u.toSafeObject()),
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  });
});

/**
 * POST /api/admin/users
 * Admin onboards another staff account (admin role). Doctor accounts
 * go through POST /api/doctors instead, since they require a linked
 * DoctorProfile (specialty, schedule, etc).
 */
const createStaffUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ firstName, lastName, email, password, phone, role: 'admin' });
  res.status(201).json(user.toSafeObject());
});

/**
 * PATCH /api/admin/users/:id/status
 * Activates or deactivates any account (admin, doctor, or patient).
 * An admin cannot deactivate their own account, to avoid locking
 * every admin out of the system.
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot change the status of your own account');
  }

  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user.toSafeObject());
});

module.exports = {
  getDashboardMetrics,
  getAppointmentTrends,
  listUsers,
  createStaffUser,
  toggleUserStatus,
};
