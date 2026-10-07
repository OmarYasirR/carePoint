const asyncHandler = require('express-async-handler');
const Prescription = require('../models/Prescription');
const { emitNotification } = require('../socket');

/**
 * GET /api/prescriptions/patient/:patientId
 */
const listForPatient = asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ patient: req.params.patientId })
    .populate('doctor', 'firstName lastName')
    .sort({ issuedAt: -1 });
  res.json(prescriptions);
});

/**
 * GET /api/prescriptions/:id
 */
const getPrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('doctor', 'firstName lastName')
    .populate('patient', 'firstName lastName');
  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }
  res.json(prescription);
});

/**
 * POST /api/prescriptions
 * Doctor only — the digital prescription writer.
 */
const createPrescription = asyncHandler(async (req, res) => {
  const { patient, appointment, medicalRecord, medications, notes } = req.body;

  const prescription = await Prescription.create({
    patient,
    doctor: req.user._id,
    appointment,
    medicalRecord,
    medications,
    notes,
  });

  emitNotification(patient, {
    type: 'prescription:new',
    message: 'A new prescription has been added to your records',
    prescriptionId: prescription._id,
    at: new Date().toISOString(),
  });

  res.status(201).json(prescription);
});

/**
 * PATCH /api/prescriptions/:id/status
 */
const updatePrescriptionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const prescription = await Prescription.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }
  res.json(prescription);
});

module.exports = { listForPatient, getPrescription, createPrescription, updatePrescriptionStatus };
