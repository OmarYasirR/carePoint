const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Appointment = require('../models/Appointment');
const { emitNotification } = require('../socket');

/**
 * POST /api/consultations/:appointmentId/room
 * Creates (or returns the existing) signaling room id for a video
 * appointment. The client then connects to Socket.io and emits
 * `consultation:join` with this roomId — see src/socket/index.js.
 * Actual media never passes through the server (peer-to-peer WebRTC);
 * this endpoint only hands out the shared room identifier.
 */
const createOrGetRoom = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.appointmentId);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }
  if (appointment.type !== 'video') {
    res.status(400);
    throw new Error('This appointment is not a video consultation');
  }

  const isParticipant =
    appointment.patient.toString() === req.user._id.toString() ||
    appointment.doctor.toString() === req.user._id.toString();
  if (!isParticipant && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to join this consultation');
  }

  if (!appointment.consultationRoomId) {
    appointment.consultationRoomId = crypto.randomUUID();
    await appointment.save();
  }

  // Let the other participant know the room is ready / a party joined.
  const otherParty =
    req.user._id.toString() === appointment.patient.toString()
      ? appointment.doctor
      : appointment.patient;
  emitNotification(otherParty, {
    type: 'consultation:ready',
    message: 'Your video consultation room is ready',
    appointmentId: appointment._id,
    roomId: appointment.consultationRoomId,
    at: new Date().toISOString(),
  });

  res.json({ roomId: appointment.consultationRoomId, appointmentId: appointment._id });
});

/**
 * POST /api/consultations/:appointmentId/notes
 * Doctor saves live clinical notes drafted during the call. Kept
 * separate from MedicalRecord so notes can be autosaved frequently
 * without creating record churn; a doctor finalizes into a proper
 * MedicalRecord afterward via POST /api/records.
 */
const saveLiveNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const appointment = await Appointment.findById(req.params.appointmentId);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }
  if (appointment.doctor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the consulting doctor may save notes for this call');
  }
  appointment.liveNotes = notes; // ad-hoc field; add to schema if persisted long-term
  await appointment.save();
  res.json({ message: 'Notes saved', notes });
});

module.exports = { createOrGetRoom, saveLiveNotes };
