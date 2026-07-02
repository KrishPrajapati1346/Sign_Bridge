'use client';

class AudioManager {
  private ctx: AudioContext | null = null;
  private currentInterval: NodeJS.Timeout | null = null;

  private initCtx() {
    if (!this.ctx) {
      // Must use window prefix to satisfy TypeScript for older Safari versions if needed,
      // but standard AudioContext is broadly supported.
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public stopAll() {
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    const ctx = this.initCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Envelope to avoid popping
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(volume, ctx.currentTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  public playIncomingRing() {
    this.stopAll();
    // Fast double beep looping
    this.playTone(600, 'sine', 0.2, 0.15);
    setTimeout(() => this.playTone(600, 'sine', 0.2, 0.15), 250);

    this.currentInterval = setInterval(() => {
      this.playTone(600, 'sine', 0.2, 0.15);
      setTimeout(() => this.playTone(600, 'sine', 0.2, 0.15), 250);
    }, 2000);
  }

  public playOutgoingRing() {
    this.stopAll();
    // Slow pulsing beep
    this.playTone(440, 'sine', 1.0, 0.1);
    this.currentInterval = setInterval(() => {
      this.playTone(440, 'sine', 1.0, 0.1);
    }, 3000);
  }

  public playPickup() {
    this.stopAll();
    // Quick ascending arpeggio (C major: C4, E4, G4)
    const freqs = [261.63, 329.63, 392.0];
    freqs.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.15, 0.1);
      }, i * 150);
    });
  }

  public playEnd() {
    this.stopAll();
    // Quick descending arpeggio (C minor: G4, Eb4, C4)
    const freqs = [392.0, 311.13, 261.63];
    freqs.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.15, 0.1);
      }, i * 150);
    });
  }
}

export const audioManager = new AudioManager();
