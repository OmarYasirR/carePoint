const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { Schema } = mongoose;

/**
 * Base account model shared by Admin, Doctor and Patient roles.
 * Role-specific data lives in DoctorProfile / PatientProfile, linked
 * back to this document via a `user` reference (1:1).
 */
const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, trim: true },
    avatarUrl: { type: String, default: '' },
    role: {
      type: String,
      enum: ['admin', 'doctor', 'patient'],
      required: true,
      default: 'patient',
      index: true,
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1, role: 1 });

// Hash password before save whenever it's new or modified.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokenHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
