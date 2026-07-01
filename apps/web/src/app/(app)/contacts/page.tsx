'use client';

import { useCallback, useEffect, useState } from 'react';
import { Phone, Search, UserCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { API_URL } from '@/lib/auth-api';
import { PageHeader } from '@/components/PageHeader';
import { useSocket } from '@/lib/socket-context';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
}

export default function ContactsPage() {
  const { authFetch, user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [query, setQuery] = useState('');

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
    void loadUsers();
  }, [loadUsers]);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  );

  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;
    
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
  }, [socket]);

  const handleCall = (targetUserId: string) => {
    if (!socket || !user) return;
    
    // Generate a random room ID
    const roomId = Math.random().toString(36).substring(2, 9);
    
    // Emit call invite via global socket
    socket.emit('call-invite', {
      toId: targetUserId,
      roomId,
      callerName: user.name || user.email,
    });

    // Navigate to the call room as the initiator
    router.push(`/call/${roomId}?ringing=true&target=${targetUserId}`);
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title="Contacts" context="Call anyone in the SignBridge network" />

      <div className="mb-6 relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-muted" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="block w-full rounded-xl border-line bg-surface py-3 pl-10 pr-4 focus:border-signal focus:ring-signal sm:text-sm"
        />
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((u) => {
          const isOnline = onlineUsers.has(u.id);
          return (
            <li key={u.id} className="card p-5 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-canvas text-muted">
                  <UserCircle2 className="h-7 w-7" />
                  <div className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-surface ${isOnline ? 'bg-bridge' : 'bg-muted'}`} />
                </div>
                <div className="overflow-hidden">
                  <p className="truncate font-display font-semibold text-ink">
                    {u.name || 'Anonymous User'}
                  </p>
                  <p className="truncate text-sm text-muted">{u.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleCall(u.id)}
                disabled={!isOnline}
                className={`ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isOnline 
                    ? 'bg-bridge/10 text-bridge hover:bg-bridge hover:text-surface' 
                    : 'bg-canvas text-muted opacity-50 cursor-not-allowed'
                }`}
                aria-label={`Call ${u.name}`}
              >
                <Phone className="h-5 w-5" />
              </button>
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 && (
        <p className="text-center text-muted mt-10">No users found.</p>
      )}
    </div>
  );
}
