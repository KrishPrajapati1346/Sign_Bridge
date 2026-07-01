'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CallDataMessage, MessageModality, SignalMessage } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { useSpeechToText } from '@/lib/speech/use-speech-to-text';
import { addMessage } from '@/lib/conversations-api';
// Reuse the Phase 5 recognition modules directly on the call's local stream
// (no second camera), so the sign overlay degrades gracefully with no model.
import { getHandLandmarker, detect } from '@/lib/sign/hand-landmarker';
import { extractFeatures } from '@/lib/sign/landmark-features';
import { loadClassifier, predict } from '@/lib/sign/classifier';
import { displayLabel } from '@/lib/sign/vocabulary';
import { translate } from '@/lib/translation-api';
import { reconstructGrammar } from '@/lib/grammar-api';
import { createCall } from './calls-api';
import { attachSignaling, type Signaling } from './signaling';
import { useSocket } from '@/lib/socket-context';
import { PeerConnection } from './peer-connection';

export type CallStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'ended' | 'error';

const SIGN_CONFIDENCE = 0.85;
const SIGN_INTERVAL_MS = 150;

interface StoredCallConfig {
  conversationId: string;
  iceServers: import('@signbridge/shared-types').IceServerConfig[];
}

/** Reads the creator's stashed call config (so they don't create a 2nd convo). */
function readStoredConfig(roomId: string): StoredCallConfig | null {
  try {
    const raw = sessionStorage.getItem(`call:${roomId}`);
    return raw ? (JSON.parse(raw) as StoredCallConfig) : null;
  } catch {
    return null;
  }
}

