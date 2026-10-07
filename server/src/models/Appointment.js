const mongoose = require('mongoose');
const { Schema } = mongoose;

const appointmentSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    type: {
      type: String,
      enum: ['in-person', 'video'],
      default: 'in-person',
    },
    reason: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'No-show'],
      default: 'Scheduled',
      index: true,
    },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancellationReason: { type: String, trim: true },
    // Set once a video consultation room has been created for this appointment.
    consultationRoomId: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Speeds up "does this doctor already have a slot here" conflict checks
// and calendar/day-range queries.
appointmentSchema.index({ doctor: 1, startTime: 1, endTime: 1 });
appointmentSchema.index({ patient: 1, startTime: -1 });

appointmentSchema.pre('validate', function validateTimes(next) {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) {
    return next(new Error('endTime must be after startTime'));
  }
  next();
});

/**
 * Static helper used by the booking service to detect overlapping
 * appointments for a given doctor before confirming a new one.
 */
appointmentSchema.statics.hasConflict = function hasConflict({
  doctor,
  startTime,
  endTime,
  excludeAppointmentId,
}) {
  const query = {
    doctor,
    status: { $ne: 'Cancelled' },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }
  return this.exists(query);
};

module.exports = mongoose.model('Appointment', appointmentSchema);
