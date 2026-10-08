import { io } from 'socket.io-client';
import { store } from '../app/store.js';
import { SOCKET_URL } from '../config.js';

let socket = null;

/**
 * Lazily creates (or returns) a single shared Socket.io connection
 * authenticated with the current access token. Used both for the
 * in-app notification feed and, with an additional `consultation:join`
 * emit, for WebRTC signaling during video calls.
 */
export function getSocket() {
  const token = store.getState().auth.accessToken;
  if (!token) return null;

  if (!socket || socket.disconnected) {
    socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