export function useCall(roomId: string) {
  const { authFetch, accessToken } = useAuth();
  const { socket } = useSocket();
  const { settings } = useSettings();
  const lang = settings.interfaceLanguage;

  const [status, setStatus] = useState<CallStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [captions, setCaptions] = useState('');
  const [remoteSign, setRemoteSign] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [signEnabled, setSignEnabled] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);

  const signalingRef = useRef<Signaling | null>(null);
  const peerRef = useRef<PeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const iceServersRef = useRef<StoredCallConfig['iceServers']>([]);
  const signBufferRef = useRef<string[]>([]);
  const signDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sign-recognition loop state.
  const signVideoRef = useRef<HTMLVideoElement | null>(null);
  const signIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signBusyRef = useRef(false);
  const lastSignRef = useRef<string | null>(null);

  const persist = useCallback(
    (modality: MessageModality, content: string, sender: 'USER' | 'PARTNER' = 'USER') => {
      const id = conversationIdRef.current;
      if (!id) return;
      void addMessage(authFetch, id, { sender, modality, language: lang, content }).catch(
        () => {
          /* best-effort transcript persistence */
        },
      );
    },
    [authFetch, lang],
  );

  // ---- Captions: local STT -> data channel + persistence ------------------
  const handleSpeechFinal = useCallback(
    (text: string) => {
      peerRef.current?.send({ kind: 'caption', text, language: lang, final: true });
      persist('SPEECH', text);
    },
    [lang, persist],
  );

  const stt = useSpeechToText({ lang, onFinal: handleSpeechFinal });

  // Stream interim captions to the peer as they're recognized.
  useEffect(() => {
    if (captionsEnabled && stt.interimText) {
      peerRef.current?.send({
        kind: 'caption',
        text: stt.interimText,
        language: lang,
        final: false,
      });
    }
  }, [stt.interimText, captionsEnabled, lang]);

  // Start/stop captions with the toggle while connected.
  // Also auto-restart if the browser stops listening after silence but the toggle is still on.
  useEffect(() => {
    if (status === 'connected' && captionsEnabled && stt.supported && !stt.isListening) {
      stt.start();
    } else if (!captionsEnabled && stt.isListening) {
      stt.stop();
    }
  }, [status, captionsEnabled, stt.supported, stt.isListening, stt]);

  // ---- Sign overlay: recognize from local stream, send to peer ------------
  const stopSignLoop = useCallback(() => {
    if (signIntervalRef.current) {
      clearInterval(signIntervalRef.current);
      signIntervalRef.current = null;
    }
    signVideoRef.current?.pause();
    signVideoRef.current = null;
    lastSignRef.current = null;
  }, []);

  const startSignLoop = useCallback(async () => {
    if (!localStreamRef.current || signIntervalRef.current) return;
    const loaded = await loadClassifier();
    if (!loaded) return; // no trained model — overlay simply stays empty
    const landmarker = await getHandLandmarker();

    const video = document.createElement('video');
    video.srcObject = localStreamRef.current;
    video.muted = true;
    video.playsInline = true;
    await video.play();
    signVideoRef.current = video;

    signIntervalRef.current = setInterval(() => {
      const v = signVideoRef.current;
      if (!v || v.readyState < 2 || signBusyRef.current) return;
      signBusyRef.current = true;
      void (async () => {
        try {
          const hands = detect(landmarker, v, performance.now());
          const { features, handCount } = extractFeatures(hands);
          if (handCount === 0) {
            lastSignRef.current = null;
            return;
          }
          const pred = await predict(features);
          if (pred && pred.confidence >= SIGN_CONFIDENCE) {
            if (pred.label !== lastSignRef.current) {
              lastSignRef.current = pred.label;
              const text = displayLabel(pred.label);
              
              signBufferRef.current.push(text);
              peerRef.current?.send({ kind: 'sign', text, final: false });
              
              if (signDebounceRef.current) clearTimeout(signDebounceRef.current);
              signDebounceRef.current = setTimeout(() => {
                void flushSignBuffer();
              }, 2500);
            }
          }
        } finally {
          signBusyRef.current = false;
        }
      })();
    }, SIGN_INTERVAL_MS);
  }, [flushSignBuffer]);

  useEffect(() => {
    if (signEnabled && status === 'connected') void startSignLoop();
    else stopSignLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signEnabled, status]);

  // ---- Peer wiring --------------------------------------------------------
  const makePeer = useCallback((): PeerConnection => {
    const signaling = signalingRef.current!;
    const peer = new PeerConnection(iceServersRef.current, {
      onRemoteStream: (stream) => {
        setRemoteStream(stream);
        setStatus('connected');
      },
      onData: (msg: CallDataMessage) => {
        if (msg.kind === 'caption') {
          if (msg.language !== lang) {
            if (msg.final) {
              setCaptions(`${msg.text} (Translating...)`);
              void translate(authFetch, { text: msg.text, from: msg.language, to: lang }).then((res) => {
                setCaptions(res.text);
                persist('SPEECH', res.text, 'PARTNER');
              });
            } else {
              setCaptions(msg.text);
            }
          } else {
            setCaptions(msg.text);
            if (msg.final) persist('SPEECH', msg.text, 'PARTNER');
          }
        } else {
          if (msg.final) {
            setRemoteSign(msg.text);
            persist('SIGN', msg.text, 'PARTNER');
          } else {
            setRemoteSign((prev) => (prev && prev !== msg.text ? `${prev} ${msg.text}` : msg.text));
          }
        }
      },
      onSignal: (msg) => signaling.sendSignal(msg),
      onConnectionState: (state) => {
        if (state === 'connected') setStatus('connected');
        else if (state === 'disconnected' || state === 'failed') setStatus('reconnecting');
      },
    });
    if (localStreamRef.current) peer.addLocalStream(localStreamRef.current);
    peerRef.current = peer;
    return peer;
  }, [authFetch, lang, persist]);

  const start = useCallback(async () => {
    if (!accessToken) {
      setError('You need to be signed in to start a call.');
      setStatus('error');
      return;
    }
    setStatus('connecting');
    setError(null);

    // Resolve this participant's conversation + ICE servers.
    try {
      const stored = readStoredConfig(roomId);
      if (stored) {
        conversationIdRef.current = stored.conversationId;
        iceServersRef.current = stored.iceServers;
        sessionStorage.removeItem(`call:${roomId}`);
      } else {
        const created = await createCall(authFetch);
        conversationIdRef.current = created.conversationId;
        iceServersRef.current = created.iceServers;
      }
    } catch {
      setError('Could not set up the call. Please try again.');
      setStatus('error');
      return;
    }

    // Local media.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;
      cameraTrackRef.current = stream.getVideoTracks()[0] ?? null;
      setLocalStream(stream);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      setError(
        name === 'NotAllowedError'
          ? 'Camera/microphone access is blocked. Allow it in your browser’s site settings and rejoin.'
          : name === 'NotFoundError'
            ? 'No camera or microphone was found.'
            : 'Could not access your camera and microphone.',
      );
      setStatus('error');
      return;
    }

    // Signaling.
    if (!socket) {
      setError('Connection to server lost. Please refresh.');
      setStatus('error');
      return;
    }
    const signaling = attachSignaling(socket);
    signalingRef.current = signaling;

    signaling.onRoomFull(() => {
      setError('This call already has two people.');
      setStatus('error');
    });

    // The existing occupant becomes the initiator when a peer joins.
    signaling.onPeerJoined(() => {
      void (async () => {
        const peer = makePeer();
        peer.openDataChannel();
        const offer = await peer.createOffer();
        signaling.sendSignal(offer);
      })();
    });

    signaling.onSignal((msg: SignalMessage) => {
      void (async () => {
        const peer = peerRef.current ?? makePeer();
        if (msg.type === 'offer') {
          const answer = await peer.handleOffer(msg.sdp);
          signaling.sendSignal(answer);
        } else if (msg.type === 'answer') {
          await peer.handleAnswer(msg.sdp);
        } else {
          await peer.addIceCandidate(msg.candidate);
        }
      })();
    });

    signaling.onPeerLeft(() => {
      peerRef.current?.close();
      peerRef.current = null;
      setRemoteStream(null);
      setCaptions('');
      setRemoteSign('');
      setStatus('reconnecting');
    });

    signaling.join(roomId);
  }, [accessToken, authFetch, makePeer, roomId]);

  const endCall = useCallback(() => {
    stopSignLoop();
    stt.stop();
    peerRef.current?.close();
    peerRef.current = null;
    signalingRef.current?.leave();
    signalingRef.current?.disconnect();
    signalingRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setStatus('ended');
  }, [stopSignLoop, stt]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !micEnabled;
    stream.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicEnabled(next);
  }, [micEnabled]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !cameraEnabled;
    stream.getVideoTracks().forEach((t) => (t.enabled = next));
    setCameraEnabled(next);
  }, [cameraEnabled]);

  const toggleCaptions = useCallback(() => setCaptionsEnabled((v) => !v), []);
  const toggleSignOverlay = useCallback(() => setSignEnabled((v) => !v), []);

  const toggleScreenShare = useCallback(async () => {
    if (!localStreamRef.current || !peerRef.current) return;
    
    if (screenEnabled) {
      // Revert to camera
      const cameraTrack = cameraTrackRef.current;
      if (cameraTrack) {
         peerRef.current.replaceVideoTrack(cameraTrack);
         const newStream = new MediaStream([cameraTrack, ...localStreamRef.current.getAudioTracks()]);
         localStreamRef.current = newStream;
         setLocalStream(newStream);
         setScreenEnabled(false);
      }
    } else {
      // Start screen share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        screenTrack.onended = () => {
          // User clicked "Stop sharing" via browser UI
          const cameraTrack = cameraTrackRef.current;
          if (cameraTrack && peerRef.current && localStreamRef.current) {
            peerRef.current.replaceVideoTrack(cameraTrack);
            const newStream = new MediaStream([cameraTrack, ...localStreamRef.current.getAudioTracks()]);
            localStreamRef.current = newStream;
            setLocalStream(newStream);
            setScreenEnabled(false);
          }
        };

        peerRef.current.replaceVideoTrack(screenTrack);
        const newStream = new MediaStream([screenTrack, ...localStreamRef.current.getAudioTracks()]);
        localStreamRef.current = newStream;
        setLocalStream(newStream);
        setScreenEnabled(true);
      } catch {
        // User denied screen share
      }
    }
  }, [screenEnabled]);

  const flushSignBuffer = useCallback(async () => {
    if (signBufferRef.current.length === 0) return;
    const words = [...signBufferRef.current];
    signBufferRef.current = [];
    
    const sentence = await reconstructGrammar(authFetch, words, lang);
    peerRef.current?.send({ kind: 'sign', text: sentence, final: true });
    persist('SIGN', sentence);
  }, [authFetch, lang, persist]);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      if (signDebounceRef.current) clearTimeout(signDebounceRef.current);
      stopSignLoop();
      peerRef.current?.close();
      signalingRef.current?.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [stopSignLoop]);

  return {
    status,
    error,
    localStream,
    remoteStream,
    captions,
    remoteSign,
    micEnabled,
    cameraEnabled,
    captionsEnabled,
    signEnabled,
    screenEnabled,
    sttSupported: stt.supported,
    conversationId: conversationIdRef.current,
    start,
    endCall,
    toggleMic,
    toggleCamera,
    toggleCaptions,
    toggleSignOverlay,
    toggleScreenShare,
  };
}
