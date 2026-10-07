import { io } from 'socket.io-client';
import { store } from '../app/store.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/';

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

  // Reuse existing socket, but reconnect if the token changed
  // (e.g. after a silent refresh) so the server sees the new auth.
  if (socket && socket.auth?.token !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  } else if (socket.disconnected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}