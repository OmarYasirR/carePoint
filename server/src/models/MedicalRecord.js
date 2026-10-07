const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const { Schema } = mongoose;

const attachmentSchema = new Schema(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true }, // S3/Cloud storage URL
    fileType: { type: String }, // e.g. 'lab-result', 'imaging', 'report'
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const medicalRecordSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    visitDate: { type: Date, default: Date.now },
    // Diagnostic notes are stored encrypted at rest (AES-256-GCM) and
    // transparently decrypted via the getter below. Never returned in
    // plain list/aggregate queries unless .select('+diagnosticNotes').
    diagnosticNotes: {
      type: String,
      select: false,
      set: encrypt,
      get: decrypt,
    },
    diagnosis: [{ type: String, trim: true }],
    vitals: {
      heightCm: Number,
      weightKg: Number,
      bloodPressure: String, // e.g. "120/80"
      heartRateBpm: Number,
      temperatureC: Number,
    },
    attachments: [attachmentSchema],
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } }
);

medicalRecordSchema.index({ patient: 1, visitDate: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
