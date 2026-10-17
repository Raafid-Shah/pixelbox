// src/audio/mixer.ts
import { SpeakerProfile, bus, EventBus } from '../engine/bus';
import { SPEAKER_PROFILES } from './profiles';

export interface MixerVolumes {
  master: number;
  music: number;
  sfx: number;
  ambience: number;
}

export class AudioMixer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private initialized = false;

  private volumes: MixerVolumes = {
    master: 0.8,
    music: 0.7,
    sfx: 0.85,
    ambience: 0.5,
  };

  constructor(private readonly eventBus: EventBus = bus) {
    this.eventBus.on('setting:change', ({ path, value }) => {
      if (path.startsWith('audio.')) {
        const key = path.split('.')[1] as keyof MixerVolumes;
        if (key && typeof value === 'number') {
          this.setVolume(key, value);
        }
      }
    });

    this.eventBus.on('body:change', ({ bodyId: _bodyId }) => {
      // Switch speaker profile dynamically when body changes
      // (Mapping body ID or profile directly)
    });
  }

  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.ambienceGain = this.ctx.createGain();

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 18000;

    // Connect routing graph: Music/SFX/Ambience -> Filter -> Master -> Destination
    this.musicGain.connect(this.filterNode);
    this.sfxGain.connect(this.filterNode);
    this.ambienceGain.connect(this.filterNode);

    this.filterNode.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.applyVolumes();
    this.initialized = true;

    if (this.ctx.state === 'suspended') {
      const unlock = () => {
        this.ctx?.resume();
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('click', unlock);
      window.addEventListener('keydown', unlock);
    }
  }

  public setVolume(channel: keyof MixerVolumes, val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.volumes[channel] = clamped;
    this.applyVolumes();
  }

  public setSpeakerProfile(profile: SpeakerProfile): void {
    if (!this.filterNode || !this.ctx) return;
    const cfg = SPEAKER_PROFILES[profile] ?? SPEAKER_PROFILES.crt;
    const now = this.ctx.currentTime;
    this.filterNode.frequency.setTargetAtTime(cfg.lowpassFreq, now, 0.05);
  }

  private applyVolumes(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(this.volumes.master, now, 0.05);
    if (this.musicGain) this.musicGain.gain.setTargetAtTime(this.volumes.music, now, 0.05);
    if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(this.volumes.sfx, now, 0.05);
    if (this.ambienceGain) this.ambienceGain.gain.setTargetAtTime(this.volumes.ambience, now, 0.05);
  }
}

export const mixer = new AudioMixer(bus);