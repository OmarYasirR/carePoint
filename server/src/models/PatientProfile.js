const mongoose = require('mongoose');
const { Schema } = mongoose;

const patientProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    address: {
      line1: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    insurance: {
      provider: { type: String, trim: true },
      policyNumber: { type: String, trim: true },
      validTill: { type: Date },
    },
    // High-level medical background; detailed encrypted history lives in MedicalRecord.
    allergies: [{ type: String, trim: true }],
    chronicConditions: [{ type: String, trim: true }],
    registeredBy: { type: Schema.Types.ObjectId, ref: 'User' }, // admin/staff who registered patient, if applicable
  },
  { timestamps: true }
);

patientProfileSchema.index({ 'address.city': 1 });

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
