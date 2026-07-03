'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Captions,
  CaptionsOff,
  Hand,
  PhoneOff,
  AlertCircle,
  Loader2,
  MonitorUp,
  MonitorOff,
  User,
  Maximize,
  Minimize,
  Move,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { useT, type TFunction } from '@/lib/i18n/use-translation';
import { useMeshCall, type CallStatus } from '@/lib/call/use-mesh-call';
import { TextToSignAvatar } from '@/lib/avatar/TextToSignAvatar';

function statusText(t: TFunction, status: CallStatus): string {
  const map: Record<CallStatus, string> = {
    idle: t('call.status.idle'),
    connecting: 'Waiting for others to join...',
    connected: t('call.status.connected'),
    reconnecting: t('call.status.reconnecting'),
    ended: t('call.status.ended'),
    error: t('call.status.error'),
  };
  return map[status];
}

import { useSocket } from '@/lib/socket-context';
import { audioManager } from '@/lib/call/audio-manager';
import { AddParticipantModal } from '@/components/AddParticipantModal';

function RemoteVideo({ stream, captionsEnabled, caption, signEnabled, sign, t, isFocused, onFocus, onUnfocus }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full min-h-0 bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        aria-label={t('call.remoteVideo')}
        className="h-full w-full object-cover"
      />
      {captionsEnabled && caption && (
        <div
          aria-live="polite"
          className="absolute inset-x-0 bottom-0 bg-zinc-900/70 px-4 py-2 text-center text-sm sm:text-base font-semibold text-zinc-50"
        >
          {caption}
        </div>
      )}
      {signEnabled && sign && (
        <div
          aria-live="polite"
          className="absolute left-2 top-2 rounded-lg bg-signal/90 px-2 py-1 text-xs font-semibold text-surface max-w-[80%] truncate"
        >
          {t('call.signPrefix', { sign })}
        </div>
      )}
      {/* Full Screen Controls */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        {isFocused ? (
          <button onClick={onUnfocus} className="p-2 bg-black/60 hover:bg-black/90 rounded-lg text-white backdrop-blur-sm" title="Exit Full Screen">
            <Minimize className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={onFocus} className="p-2 bg-black/60 hover:bg-black/90 rounded-lg text-white backdrop-blur-sm" title="Full Screen">
            <Maximize className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function CallRoomPage({
  params,
  searchParams,
}: {
  params: { roomId: string };
  searchParams: { ringing?: string; target?: string };
}) {
  const { settings } = useSettings();
  const t = useT();
  const call = useMeshCall(params.roomId);
  const { socket } = useSocket();
  const { accessToken, isLoading } = useAuth();
  const startedRef = useRef(false);
  const [rejected, setRejected] = useState(false);
  const [pipPosition, setPipPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [focusedPeer, setFocusedPeer] = useState<string | null>(null);

  const endCallRef = useRef(call.endCall);
  endCallRef.current = call.endCall;

  const currentCaption = Object.values(call.captions).find((c) => !!c) || '';
  const [avatarText, setAvatarText] = useState('');
  const [isAvatarPlaying, setIsAvatarPlaying] = useState(false);
  const lastPlayedTokensRef = useRef('');

  useEffect(() => {
    if (currentCaption) {
      // Normalize to letters/numbers to match the avatar's tokenization logic
      const normalized = currentCaption.toUpperCase().replace(/[^A-Z0-9]/g, '');

      // Only trigger a new animation if the letters actually changed.
      // This prevents double-playback when 'hello ' (interim) becomes 'Hello.' (final)
      if (normalized && normalized !== lastPlayedTokensRef.current) {
        setAvatarText(currentCaption);
        setIsAvatarPlaying(true);
        lastPlayedTokensRef.current = normalized;
      }
    } else {
      // Caption cleared from screen (5s timeout), reset so identical future sentences will play
      lastPlayedTokensRef.current = '';
    }
  }, [currentCaption]);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Clean up WebRTC completely if this component unmounts (e.g. React Strict Mode or navigating away).
  useEffect(() => {
    return () => {
      endCallRef.current();
      setIsAvatarPlaying(false);
    };
  }, []);

  // Start once socket is ready (or if we know they aren't signed in, so we can show the auth error).
  useEffect(() => {
    if (startedRef.current) return;
    if (!isLoading && !accessToken) {
      startedRef.current = true;
      void call.start();
      return;
    }
    if (!socket) return;

    startedRef.current = true;
    void call.start();

    return () => {
      startedRef.current = false;
    };
  }, [socket, call.start, isLoading, accessToken]);

  const statusRef = useRef(call.status);

  useEffect(() => {
    // Transition edges
    if (statusRef.current === 'connecting' && call.status === 'connected') {
      try {
        audioManager.playPickup();
      } catch (e) {}
    } else if (statusRef.current !== 'ended' && call.status === 'ended') {
      try {
        audioManager.playEnd();
      } catch (e) {}
    }

    // Outgoing ring loop when in connecting state and ringing requested
    if (call.status === 'connecting' && searchParams.ringing === 'true') {
      try {
        audioManager.playOutgoingRing();
      } catch (e) {}
    } else if (call.status !== 'connecting') {
      audioManager.stopAll();
    }

    statusRef.current = call.status;
  }, [call.status, searchParams.ringing]);

  const cancelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (cancelTimeoutRef.current) {
      clearTimeout(cancelTimeoutRef.current);
      cancelTimeoutRef.current = null;
    }

    if (!socket || !searchParams.target) return;
    const onRejected = () => setRejected(true);
    socket.on('call-rejected', onRejected);

    return () => {
      socket.off('call-rejected', onRejected);
      // Cancel the call if we navigate away before it connects
      if (statusRef.current !== 'connected' && statusRef.current !== 'ended') {
        cancelTimeoutRef.current = setTimeout(() => {
          if (socket.connected) {
            socket.emit('call-cancel', { toId: searchParams.target });
          }
        }, 500);
      }
    };
  }, [socket, searchParams.target]);

  useEffect(() => {
    if (localVideoRef.current && call.localStream) {
      localVideoRef.current.srcObject = call.localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [call.localStream]);

  if (rejected) {
    return (
      <div className="card mx-auto max-w-md animate-fade-up p-8 text-center">
        <p className="font-display text-xl font-semibold text-ink">Call Declined</p>
        <p className="mt-1 text-sm text-muted">The user declined your call.</p>
        <Link href="/contacts" className="btn-primary mt-4 px-6 py-3">
          Back to Contacts
        </Link>
      </div>
    );
  }

  if (call.status === 'ended') {
    return (
      <div className="card mx-auto max-w-md animate-fade-up p-8 text-center">
        <p className="font-display text-xl font-semibold text-ink">{t('call.endedTitle')}</p>
        <p className="mt-1 text-sm text-muted">{t('call.endedNote')}</p>
        <Link href="/history" className="btn-primary mt-4 px-6 py-3">
          {t('call.viewInHistory')}
        </Link>
      </div>
    );
  }

  const remotePeerIds = Object.keys(call.remoteStreams);
  const gridCols =
    remotePeerIds.length > 4
      ? 'grid-cols-3'
      : remotePeerIds.length > 1
        ? 'grid-cols-2'
        : 'grid-cols-1';

  return (
    <div className="animate-fade-up flex flex-col h-[calc(100vh-8rem)]">
      {/* Connection status — icon + text, announced politely. */}
      <p aria-live="polite" className="chip mb-3 inline-flex normal-case tracking-normal text-ink">
        {call.status === 'connected' ? (
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-bridge" />
        ) : call.status === 'error' ? (
          <AlertCircle aria-hidden="true" className="h-4 w-4 text-beacon" />
        ) : (
          <Loader2
            aria-hidden="true"
            className={`h-4 w-4 text-muted ${settings.reduceMotion ? '' : 'animate-spin'}`}
          />
        )}
        {call.status === 'error' && call.error
          ? call.error
          : call.status === 'connecting' && searchParams.ringing === 'true'
            ? 'Ringing...'
            : statusText(t, call.status)}
      </p>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-line bg-canvas shadow-soft flex">
        {/* Remote videos grid */}
        <div className={`relative flex-1 bg-canvas grid ${focusedPeer ? 'grid-cols-1' : gridCols} gap-2 p-2`}>
          {remotePeerIds.length > 0 ? (
            remotePeerIds.map((peerId) => {
              if (focusedPeer && focusedPeer !== peerId) return null;
              return (
                <RemoteVideo
                  key={peerId}
                  peerId={peerId}
                  stream={call.remoteStreams[peerId]}
                  captionsEnabled={call.captionsEnabled}
                  caption={call.captions[peerId]}
                  signEnabled={call.signEnabled}
                  sign={call.remoteSigns[peerId]}
                  t={t}
                  isFocused={focusedPeer === peerId}
                  onFocus={() => setFocusedPeer(peerId)}
                  onUnfocus={() => setFocusedPeer(null)}
                />
              );
            })
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted">
              <User aria-hidden="true" className="h-16 w-16 opacity-30" />
            </div>
          )}
        </div>

        {/* Text-to-Sign Avatar Translation (Picture-in-Picture) */}
        {call.captionsEnabled && isAvatarPlaying && (
          <div className="absolute right-4 top-4 z-10 h-32 w-48 overflow-hidden rounded-xl border border-canvas/40 shadow-lift sm:h-40 sm:w-56">
            <TextToSignAvatar text={avatarText} onFinish={() => setIsAvatarPlaying(false)} />
          </div>
        )}

        {/* Local video (picture-in-picture). */}
        <div
          className={`absolute h-28 w-40 rounded-xl border border-canvas/40 object-cover shadow-lift sm:h-32 sm:w-48 overflow-hidden z-20 transition-all duration-300 group ${
            pipPosition === 'top-left' ? 'top-4 left-4' :
            pipPosition === 'top-right' ? 'top-4 right-4' :
            pipPosition === 'bottom-left' ? 'bottom-4 left-4' :
            'bottom-4 right-4'
          } ${call.screenEnabled ? '' : '-scale-x-100'}`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            aria-label={t('call.yourVideo')}
            className="h-full w-full object-cover"
          />
          {/* PiP Move Button */}
          <button
            onClick={() => setPipPosition(prev => {
              if (prev === 'bottom-right') return 'bottom-left';
              if (prev === 'bottom-left') return 'top-left';
              if (prev === 'top-left') return 'top-right';
              return 'bottom-right';
            })}
            className={`absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/90 backdrop-blur-sm rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity z-30 ${call.screenEnabled ? '' : '-scale-x-100'}`}
            title="Move Video"
          >
            <Move className="w-4 h-4" />
          </button>
          
          {/* Local Captions overlay */}
          {call.captionsEnabled && call.captions['local'] && (
            <div
              aria-live="polite"
              className={`absolute inset-x-0 bottom-0 bg-zinc-900/70 px-2 py-1 text-center text-xs sm:text-sm font-semibold text-zinc-50 ${call.screenEnabled ? '' : '-scale-x-100'}`}
            >
              {call.captions['local']}
            </div>
          )}

          {/* Local Sign overlay */}
          {call.signEnabled && call.remoteSigns['local'] && (
            <div
              aria-live="polite"
              className={`absolute left-2 top-2 rounded-lg bg-signal/90 px-2 py-1 text-xs font-semibold text-surface max-w-[80%] truncate ${call.screenEnabled ? '' : '-scale-x-100'}`}
            >
              {t('call.signPrefix', { sign: call.remoteSigns['local'] })}
            </div>
          )}
        </div>
      </div>

      {/* Controls bar. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ControlButton
          onClick={call.toggleMic}
          pressed={!call.micEnabled}
          label={call.micEnabled ? t('call.muteMic') : t('call.unmuteMic')}
          icon={call.micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          text={call.micEnabled ? t('call.micOn') : t('call.micOff')}
        />
        <ControlButton
          onClick={call.toggleCamera}
          pressed={!call.cameraEnabled}
          label={call.cameraEnabled ? t('call.cameraOffAction') : t('call.cameraOnAction')}
          icon={
            call.cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />
          }
          text={call.cameraEnabled ? t('call.cameraOn') : t('call.cameraOff')}
        />
        <ControlButton
          onClick={call.toggleCaptions}
          pressed={call.captionsEnabled}
          label={call.captionsEnabled ? t('call.captionsOffAction') : t('call.captionsOnAction')}
          icon={
            call.captionsEnabled ? (
              <Captions className="h-5 w-5" />
            ) : (
              <CaptionsOff className="h-5 w-5" />
            )
          }
          text={call.captionsEnabled ? t('call.captionsOn') : t('call.captionsOff')}
        />
        <ControlButton
          onClick={call.toggleSignOverlay}
          pressed={call.signEnabled}
          label={call.signEnabled ? t('call.signOffAction') : t('call.signOnAction')}
          icon={<Hand className="h-5 w-5" />}
          text={call.signEnabled ? t('call.signOn') : t('call.signOff')}
        />
        <ControlButton
          onClick={call.toggleScreenShare}
          pressed={call.screenEnabled}
          label={call.screenEnabled ? 'Stop sharing screen' : 'Share screen'}
          icon={
            call.screenEnabled ? (
              <MonitorOff className="h-5 w-5" />
            ) : (
              <MonitorUp className="h-5 w-5" />
            )
          }
          text={call.screenEnabled ? 'Stop sharing' : 'Share screen'}
        />

        {/* Add Participant Modal component handling its own UI state */}
        {(call.status === 'connected' || call.status === 'connecting') && (
          <AddParticipantModal
            roomId={params.roomId}
            currentPeers={remotePeerIds}
            initialTarget={searchParams.target}
          />
        )}

        <button
          type="button"
          onClick={() => {
            audioManager.stopAll();
            call.endCall();
          }}
          className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-beacon px-6 py-2.5 font-medium text-surface shadow-lift transition hover:opacity-90"
        >
          <PhoneOff aria-hidden="true" className="h-5 w-5" />
          {t('call.endCall')}
        </button>
      </div>

      {!call.sttSupported && call.captionsEnabled && (
        <p className="mt-3 text-sm text-muted">{t('call.sttUnsupported')}</p>
      )}
    </div>
  );
}

function ControlButton({
  onClick,
  pressed,
  label,
  icon,
  text,
}: {
  onClick: () => void;
  pressed: boolean;
  label: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-soft transition ${
        pressed
          ? 'border-signal bg-aurora-soft text-signalInk ring-1 ring-inset ring-signal/20'
          : 'border-line bg-surface text-ink hover:-translate-y-0.5 hover:border-signal/40 hover:shadow-lift'
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      {text}
    </button>
  );
}
