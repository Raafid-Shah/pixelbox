// src/audio/profiles.ts
import { SpeakerProfile } from '../engine/bus';

export interface SpeakerFilterConfig {
  lowpassFreq: number;
  highpassFreq: number;
  distortionAmount: number;
  mainsHumGain: number; // 60Hz hum level for CRT
}

export const SPEAKER_PROFILES: Record<SpeakerProfile, SpeakerFilterConfig> = {
  handheld: {
    lowpassFreq: 12000,
    highpassFreq: 400, // Tinny mono high-pass near 400Hz (Section 9)
    distortionAmount: 0.15,
    mainsHumGain: 0.0,
  },
  deck: {
    lowpassFreq: 18000,
    highpassFreq: 40,
    distortionAmount: 0.02,
    mainsHumGain: 0.0,
  },
  crt: {
    lowpassFreq: 8000,  // Low-pass near 8kHz for vintage television speaker (Section 9)
    highpassFreq: 80,
    distortionAmount: 0.08,
    mainsHumGain: 0.04, // Subtle 60Hz hum under silence
  },
  room: {
    lowpassFreq: 6000,
    highpassFreq: 100,
    distortionAmount: 0.20,
    mainsHumGain: 0.08,
  },
};