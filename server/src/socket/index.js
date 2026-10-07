const jwt = require('jsonwebtoken');

/**
 * Wires up Socket.io for two concerns:
 *  1. In-app notifications — each authenticated user joins a private
 *     room named after their user id, so the REST layer can emit
 *     `notification:new` to `io.to(userId)` from anywhere in the app.
 *  2. WebRTC signaling for video consultations — peers join a room
 *     named after the consultation id and relay SDP offers/answers +
 *     ICE candidates through the server without the media itself
 *     ever touching it (peer-to-peer after handshake).
 *
 * Call `initSocket(httpServer)` once from server.js and use the
 * returned `io` instance (or `getIO()`) anywhere you need to emit.
 */
let ioInstance = null;

function initSocket(httpServer) {
  const { Server } = require('socket.io');
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  // Auth handshake: client connects with `auth: { token }`.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.sub;
      socket.role = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // --- Notifications room ---
    socket.join(socket.userId);

    // --- WebRTC signaling for a given consultation room ---
    socket.on('consultation:join', ({ roomId }) => {
      socket.join(`consult:${roomId}`);
      socket.to(`consult:${roomId}`).emit('consultation:peer-joined', { userId: socket.userId });
    });

    socket.on('consultation:signal', ({ roomId, data }) => {
      socket.to(`consult:${roomId}`).emit('consultation:signal', { from: socket.userId, data });
    });

    socket.on('consultation:chat-message', ({ roomId, message }) => {
      io.to(`consult:${roomId}`).emit('consultation:chat-message', {
        from: socket.userId,
        message,
        at: new Date().toISOString(),
      });
    });

    socket.on('consultation:leave', ({ roomId }) => {
      socket.leave(`consult:${roomId}`);
      socket.to(`consult:${roomId}`).emit('consultation:peer-left', { userId: socket.userId });
    });

    socket.on('disconnect', () => {
      // Rooms are cleaned up automatically by socket.io on disconnect.
    });
  });

  ioInstance = io;
  return io;
}

function getIO() {
  if (!ioInstance) throw new Error('Socket.io not initialized yet — call initSocket() first');
  return ioInstance;
}

/**
 * Helper used by controllers to push a notification to a specific
 * user in real time AND persist it, so the feed survives refresh and
 * an accurate unread count is always available via
 * GET /api/notifications. `payload` must include { type, message }
 * and may include a `relatedId` (appointment/prescription/etc id).
 * Required lazily to avoid a require-cycle with models at module load.
 */
async function emitNotification(userId, payload) {
  const Notification = require('../models/Notification');

  const doc = await Notification.create({
    user: userId,
    type: payload.type,
    message: payload.message,
    relatedId: payload.appointmentId || payload.prescriptionId || payload.relatedId,
  });

  getIO()
    .to(userId.toString())
    .emit('notification:new', {
      _id: doc._id,
      type: doc.type,
      message: doc.message,
      relatedId: doc.relatedId,
      isRead: doc.isRead,
      at: doc.createdAt.toISOString(),
    });
}

module.exports = { initSocket, getIO, emitNotification };
