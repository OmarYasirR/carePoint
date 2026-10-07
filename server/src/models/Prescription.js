const mongoose = require('mongoose');
const { Schema } = mongoose;

const medicationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true }, // e.g. "500mg"
    frequency: { type: String, required: true, trim: true }, // e.g. "Twice daily"
    duration: { type: String, required: true, trim: true }, // e.g. "7 days"
    instructions: { type: String, trim: true }, // e.g. "Take after meals"
  },
  { _id: false }
);

const prescriptionSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    medicalRecord: { type: Schema.Types.ObjectId, ref: 'MedicalRecord' },
    medications: { type: [medicationSchema], required: true, validate: (v) => v.length > 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
    issuedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Active', 'Fulfilled', 'Expired', 'Cancelled'],
      default: 'Active',
      index: true,
    },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1, issuedAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
