import { io, type Socket } from 'socket.io-client';
import type { SignalMessage } from '@signbridge/shared-types';
import { API_URL } from '../auth-api';

/**
 * Thin wrapper over the authenticated Socket.IO connection used purely for
 * WebRTC signaling (SDP + ICE relay) and room presence.
 */
export interface Signaling {
  socket: Socket;
  join: (roomId: string) => void;
  leave: () => void;
  sendSignal: (msg: SignalMessage) => void;
  onSignal: (cb: (msg: SignalMessage) => void) => void;
  onPeerJoined: (cb: (peerId: string) => void) => void;
  onPeerPresent: (cb: (present: boolean) => void) => void;
  onRoomOccupants: (cb: (occupants: string[]) => void) => void;
  onPeerLeft: (cb: (peerId: string) => void) => void;
  onRoomFull: (cb: () => void) => void;
  disconnect: () => void;
}

export function attachSignaling(socket: Socket): Signaling {
  let room: string | null = null;
  const cleanupFns: Array<() => void> = [];

  const addListener = (event: string, cb: any) => {
    socket.on(event, cb);
    cleanupFns.push(() => socket.off(event, cb));
  };

  return {
    socket,
    join: (roomId) => {
      room = roomId;
      socket.emit('join', roomId);
    },
    leave: () => {
      if (room) socket.emit('leave');
      room = null;
    },
    sendSignal: (msg) => socket.emit('signal', msg),
    onSignal: (cb) => addListener('signal', cb),
    onPeerJoined: (cb) => addListener('peer-joined', cb),
    onPeerPresent: (cb) => addListener('peer-present', cb),
    onRoomOccupants: (cb) => addListener('room-occupants', cb),
    onPeerLeft: (cb) => addListener('peer-left', cb),
    onRoomFull: (cb) => addListener('room-full', cb),
    disconnect: () => {
      if (room) socket.emit('leave');
      room = null;
      cleanupFns.forEach((fn) => fn());
    },
  };
}
