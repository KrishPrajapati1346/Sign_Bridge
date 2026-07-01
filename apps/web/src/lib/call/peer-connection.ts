import type {
  CallDataMessage,
  IceServerConfig,
  RtcIceCandidate,
  SignalMessage,
} from '@signbridge/shared-types';

const DATA_CHANNEL_LABEL = 'sb-data';

export interface PeerCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onData: (msg: CallDataMessage) => void;
  /** Emit a signaling message to the peer (offer/answer/ice-candidate). */
  onSignal: (msg: SignalMessage) => void;
  onConnectionState: (state: RTCPeerConnectionState) => void;
}

/**
 * Wraps an RTCPeerConnection plus the "sb-data" data channel used for captions
 * and sign text. The initiator (the existing room occupant) creates the offer
 * and the data channel; the answerer listens for both.
 */
export class PeerConnection {
  private pc: RTCPeerConnection;
  private dc: RTCDataChannel | null = null;

  constructor(
    iceServers: IceServerConfig[],
    private readonly cb: PeerCallbacks,
  ) {
    this.pc = new RTCPeerConnection({ iceServers });
    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.cb.onSignal({ type: 'ice-candidate', candidate: e.candidate.toJSON() });
      }
    };
    this.pc.ontrack = (e) => {
      if (e.streams[0]) this.cb.onRemoteStream(e.streams[0]);
    };
    this.pc.onconnectionstatechange = () => this.cb.onConnectionState(this.pc.connectionState);
    this.pc.ondatachannel = (e) => this.setupChannel(e.channel);
  }

  addLocalStream(stream: MediaStream): void {
    stream.getTracks().forEach((track) => {
      const sender = this.pc.addTrack(track, stream);
      // For SignBridge, framerate is far more critical than resolution
      // so if bandwidth drops, WebRTC will drop resolution instead of making hands choppy.
      if (track.kind === 'video') {
        const params = sender.getParameters();
        if (params && !params.degradationPreference) {
          params.degradationPreference = 'maintain-framerate';
          sender.setParameters(params).catch(() => {});
        }
      }
    });
  }

  replaceVideoTrack(track: MediaStreamTrack): void {
    const sender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
    if (sender) {
      sender.replaceTrack(track).catch(() => {});
    }
  }

  /** Initiator only: open the data channel before creating the offer. */
  openDataChannel(): void {
    this.setupChannel(this.pc.createDataChannel(DATA_CHANNEL_LABEL));
  }

  private setupChannel(channel: RTCDataChannel): void {
    this.dc = channel;
    channel.onmessage = (e) => {
      try {
        this.cb.onData(JSON.parse(e.data as string) as CallDataMessage);
      } catch {
        // Ignore malformed data-channel payloads.
      }
    };
  }

  send(msg: CallDataMessage): void {
    if (this.dc && this.dc.readyState === 'open') this.dc.send(JSON.stringify(msg));
  }

  private signalingLock: Promise<void> = Promise.resolve();

  async createOffer(): Promise<SignalMessage> {
    return new Promise((resolve, reject) => {
      this.signalingLock = this.signalingLock.then(async () => {
        try {
          const offer = await this.pc.createOffer();
          await this.pc.setLocalDescription(offer);
          resolve({ type: 'offer', sdp: offer.sdp ?? '' });
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  async handleOffer(sdp: string): Promise<SignalMessage> {
    return new Promise((resolve, reject) => {
      this.signalingLock = this.signalingLock.then(async () => {
        try {
          await this.pc.setRemoteDescription({ type: 'offer', sdp });
          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          resolve({ type: 'answer', sdp: answer.sdp ?? '' });
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  async handleAnswer(sdp: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.signalingLock = this.signalingLock.then(async () => {
        try {
          await this.pc.setRemoteDescription({ type: 'answer', sdp });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  async addIceCandidate(candidate: RtcIceCandidate): Promise<void> {
    try {
      await this.pc.addIceCandidate(candidate);
    } catch {
      // Candidates can arrive before remote description; browsers buffer most.
    }
  }

  close(): void {
    this.dc?.close();
    this.pc.close();
  }
}
