'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, PhoneOff, UserCircle2 } from 'lucide-react';
import { useSocket } from '@/lib/socket-context';
import { audioManager } from '@/lib/call/audio-manager';

export function CallRinger() {
  const { socket } = useSocket();
  const router = useRouter();
  
  const [incoming, setIncoming] = useState<{ fromId: string; roomId: string; callerName: string } | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onIncoming = (payload: { fromId: string; roomId: string; callerName: string }) => {
      setIncoming(payload);
      try { audioManager.playIncomingRing(); } catch (e) {}
    };

    const onCancelled = () => {
      setIncoming(null);
      audioManager.stopAll();
    };

    socket.on('incoming-call', onIncoming);
    socket.on('call-cancelled', onCancelled);

    return () => {
      socket.off('incoming-call', onIncoming);
      socket.off('call-cancelled', onCancelled);
    };
  }, [socket]);

  const accept = () => {
    if (!incoming || !socket) return;
    audioManager.stopAll();
    socket.emit('call-accept', { toId: incoming.fromId, roomId: incoming.roomId });
    router.push(`/call/${incoming.roomId}?target=${incoming.fromId}`);
    setIncoming(null);
  };

  const decline = () => {
    if (!incoming || !socket) return;
    audioManager.stopAll();
    socket.emit('call-reject', { toId: incoming.fromId });
    setIncoming(null);
  };

  if (!incoming) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-canvas shadow-inner">
            <UserCircle2 className="h-12 w-12 text-muted" />
            <span className="absolute -right-1 -top-1 flex h-6 w-6 animate-pulse items-center justify-center rounded-full bg-signal text-white">
              <Phone className="h-3 w-3" />
            </span>
          </div>
          
          <h2 className="font-display text-2xl font-bold text-ink mb-1">
            {incoming.callerName}
          </h2>
          <p className="text-muted mb-8">is calling you...</p>

          <div className="flex w-full gap-4">
            <button
              onClick={decline}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-beacon/10 py-4 font-semibold text-beacon transition-colors hover:bg-beacon hover:text-white"
            >
              <PhoneOff className="h-5 w-5" />
              Decline
            </button>
            <button
              onClick={accept}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-bridge py-4 font-semibold text-white shadow-glow transition-transform hover:scale-105"
            >
              <Phone className="h-5 w-5 animate-bounce" />
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
