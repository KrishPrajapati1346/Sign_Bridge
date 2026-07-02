'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CallDataMessage, MessageModality, SignalMessage } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { useSpeechToText } from '@/lib/speech/use-speech-to-text';
import { addMessage } from '@/lib/conversations-api';
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

function readStoredConfig(roomId: string): StoredCallConfig | null {
  try {
    const raw = sessionStorage.getItem(`call:${roomId}`);
    return raw ? (JSON.parse(raw) as StoredCallConfig) : null;
  } catch {
    return null;
  }
}

export function useMeshCall(roomId: string) {
  const { authFetch, accessToken } = useAuth();
  const { socket } = useSocket();
  const { settings } = useSettings();
  const lang = settings.interfaceLanguage;

  const [status, setStatus] = useState<CallStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Mesh Network state
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [remoteSigns, setRemoteSigns] = useState<Record<string, string>>({});

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [signEnabled, setSignEnabled] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);

  const signalingRef = useRef<Signaling | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const iceServersRef = useRef<StoredCallConfig['iceServers']>([]);
  const signBufferRef = useRef<string[]>([]);
  const signDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const remoteSignDebounceRef = useRef<Record<string, NodeJS.Timeout>>({});
  const remoteCaptionDebounceRef = useRef<Record<string, NodeJS.Timeout>>({});
  const startBusyRef = useRef(false);
  const startSessionRef = useRef<number>(0);

  // Sign-recognition loop state.
  const signVideoRef = useRef<HTMLVideoElement | null>(null);
  const signIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signBusyRef = useRef(false);
  const lastSignRef = useRef<string | null>(null);

  const persist = useCallback(
    (modality: MessageModality, content: string, sender: 'USER' | 'PARTNER' = 'USER') => {
      const id = conversationIdRef.current;
      if (!id) return;
      void addMessage(authFetch, id, { sender, modality, language: lang, content }).catch(() => {});
    },
    [authFetch, lang],
  );

  const broadcastToPeers = useCallback((msg: CallDataMessage) => {
    peersRef.current.forEach((peer) => peer.send(msg));
  }, []);

  // ---- Captions: local STT -> data channel + persistence ------------------
  const handleSpeechFinal = useCallback(
    (text: string) => {
      broadcastToPeers({ kind: 'caption', text, language: lang, final: true });
      persist('SPEECH', text);

      setCaptions((prev) => ({ ...prev, local: text }));
      if (remoteCaptionDebounceRef.current['local'])
        clearTimeout(remoteCaptionDebounceRef.current['local']);
      remoteCaptionDebounceRef.current['local'] = setTimeout(() => {
        setCaptions((prev) => {
          const next = { ...prev };
          delete next['local'];
          return next;
        });
      }, 5000);
    },
    [lang, persist, broadcastToPeers],
  );

  const stt = useSpeechToText({ lang, onFinal: handleSpeechFinal });

  useEffect(() => {
    if (captionsEnabled && stt.interimText) {
      broadcastToPeers({
        kind: 'caption',
        text: stt.interimText,
        language: lang,
        final: false,
      });
      setCaptions((prev) => ({ ...prev, local: stt.interimText }));

      if (remoteCaptionDebounceRef.current['local'])
        clearTimeout(remoteCaptionDebounceRef.current['local']);
      remoteCaptionDebounceRef.current['local'] = setTimeout(() => {
        setCaptions((prev) => {
          const next = { ...prev };
          delete next['local'];
          return next;
        });
      }, 2500);
    }
  }, [stt.interimText, captionsEnabled, lang, broadcastToPeers]);

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

  const flushSignBuffer = useCallback(async () => {
    if (signBufferRef.current.length === 0) return;
    const words = [...signBufferRef.current];
    signBufferRef.current = [];

    const sentence = await reconstructGrammar(authFetch, words, lang);
    broadcastToPeers({ kind: 'sign', text: sentence, final: true });
    persist('SIGN', sentence);

    setRemoteSigns((prev) => ({ ...prev, local: sentence }));

    // Clear local sign after 5s
    if (remoteSignDebounceRef.current['local'])
      clearTimeout(remoteSignDebounceRef.current['local']);
    remoteSignDebounceRef.current['local'] = setTimeout(() => {
      setRemoteSigns((prev) => {
        const next = { ...prev };
        delete next['local'];
        return next;
      });
    }, 5000);
  }, [authFetch, lang, persist, broadcastToPeers]);

  const startSignLoop = useCallback(async () => {
    if (!localStreamRef.current || signIntervalRef.current) return;
    const loaded = await loadClassifier();
    if (!loaded) return;
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
              broadcastToPeers({ kind: 'sign', text, final: false });

              setRemoteSigns((prev) => {
                const current = prev['local'];
                const next = current ? current + ' ' + text : text;
                return { ...prev, local: next };
              });

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
  }, [flushSignBuffer, broadcastToPeers]);

  useEffect(() => {
    if (signEnabled && status === 'connected') void startSignLoop();
    else stopSignLoop();
  }, [signEnabled, status, startSignLoop, stopSignLoop]);

  // ---- Peer wiring --------------------------------------------------------
  const removePeer = useCallback((peerId: string) => {
    const peer = peersRef.current.get(peerId);
    if (peer) {
      peer.close();
      peersRef.current.delete(peerId);
    }

    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
    setCaptions((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
    setRemoteSigns((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });

    if (peersRef.current.size === 0) {
      setStatus('reconnecting');
    }
  }, []);

  const makePeer = useCallback(
    (peerId: string): PeerConnection => {
      const signaling = signalingRef.current!;
      const peer = new PeerConnection(iceServersRef.current, {
        onRemoteStream: (stream) => {
          setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
          setStatus('connected');
        },
        onData: (msg: CallDataMessage) => {
          if (msg.kind === 'caption') {
            const updateCaption = (text: string, isFinal: boolean) => {
              setCaptions((prev) => ({ ...prev, [peerId]: text }));

              if (remoteCaptionDebounceRef.current[peerId])
                clearTimeout(remoteCaptionDebounceRef.current[peerId]);
              remoteCaptionDebounceRef.current[peerId] = setTimeout(
                () => {
                  setCaptions((prev) => {
                    const next = { ...prev };
                    delete next[peerId];
                    return next;
                  });
                },
                isFinal ? 5000 : 2500,
              );
            };

            if (msg.language !== lang) {
              if (msg.final) {
                updateCaption(`${msg.text} (Translating...)`, false); // Keep alive during translation
                void translate(authFetch, { text: msg.text, from: msg.language, to: lang }).then(
                  (res) => {
                    updateCaption(res.text, true);
                    persist('SPEECH', res.text, 'PARTNER');
                  },
                );
              } else {
                updateCaption(msg.text, false);
              }
            } else {
              updateCaption(msg.text, msg.final);
              if (msg.final) persist('SPEECH', msg.text, 'PARTNER');
            }
          } else {
            if (msg.final) {
              setRemoteSigns((prev) => ({ ...prev, [peerId]: msg.text }));
              persist('SIGN', msg.text, 'PARTNER');

              if (remoteSignDebounceRef.current[peerId])
                clearTimeout(remoteSignDebounceRef.current[peerId]);
              remoteSignDebounceRef.current[peerId] = setTimeout(() => {
                setRemoteSigns((prev) => {
                  const next = { ...prev };
                  delete next[peerId];
                  return next;
                });
              }, 5000); // Keep the final sentence visible for 5s
            } else {
              setRemoteSigns((prev) => {
                const current = prev[peerId];
                const next = current ? current + ' ' + msg.text : msg.text;
                return { ...prev, [peerId]: next };
              });
              // Clear interim sign after 2.5s if no more updates come in
              if (remoteSignDebounceRef.current[peerId])
                clearTimeout(remoteSignDebounceRef.current[peerId]);
              remoteSignDebounceRef.current[peerId] = setTimeout(() => {
                setRemoteSigns((prev) => {
                  const next = { ...prev };
                  delete next[peerId];
                  return next;
                });
              }, 2500);
            }
          }
        },
        onSignal: (msg) => signaling.sendSignal({ ...msg, toId: peerId }),
        onConnectionState: (state) => {
          if (state === 'connected') setStatus('connected');
          else if (state === 'disconnected' || state === 'failed') {
            removePeer(peerId);
          }
        },
      });

      if (localStreamRef.current) peer.addLocalStream(localStreamRef.current);
      peersRef.current.set(peerId, peer);
      return peer;
    },
    [authFetch, lang, persist, removePeer],
  );

  const start = useCallback(async () => {
    if (startBusyRef.current) return;

    if (!accessToken) {
      setError('You need to be signed in to start a call.');
      setStatus('error');
      return;
    }

    startBusyRef.current = true;
    setStatus('connecting');
    setError(null);

    const sessionId = ++startSessionRef.current;

    try {
      const stored = readStoredConfig(roomId);
      if (stored) {
        conversationIdRef.current = stored.conversationId;
        iceServersRef.current = stored.iceServers;
        sessionStorage.removeItem(`call:${roomId}`);
      } else {
        const created = await createCall(authFetch);
        if (startSessionRef.current !== sessionId) return;
        conversationIdRef.current = created.conversationId;
        iceServersRef.current = created.iceServers;
      }
    } catch {
      setError('Could not set up the call. Please try again.');
      setStatus('error');
      startBusyRef.current = false;
      return;
    }

    // Local media.
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch (e: any) {
        if (e.name === 'NotFoundError' || e.message?.includes('Requested device not found')) {
          // Fallback: Try just video, then just audio
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: 'user' } },
            });
          } catch (e2) {
            stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
          }
        } else {
          throw e;
        }
      }
      if (startSessionRef.current !== sessionId) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      localStreamRef.current = stream;
      cameraTrackRef.current = stream.getVideoTracks()[0] ?? null;
      setLocalStream(stream);
    } catch (err: any) {
      const name = err instanceof DOMException ? err.name : '';
      const msg = err.message || String(err);
      setError(
        name === 'NotAllowedError'
          ? 'Camera/microphone access is blocked.'
          : `Could not access camera/mic: ${name} - ${msg}`,
      );
      setStatus('error');
      startBusyRef.current = false;
      return;
    }

    if (!socket) {
      setError('Connection to server lost. Please refresh.');
      setStatus('error');
      startBusyRef.current = false;
      return;
    }
    const signaling = attachSignaling(socket);
    signalingRef.current = signaling;

    // In a mesh network, when we join, the server gives us a list of occupants.
    // We initiate offers to all of them.
    signaling.onRoomOccupants((occupants: string[]) => {
      occupants.forEach((peerId) => {
        void (async () => {
          const peer = makePeer(peerId);
          peer.openDataChannel();
          const offer = await peer.createOffer();
          signaling.sendSignal({ ...offer, toId: peerId });
        })();
      });
    });

    // When a new peer joins, we just wait for their offer.
    signaling.onPeerJoined((peerId: string) => {
      // The joiner will initiate the offer to us.
    });

    signaling.onSignal((msg: SignalMessage) => {
      const fromId = msg.fromId;
      if (!fromId) return;

      void (async () => {
        const peer = peersRef.current.get(fromId) ?? makePeer(fromId);

        if (msg.type === 'offer') {
          const answer = await peer.handleOffer(msg.sdp);
          signaling.sendSignal({ ...answer, toId: fromId });
        } else if (msg.type === 'answer') {
          await peer.handleAnswer(msg.sdp);
        } else if (msg.type === 'ice-candidate') {
          await peer.addIceCandidate(msg.candidate);
        }
      })();
    });

    signaling.onPeerLeft((peerId: string) => {
      removePeer(peerId);
    });

    signaling.join(roomId);
  }, [accessToken, authFetch, makePeer, roomId, removePeer, socket]);

  const endCall = useCallback(() => {
    ++startSessionRef.current;
    stopSignLoop();
    stt.stop();
    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    signalingRef.current?.leave();
    signalingRef.current?.disconnect();
    signalingRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStreams({});
    setStatus('ended');
    startBusyRef.current = false;
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
    if (!localStreamRef.current) return;

    if (screenEnabled) {
      const cameraTrack = cameraTrackRef.current;
      if (cameraTrack) {
        peersRef.current.forEach((peer) => peer.replaceVideoTrack(cameraTrack));
        const newStream = new MediaStream([
          cameraTrack,
          ...localStreamRef.current!.getAudioTracks(),
        ]);
        localStreamRef.current = newStream;
        setLocalStream(newStream);
        setScreenEnabled(false);
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          const cameraTrack = cameraTrackRef.current;
          if (cameraTrack && localStreamRef.current) {
            peersRef.current.forEach((peer) => peer.replaceVideoTrack(cameraTrack));
            const newStream = new MediaStream([
              cameraTrack,
              ...localStreamRef.current.getAudioTracks(),
            ]);
            localStreamRef.current = newStream;
            setLocalStream(newStream);
            setScreenEnabled(false);
          }
        };

        peersRef.current.forEach((peer) => peer.replaceVideoTrack(screenTrack));
        const newStream = new MediaStream([
          screenTrack,
          ...localStreamRef.current.getAudioTracks(),
        ]);
        localStreamRef.current = newStream;
        setLocalStream(newStream);
        setScreenEnabled(true);
      } catch {}
    }
  }, [screenEnabled]);

  useEffect(() => {
    return () => {
      if (signDebounceRef.current) clearTimeout(signDebounceRef.current);
      stopSignLoop();
      peersRef.current.forEach((peer) => peer.close());
      signalingRef.current?.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      startBusyRef.current = false;
    };
  }, [stopSignLoop]);

  return {
    status,
    error,
    localStream,
    remoteStreams,
    captions,
    remoteSigns,
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
