const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Persisted counterpart to the live Socket.io `notification:new` event
 * (see src/socket/index.js). Every notification emitted in real time
 * is also written here so the feed survives refresh/reconnect and can
 * show an accurate unread count.
 */
const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'appointment:new',
        'appointment:status-changed',
        'prescription:new',
        'consultation:ready',
        'record:new',
        'system',
      ],
      required: true,
    },
    message: { type: String, required: true },
    // Loosely-typed pointer back to whatever triggered this notification
    // (an appointment id, prescription id, etc.) so the client can deep-link.
    relatedId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
