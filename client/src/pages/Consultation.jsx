import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Peer from 'simple-peer';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send } from 'lucide-react';
import api from '../services/api.js';
import { getSocket } from '../services/socket.js';

/**
 * Peer-to-peer video consultation.
 * Flow: fetch/create the signaling room -> join the Socket.io room ->
 * whichever peer connects second acts as the WebRTC "initiator" ->
 * exchange SDP/ICE via `consultation:signal` -> media flows directly
 * between browsers once negotiated (server never touches the stream).
 */
export default function Consultation() {
  const { appointmentId } = useParams();
  const { user } = useSelector((s) => s.auth);

  const [roomId, setRoomId] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [notes, setNotes] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let socket;
    let cancelled = false;

    async function setup() {
      const { data } = await api.post(`/consultations/${appointmentId}/room`);
      if (cancelled) return;
      setRoomId(data.roomId);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      socket = getSocket();
      socket.emit('consultation:join', { roomId: data.roomId });

      // Second peer to join initiates the WebRTC offer.
      let peerJoinedFirst = false;

      socket.on('consultation:peer-joined', () => {
        peerJoinedFirst = true;
        createPeer(true, stream, socket, data.roomId);
      });

      socket.on('consultation:signal', ({ data: signalData }) => {
        if (!peerRef.current) {
          createPeer(false, stream, socket, data.roomId);
        }
        peerRef.current?.signal(signalData);
      });

      socket.on('consultation:chat-message', (msg) => {
        setMessages((m) => [...m, msg]);
      });

      socket.on('consultation:peer-left', () => setConnected(false));
    }

    function createPeer(initiator, stream, sock, room) {
      const peer = new Peer({ initiator, trickle: true, stream });
      peer.on('signal', (signalData) => sock.emit('consultation:signal', { roomId: room, data: signalData }));
      peer.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        setConnected(true);
      });
      peer.on('close', () => setConnected(false));
      peerRef.current = peer;
    }

    setup();

    return () => {
      cancelled = true;
      peerRef.current?.destroy();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (roomId) socket?.emit('consultation:leave', { roomId });
      socket?.off('consultation:peer-joined');
      socket?.off('consultation:signal');
      socket?.off('consultation:chat-message');
      socket?.off('consultation:peer-left');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn((v) => !v);
  };
  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !camOn));
    setCamOn((v) => !v);
  };

  const sendMessage = useCallback(() => {
    if (!chatInput.trim() || !roomId) return;
    getSocket().emit('consultation:chat-message', { roomId, message: chatInput });
    setChatInput('');
  }, [chatInput, roomId]);

  const endCall = () => {
    peerRef.current?.destroy();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (roomId) getSocket()?.emit('consultation:leave', { roomId });
    window.history.back();
  };

  const saveNotes = async () => {
    await api.post(`/consultations/${appointmentId}/notes`, { notes });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[calc(100vh-8rem)]">
      <div className="h-[50vh] lg:h-auto lg:col-span-2 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            Waiting for the other participant to join...
          </div>
        )}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-4 right-4 w-40 h-28 rounded-lg object-cover border-2 border-white/20"
        />

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur px-4 py-2 rounded-full">
          <button onClick={toggleMic} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
            {micOn ? <Mic size={16} /> : <MicOff size={16} />}
          </button>
          <button onClick={toggleCam} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
            {camOn ? <Video size={16} /> : <VideoOff size={16} />}
          </button>
          <button onClick={endCall} className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white">
            <PhoneOff size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 min-h-[320px] lg:min-h-0">
        <div className="bg-white rounded-xl border border-slate-200 flex-1 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">Chat</div>
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm max-w-[85%] px-3 py-2 rounded-lg ${
                  m.from === user._id ? 'bg-brand-primary text-white ml-auto' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {m.message}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-100 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Write a message..."
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
            <button onClick={sendMessage} className="p-2 bg-brand-primary text-white rounded-lg">
              <Send size={16} />
            </button>
          </div>
        </div>

        {user.role === 'doctor' && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-700 mb-2">Clinical Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              rows={4}
              placeholder="Draft notes during the call — saved on blur..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}
