const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const { emitNotification } = require('../socket');

/**
 * GET /api/appointments
 * Scoped automatically by role: patients see their own, doctors see
 * their own, admins can see all (optionally filtered).
 * Query: ?status=&from=&to=&doctor=&patient=&page=&limit=
 */
const listAppointments = asyncHandler(async (req, res) => {
  const { status, from, to, doctor, patient, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (req.user.role === 'patient') filter.patient = req.user._id;
  if (req.user.role === 'doctor') filter.doctor = req.user._id;
  if (req.user.role === 'admin') {
    if (doctor) filter.doctor = doctor;
    if (patient) filter.patient = patient;
  }
  if (status) filter.status = status;
  if (from || to) {
    filter.startTime = {};
    if (from) filter.startTime.$gte = new Date(from);
    if (to) filter.startTime.$lte = new Date(to);
  }

  const appointments = await Appointment.find(filter)
    .populate('patient', 'firstName lastName email phone avatarUrl')
    .populate('doctor', 'firstName lastName avatarUrl')
    .sort({ startTime: 1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Appointment.countDocuments(filter);
  res.json({ data: appointments, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

/**
 * GET /api/appointments/:id
 */
const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'firstName lastName email phone avatarUrl')
    .populate('doctor', 'firstName lastName avatarUrl');
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }
  const isParticipant =
    appointment.patient._id.toString() === req.user._id.toString() ||
    appointment.doctor._id.toString() === req.user._id.toString();
  if (!isParticipant && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this appointment');
  }
  res.json(appointment);
});

/**
 * POST /api/appointments
 * Dynamic slot reservation: rejects if the requested window overlaps
 * an existing (non-cancelled) appointment for that doctor.
 */
const createAppointment = asyncHandler(async (req, res) => {
  const { doctor, startTime, endTime, type, reason } = req.body;
  const patient = req.user.role === 'patient' ? req.user._id : req.body.patient;

  if (!patient) {
    res.status(400);
    throw new Error('patient is required');
  }

  const conflict = await Appointment.hasConflict({ doctor, startTime, endTime });
  if (conflict) {
    res.status(409);
    throw new Error('This time slot is no longer available for the selected doctor');
  }

  const appointment = await Appointment.create({
    patient,
    doctor,
    startTime,
    endTime,
    type,
    reason,
    createdBy: req.user._id,
  });

  const populated = await appointment.populate([
    { path: 'patient', select: 'firstName lastName' },
    { path: 'doctor', select: 'firstName lastName' },
  ]);

  // Notify the doctor of the new booking in real time.
  emitNotification(doctor, {
    type: 'appointment:new',
    message: `New appointment booked by ${populated.patient.firstName} ${populated.patient.lastName}`,
    appointmentId: appointment._id,
    at: new Date().toISOString(),
  });

  res.status(201).json(populated);
});

/**
 * PATCH /api/appointments/:id/status
 * Doctor/admin transitions an appointment's status.
 */
const updateStatus = asyncHandler(async (req, res) => {
  const { status, cancellationReason } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  appointment.status = status;
  if (status === 'Cancelled') {
    appointment.cancelledBy = req.user._id;
    appointment.cancellationReason = cancellationReason;
  }
  await appointment.save();

  emitNotification(appointment.patient, {
    type: 'appointment:status-changed',
    message: `Your appointment status changed to "${status}"`,
    appointmentId: appointment._id,
    at: new Date().toISOString(),
  });

  res.json(appointment);
});

/**
 * PUT /api/appointments/:id/reschedule
 */
const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { startTime, endTime } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  const conflict = await Appointment.hasConflict({
    doctor: appointment.doctor,
    startTime,
    endTime,
    excludeAppointmentId: appointment._id,
  });
  if (conflict) {
    res.status(409);
    throw new Error('The new time slot conflicts with an existing appointment');
  }

  appointment.startTime = startTime;
  appointment.endTime = endTime;
  appointment.status = 'Scheduled';
  await appointment.save();

  res.json(appointment);
});

module.exports = {
  listAppointments,
  getAppointment,
  createAppointment,
  updateStatus,
  rescheduleAppointment,
};
