'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserPlus, UserCircle2, Phone, X, Search } from 'lucide-react';
import { useSocket } from '@/lib/socket-context';
import { useAuth } from '@/lib/auth-context';
import { API_URL } from '@/lib/auth-api';
import { audioManager } from '@/lib/call/audio-manager';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
}

export function AddParticipantModal({ roomId, currentPeers, initialTarget }: { roomId: string, currentPeers: string[], initialTarget?: string }) {
  const { authFetch, user } = useAuth();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [query, setQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [ringingUsers, setRingingUsers] = useState<Set<string>>(new Set());

  const loadUsers = useCallback(async () => {
    try {
      const res = await authFetch(`${API_URL}/api/users`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
      }
    } catch {
      // Non-fatal
    }
  }, [authFetch]);

  useEffect(() => {
    if (isOpen) {
      void loadUsers();
    }
  }, [isOpen, loadUsers]);

  useEffect(() => {
    if (!socket || !isOpen) return;
    
    const handleOnlineUsers = (userIds: string[]) => {
      setOnlineUsers(new Set(userIds));
    };

    const handleStatusChanged = ({ userId, status }: { userId: string, status: 'online' | 'offline' }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (status === 'online') next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    socket.on('online-users', handleOnlineUsers);
    socket.on('user-status-changed', handleStatusChanged);
    
    // Request initial list
    socket.emit('get-online-users');

    return () => {
      socket.off('online-users', handleOnlineUsers);
      socket.off('user-status-changed', handleStatusChanged);
    };
  }, [socket, isOpen]);

  // If a ringing user joins, stop ringing them
  useEffect(() => {
    setRingingUsers(prev => {
      let changed = false;
      const next = new Set(prev);
      for (const peerId of currentPeers) {
        if (next.has(peerId)) {
          next.delete(peerId);
          changed = true;
        }
      }
      if (changed && next.size === 0) {
         // Stop outgoing ring if no one is ringing anymore
         audioManager.stopAll();
      }
      return changed ? next : prev;
    });
  }, [currentPeers]);

  const handleRing = (targetUserId: string) => {
    if (!socket || !user) return;
    
    socket.emit('call-invite', {
      toId: targetUserId,
      roomId,
      callerName: user.name || user.email,
    });

    setRingingUsers(prev => new Set(prev).add(targetUserId));
    
    // Play outgoing ring (since we are ringing a new user)
    try { audioManager.playOutgoingRing(); } catch (e) {}
  };

  const availableUsers = users.filter(u => 
    u.id !== user?.id && // don't show yourself
    u.id !== initialTarget && // don't show the initial target
    !currentPeers.includes(u.id) && 
    (u.name?.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Add Participant"
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink shadow-soft transition hover:-translate-y-0.5 hover:border-signal/40 hover:shadow-lift"
      >
        <UserPlus className="h-5 w-5" />
        <span className="hidden sm:inline">Add Participant</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-ink">Add Participant</h2>
              <button onClick={() => setIsOpen(false)} className="text-muted hover:text-ink">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4 relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-muted" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="block w-full rounded-xl border-line bg-canvas py-2.5 pl-10 pr-4 focus:border-signal sm:text-sm"
              />
            </div>
            
            <ul className="flex-1 overflow-y-auto space-y-2 pr-2">
              {availableUsers.map(u => {
                const isOnline = onlineUsers.has(u.id);
                const isRinging = ringingUsers.has(u.id);
                
                return (
                  <li key={u.id} className="flex items-center justify-between p-3 rounded-2xl bg-canvas border border-line hover:border-signal/30 transition">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
                        <UserCircle2 className="h-6 w-6" />
                        <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-canvas ${isOnline ? 'bg-bridge' : 'bg-muted'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-ink">{u.name || 'Anonymous User'}</p>
                        <p className="text-xs text-muted truncate max-w-[150px] sm:max-w-[200px]">{u.email}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRing(u.id)}
                      disabled={!isOnline || isRinging}
                      className={`flex min-h-9 items-center justify-center gap-2 rounded-xl px-4 py-1.5 text-sm font-semibold transition-colors ${
                        isRinging 
                          ? 'bg-bridge/20 text-bridge'
                          : isOnline 
                            ? 'bg-bridge text-white hover:bg-bridge/90' 
                            : 'bg-surface text-muted cursor-not-allowed border border-line'
                      }`}
                    >
                      {isRinging ? 'Ringing...' : (
                        <>
                          <Phone className="h-4 w-4" />
                          Ring
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
              {availableUsers.length === 0 && (
                <p className="text-center text-muted mt-6 text-sm">No other users found to invite.</p>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
