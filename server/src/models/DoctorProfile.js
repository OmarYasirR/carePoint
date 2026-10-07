const mongoose = require('mongoose');
const { Schema } = mongoose;

// One shift block within a working day, e.g. 09:00-13:00.
const shiftSchema = new Schema(
  {
    startTime: { type: String, required: true }, // "HH:mm" 24h
    endTime: { type: String, required: true },
    slotDurationMinutes: { type: Number, default: 15, min: 5 },
    maxPatientsPerSlot: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

// Weekly availability: one entry per weekday (0=Sun ... 6=Sat) with
// zero or more shifts and optional break windows.
const daySchema = new Schema(
  {
    weekday: { type: Number, min: 0, max: 6, required: true },
    isWorkingDay: { type: Boolean, default: true },
    shifts: [shiftSchema],
    breaks: [
      {
        startTime: { type: String },
        endTime: { type: String },
        _id: false,
      },
    ],
  },
  { _id: false }
);

const doctorProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    specialty: { type: String, required: true, trim: true, index: true },
    qualifications: [{ type: String, trim: true }],
    licenseNumber: { type: String, trim: true, unique: true, sparse: true },
    yearsOfExperience: { type: Number, min: 0 },
    consultationFee: { type: Number, min: 0, default: 0 },
    bio: { type: String, trim: true, maxlength: 2000 },
    weeklyAvailability: { type: [daySchema], default: [] },
    isOnline: { type: Boolean, default: false }, // for "Doctors Online" widget
    isAcceptingNewPatients: { type: Boolean, default: true },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

doctorProfileSchema.index({ specialty: 1, isAcceptingNewPatients: 1 });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
