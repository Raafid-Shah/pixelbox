// src/engine/bus.ts
import { PaletteId, SkinId } from '../theme/palettes';

/**
 * Section 4: Unified Input Action Contract.
 * Every input source (keyboard, gamepad, touch, SVG shell controls, WebRTC phone remote)
 * emits and subscribes to these exact 10 canonical actions.
 */
export type Action =
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'A'
  | 'B'
  | 'START'
  | 'SELECT'
  | 'L'
  | 'R';

export type ShaderPreset = 'CRT' | 'CRT-lite' | 'LCD' | 'Fast';
export type SpeakerProfile = 'handheld' | 'deck' | 'crt' | 'room';
export type BodyForm = 'handheld' | 'tv' | 'deck' | 'stack';

/**
 * Section 8: Mirror Screen Contract (80x45 secondary displays, < 0.2 ms budget).
 */
export interface MirrorSlot {
  id: string;
  canvas: HTMLCanvasElement;
  tint: [number, number, number]; // Normalized RGB multiplier
  noise: number;                  // 0..1 static grain overlay
}

export interface BodyCtx {
  bus: EventBus;
  getScreenCanvas: () => HTMLCanvasElement;
}

/**
 * Section 4: Hardware Body Contract.
 * Each body mounts layered SVG artwork plus accessible <button> / role="slider" controls
 * beneath every interactive part.
 */
export interface Body {
  id: string;
  form: BodyForm;
  mount(root: HTMLElement, ctx: BodyCtx): void;
  unmount(): void;
  screenRect(): DOMRectReadOnly;
  mirrors: MirrorSlot[];
  shader: ShaderPreset;
  speaker: SpeakerProfile;
}

/**
 * Section 0 & 4: Set Definition Contract.
 * Replaces the v2 matrix: a Set pairs Body + Room + Sound + Skin in one cohesive unit.
 */
export interface SetDef {
  id: string;
  name: string;
  body: string;
  room: string;
  skin: SkinId;
  ambience: SpeakerProfile;
  wave: 'launch' | '3.1' | '3.2' | '3.3';
  unlockedBy?: string;
}

export type InputSource = 'keyboard' | 'gamepad' | 'touch' | 'hardware' | 'remote';

export interface InputActionPayload {
  action: Action;
  pressed: boolean; // true = button depressed (2-3px travel), false = released
  source: InputSource;
  timestamp: number;
}

/**
 * Section 8: Real-Time Screen Spill Lighting Payload.
 * Emitted every 4th frame with RGB (0..255) averages for left, center, and right screen regions.
 */
export interface FrameGlowPayload {
  left: [number, number, number];
  center: [number, number, number];
  right: [number, number, number];
}

/**
 * Section 4: Complete Typed Event Bus Map.
 */
export interface BusEvents {
  'set:change': { setId: string; def: SetDef; transition: 'crossfade' | 'static' | 'instant' };
  'body:change': { bodyId: string; form: BodyForm };
  'setting:change': { path: string; value: unknown };
  'skin:change': { skinId: SkinId; paletteId: PaletteId };
  'input:action': InputActionPayload;
  'channel:change': { channel: number; prevChannel: number; reason: 'dial' | 'shortcut' | 'attract' };
  'lamp:toggle': { lit: boolean };
  'power:toggle': { powered: boolean };
  'frame:glow': FrameGlowPayload;
  'frame:mirror': { source: HTMLCanvasElement; frameCount: number };
  'cartridge:insert': { slug: string; title: string };
  'unlock': { id: string; kind: 'skin' | 'set' | 'secret'; label: string };
  'visit:return': {
    daysAway: number;
    lastPlayedCart: string | null;
    dustLevel: number;      // 0..1 accrued over days away
    plantHealth: number;    // 0..3 (droops if ignored, secret code at 3 waters)
    cartWear: Record<string, number>;
  };
  'quality:governor': {
    tier: 0 | 1 | 2 | 3;    // 0=Full, 1=Drop Room FX, 2=Drop Bloom, 3=Drop Persistence
    avgFrameMs: number;
  };
  'screen:dive': { active: boolean };
  'photo:capture': { includeRoom: boolean };
}

export type EventKey = keyof BusEvents;
export type EventHandler<K extends EventKey> = (payload: BusEvents[K]) => void;

/**
 * Zero-allocation Publish/Subscribe Event Bus.
 */
export class EventBus {
  private readonly listeners = new Map<EventKey, Set<EventHandler<any>>>();

  /**
   * Subscribe to a typed event. Returns an unsubscribe function for clean teardown.
   */
  public on<K extends EventKey>(event: K, handler: EventHandler<K>): () => void {
    let bucket = this.listeners.get(event);
    if (!bucket) {
      bucket = new Set();
      this.listeners.set(event, bucket);
    }
    bucket.add(handler);
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to a typed event for a single emission only.
   */
  public once<K extends EventKey>(event: K, handler: EventHandler<K>): () => void {
    const wrapper: EventHandler<K> = (payload) => {
      this.off(event, wrapper);
      handler(payload);
    };
    return this.on(event, wrapper);
  }

  /**
   * Remove a specific event listener.
   */
  public off<K extends EventKey>(event: K, handler: EventHandler<K>): void {
    const bucket = this.listeners.get(event);
    if (bucket) {
      bucket.delete(handler);
    }
  }

  /**
   * Emit a typed event synchronously to all active subscribers.
   * Zero array cloning in the hot path to respect the 16.6 ms frame budget.
   */
  public emit<K extends EventKey>(event: K, payload: BusEvents[K]): void {
    const bucket = this.listeners.get(event);
    if (!bucket || bucket.size === 0) return;
    for (const handler of bucket) {
      handler(payload);
    }
  }

  /**
   * Clear all listeners (used in Vitest unit test teardowns).
   */
  public clear(): void {
    this.listeners.clear();
  }
}

export const bus = new EventBus();