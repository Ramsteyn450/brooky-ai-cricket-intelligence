export type SoundEffectType =
  | 'click'
  | 'nav'
  | 'filter'
  | 'ready'
  | 'assistantOpen'
  | 'assistantNotify'
  | 'micStart'
  | 'micStop';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private hasUserInteracted = false;
  private lastPlayed: Partial<Record<SoundEffectType, number>> = {};
  private globalLastPlayed = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('brooky_sound_enabled');
      if (saved === 'false') {
        this.enabled = false;
      }

      const unlock = () => {
        this.hasUserInteracted = true;
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      };

      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(next: boolean): void {
    this.enabled = next;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('brooky_sound_enabled', String(next));
    }
    if (next && this.hasUserInteracted) {
      this.play('click');
    }
  }

  public markUserInteracted(): void {
    this.hasUserInteracted = true;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.hasUserInteracted) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    ctx: AudioContext,
    freqStart: number,
    freqEnd: number,
    durationSec: number,
    gainPeak: number,
    type: OscillatorType = 'sine',
    delaySec = 0,
  ): void {
    const start = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, start);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), start + durationSec);
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + durationSec + 0.01);
  }

  public play(effect: SoundEffectType): void {
    if (!this.enabled || !this.hasUserInteracted) return;

    const now = performance.now();
    // Prevent excessive sound overlap across UI events
    if (now - this.globalLastPlayed < 45) return;
    const prev = this.lastPlayed[effect] ?? 0;
    if (now - prev < 110) return;

    const ctx = this.getContext();
    if (!ctx) return;

    this.globalLastPlayed = now;
    this.lastPlayed[effect] = now;

    switch (effect) {
      case 'click':
        this.playTone(ctx, 560, 340, 0.032, 0.035, 'triangle');
        break;
      case 'nav':
        this.playTone(ctx, 520, 680, 0.045, 0.032, 'sine');
        break;
      case 'filter':
        this.playTone(ctx, 523.25, 523.25, 0.055, 0.03, 'sine', 0);
        this.playTone(ctx, 659.25, 659.25, 0.075, 0.028, 'sine', 0.042);
        break;
      case 'ready':
        this.playTone(ctx, 523.25, 523.25, 0.12, 0.025, 'sine', 0);
        this.playTone(ctx, 659.25, 659.25, 0.14, 0.024, 'sine', 0.06);
        this.playTone(ctx, 783.99, 783.99, 0.18, 0.022, 'sine', 0.12);
        break;
      case 'assistantOpen':
        this.playTone(ctx, 440, 587.33, 0.07, 0.03, 'sine', 0);
        this.playTone(ctx, 587.33, 880, 0.09, 0.028, 'sine', 0.055);
        break;
      case 'assistantNotify':
        this.playTone(ctx, 783.99, 783.99, 0.08, 0.03, 'sine', 0);
        this.playTone(ctx, 1046.5, 1046.5, 0.11, 0.024, 'sine', 0.055);
        break;
      case 'micStart':
        this.playTone(ctx, 587.33, 880, 0.08, 0.032, 'sine');
        break;
      case 'micStop':
        this.playTone(ctx, 659.25, 440, 0.08, 0.03, 'sine');
        break;
    }
  }
}

export const soundEngine = new SoundEngine();
