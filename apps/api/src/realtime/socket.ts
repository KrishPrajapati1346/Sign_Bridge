import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import type { SignalMessage } from '@signbridge/shared-types';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../lib/jwt.js';

interface SocketUser {
  userId: string;
}

/**
 * Attaches the Socket.IO signaling server to the HTTP server. Sockets are
 * authenticated with the JWT access token; the server only relays WebRTC
 * signaling (SDP + ICE) between the (max two) peers in a room.
 */
export function attachSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigins, credentials: true },
  });

  // Authenticate every connection with the access token from the handshake.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string') {
      next(new Error('UNAUTHORIZED'));
      return;
    }
    try {
      const { sub } = verifyAccessToken(token);
      (socket.data as SocketUser).userId = sub;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket.data as SocketUser).userId;
    void socket.join(userId);

    // Announce online presence
    io.emit('user-status-changed', { userId, status: 'online' });

    // Allow clients to fetch currently online users
    socket.on('get-online-users', async () => {
      // Find all users who are currently connected
      const onlineIds = Array.from(io.sockets.adapter.rooms.keys()).filter(
        (key) => key !== socket.id && key.length > 20,
      ); // Basic heuristic for userId vs socketId
      socket.emit('online-users', onlineIds);
    });

    let joinedRoom: string | null = null;

    // --- Ringing Events ---
    socket.on('call-invite', (payload: { toId: string; roomId: string; callerName: string }) => {
      socket.to(payload.toId).emit('incoming-call', {
        fromId: userId,
        roomId: payload.roomId,
        callerName: payload.callerName,
      });
    });

    socket.on('call-accept', (payload: { toId: string; roomId: string }) => {
      socket.to(payload.toId).emit('call-accepted', { roomId: payload.roomId });
    });

    socket.on('call-reject', (payload: { toId: string }) => {
      socket.to(payload.toId).emit('call-rejected', { fromId: userId });
    });

    socket.on('call-cancel', (payload: { toId: string }) => {
      socket.to(payload.toId).emit('call-cancelled', { fromId: userId });
    });

    // --- Room Events ---
    socket.on('join', (roomId: unknown) => {
      if (typeof roomId !== 'string' || roomId.length === 0) {
        socket.emit('error-message', 'Invalid room.');
        return;
      }

      void socket.join(roomId);
      joinedRoom = roomId;

      // Get all existing socket IDs in the room (excluding this new socket)
      const room = io.sockets.adapter.rooms.get(roomId);
      const occupants = room ? Array.from(room).filter((id) => id !== socket.id) : [];

      // Tell the joiner about everyone already here
      socket.emit('room-occupants', occupants);

      // Notify everyone else that a new peer joined
      socket.to(roomId).emit('peer-joined', socket.id);
    });

    // Relay signaling to the specific target socket
    socket.on('signal', (message: SignalMessage) => {
      if (joinedRoom) {
        if (message.toId) {
          socket.to(message.toId).emit('signal', { ...message, fromId: socket.id });
        } else {
          // Backward compatibility for 1-to-1 calls
          socket.to(joinedRoom).emit('signal', message);
        }
      }
    });

    function leave() {
      if (joinedRoom) {
        socket.to(joinedRoom).emit('peer-left', socket.id);
        void socket.leave(joinedRoom);
        joinedRoom = null;
      }
    }

    socket.on('leave', leave);
    socket.on('disconnect', async () => {
      leave();
      const sockets = await io.in(userId).fetchSockets();
      if (sockets.length === 0) {
        io.emit('user-status-changed', { userId, status: 'offline' });
      }
    });
  });

  return io;
}
