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
  PenTool,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { useT, type TFunction } from '@/lib/i18n/use-translation';
import { useMeshCall, type CallStatus } from '@/lib/call/use-mesh-call';
import { TextToSignAvatar } from '@/lib/avatar/TextToSignAvatar';

function DrawCanvas({ peerId, videoRef }: { peerId: string, videoRef: React.RefObject<HTMLVideoElement> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const handleDraw = (e: CustomEvent) => {
      const msg = e.detail;
      const video = videoRef.current;
      if (video && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
      }
      const x = msg.x * canvas.width;
      const y = msg.y * canvas.height;
      if (msg.type === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isDrawing = false;
        return;
      }
      
      if (msg.type === 'start') {
        isDrawing = true;
        lastX = x;
        lastY = y;
      } else if (msg.type === 'move' && isDrawing) {
        ctx.beginPath();
        ctx.strokeStyle = msg.color || '#00ffcc';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastX = x;
        lastY = y;
      } else if (msg.type === 'end') {
        isDrawing = false;
      }
    };
    
    const listener = handleDraw as EventListener;
    window.addEventListener(`draw-${peerId}`, listener);
    
    return () => {
      window.removeEventListener(`draw-${peerId}`, listener);
    };
  }, [peerId, videoRef]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-10 object-cover" 
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

function LocalDrawOverlay({ videoRef, broadcast, enabled }: { videoRef: React.RefObject<HTMLVideoElement>, broadcast: any, enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!enabled) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      broadcast({ kind: 'draw', type: 'clear' });
      return;
    }
    
    let active = true;
    let isDrawing = false;
    
    const run = async () => {
      const { getHandLandmarker } = await import('@/lib/sign/hand-landmarker');
      const landmarker = await getHandLandmarker();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      let lastX = 0;
      let lastY = 0;
      let smoothX = 0;
      let smoothY = 0;

      const loop = () => {
        if (!active) {
          return;
        }
        
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
          }
          const results = landmarker.detectForVideo(video, performance.now());
          if (results.landmarks.length > 0) {
            const marks = results.landmarks[0];
            const indexTip = marks[8];
            const wrist = marks[0];
            const distIndex = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
            const distMiddle = Math.hypot(marks[12].x - wrist.x, marks[12].y - wrist.y);
            const distRing = Math.hypot(marks[16].x - wrist.x, marks[16].y - wrist.y);
            const distPinky = Math.hypot(marks[20].x - wrist.x, marks[20].y - wrist.y);
            
            // Check if pointing (index extended, others folded relative to wrist)
            const isPointing = distIndex > distMiddle * 1.5 && distIndex > distRing * 1.5 && distIndex > distPinky * 1.5;
            const color = '#39FF14';
            
            // EMA smoothing
            if (smoothX === 0 && smoothY === 0) {
              smoothX = indexTip.x;
              smoothY = indexTip.y;
            } else {
              smoothX = smoothX * 0.5 + indexTip.x * 0.5;
              smoothY = smoothY * 0.5 + indexTip.y * 0.5;
            }
            
            // Unmirrored canvas, so we manually flip X for local drawing to match the mirrored video.
            const x = (1.0 - smoothX) * canvas.width;
            const y = smoothY * canvas.height;

            if (isPointing) { 
              if (!isDrawing) {
                isDrawing = true;
                lastX = x;
                lastY = y;
                broadcast({ kind: 'draw', type: 'start', x: smoothX, y: smoothY, color });
              } else {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.stroke();
                lastX = x;
                lastY = y;
                broadcast({ kind: 'draw', type: 'move', x: smoothX, y: smoothY, color });
              }
            } else if (isDrawing) {
              isDrawing = false;
              broadcast({ kind: 'draw', type: 'end', x: smoothX, y: smoothY, color });
            }
          } else if (isDrawing) {
            isDrawing = false;
            broadcast({ kind: 'draw', type: 'end', x: 0, y: 0 });
          }
        }
        requestAnimationFrame(loop);
      };
      
      requestAnimationFrame(loop);
    };
    
    run();
    return () => { active = false; };
  }, [videoRef, broadcast, enabled]);

  if (!enabled) return null;

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-10 object-cover" 
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

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

function RemoteVideo({ peerId, stream, captionsEnabled, caption, signEnabled, sign, t }: any) {
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
      <DrawCanvas peerId={peerId} videoRef={videoRef} />
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
  const call = useMeshCall(params.roomId, {
    onDrawMessage: (peerId, msg) => {
      const ev = new CustomEvent(`draw-${peerId}`, { detail: msg });
      window.dispatchEvent(ev);
    }
  });
  const { socket } = useSocket();
  const { accessToken, isLoading } = useAuth();
  const startedRef = useRef(false);
  const [rejected, setRejected] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mainWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawEnabled, setDrawEnabled] = useState(false);

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

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!mainWrapperRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await mainWrapperRef.current.requestFullscreen();
      }
    } catch (err) {
      console.error('Error toggling fullscreen', err);
    }
  };

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
    <div ref={mainWrapperRef} className={`animate-fade-up flex flex-col ${isFullscreen ? 'h-screen w-screen bg-canvas p-4' : 'h-[calc(100vh-8rem)]'}`}>
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

      <div ref={containerRef} className="relative flex-1 overflow-hidden rounded-2xl border border-line bg-canvas shadow-soft flex">
        {/* Remote videos grid */}
        <div className={`relative flex-1 bg-canvas grid ${gridCols} gap-2 p-2`}>
          {remotePeerIds.length > 0 ? (
            remotePeerIds.map((peerId) => (
              <RemoteVideo
                key={peerId}
                peerId={peerId}
                stream={call.remoteStreams[peerId]}
                captionsEnabled={call.captionsEnabled}
                caption={call.captions[peerId]}
                signEnabled={call.signEnabled}
                sign={call.remoteSigns[peerId]}
                t={t}
              />
            ))
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
        <motion.div
          drag
          dragConstraints={containerRef}
          dragElastic={0.1}
          dragMomentum={false}
          className={`absolute bottom-4 right-4 h-28 w-40 rounded-xl border border-canvas/40 object-cover shadow-lift sm:h-32 sm:w-48 overflow-hidden z-20 transition-transform cursor-grab active:cursor-grabbing ${call.screenEnabled ? '' : '-scale-x-100'}`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            aria-label={t('call.yourVideo')}
            className="h-full w-full object-cover pointer-events-none"
          />
          <LocalDrawOverlay videoRef={localVideoRef} broadcast={call.broadcastToPeers} enabled={drawEnabled} />
          
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
        </motion.div>
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

        <ControlButton
          onClick={() => setDrawEnabled(!drawEnabled)}
          pressed={drawEnabled}
          label={drawEnabled ? 'Disable Air Drawing' : 'Enable Air Drawing'}
          icon={<PenTool className="h-5 w-5" />}
          text={drawEnabled ? 'Drawing On' : 'Drawing Off'}
        />

        <ControlButton
          onClick={toggleFullscreen}
          pressed={isFullscreen}
          label={isFullscreen ? 'Exit full screen' : 'Full screen'}
          icon={
            isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )
          }
          text={isFullscreen ? 'Exit FS' : 'Full Screen'}
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
