const asyncHandler = require('express-async-handler');
const MedicalRecord = require('../models/MedicalRecord');

/**
 * GET /api/records/patient/:patientId
 * Doctor/admin, or the patient viewing their own history.
 * Diagnostic notes are excluded by default (select: false on the
 * schema) — list view shows diagnosis/vitals/attachments only.
 */
const listRecordsForPatient = asyncHandler(async (req, res) => {
  const records = await MedicalRecord.find({ patient: req.params.patientId })
    .populate('doctor', 'firstName lastName')
    .sort({ visitDate: -1 });
  res.json(records);
});

/**
 * GET /api/records/:id
 * Full detail including decrypted diagnosticNotes.
 */
const getRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
    .select('+diagnosticNotes')
    .populate('doctor', 'firstName lastName')
    .populate('patient', 'firstName lastName');
  if (!record) {
    res.status(404);
    throw new Error('Medical record not found');
  }
  const isOwner = record.patient._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role === 'patient') {
    res.status(403);
    throw new Error('Not authorized to view this record');
  }
  res.json(record);
});

/**
 * POST /api/records
 * Doctor only — creates a visit record, optionally linked to an appointment.
 */
const createRecord = asyncHandler(async (req, res) => {
  const { patient, appointment, diagnosticNotes, diagnosis, vitals, attachments } = req.body;

  const record = await MedicalRecord.create({
    patient,
    doctor: req.user._id,
    appointment,
    diagnosticNotes,
    diagnosis,
    vitals,
    attachments,
  });

  res.status(201).json(record);
});

/**
 * PUT /api/records/:id
 * Doctor who authored the record (or admin) may amend it.
 */
const updateRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error('Medical record not found');
  }
  if (req.user.role === 'doctor' && record.doctor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the authoring doctor may amend this record');
  }

  const { diagnosticNotes, diagnosis, vitals, attachments } = req.body;
  if (diagnosticNotes !== undefined) record.diagnosticNotes = diagnosticNotes;
  if (diagnosis !== undefined) record.diagnosis = diagnosis;
  if (vitals !== undefined) record.vitals = vitals;
  if (attachments !== undefined) record.attachments = attachments;

  await record.save();
  res.json(record);
});

module.exports = { listRecordsForPatient, getRecord, createRecord, updateRecord };
