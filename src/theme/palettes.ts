// src/theme/palettes.ts
import { MaterialToken, PICO8_PALETTE, UI_PALETTE } from './tokens';

export type PaletteId = 'pico8' | 'arcadeCafe' | 'lcdPocket' | 'amberPhosphor' | 'nightOverworld';

export interface DisplayPalette {
  id: PaletteId;
  label: string;
  colors: readonly string[]; // 16-color indexed array or 4-tone ramp
  tintRGB: [number, number, number]; // Normalized 0..1 RGB multiplier for WebGL2 Pass 1 (Colour LUT)
}

/**
 * Curated display palettes for the 320x180 canvas and WebGL2 Pass 1 Colour LUT.
 */
export const DISPLAY_PALETTES: Record<PaletteId, DisplayPalette> = {
  pico8: {
    id: 'pico8',
    label: 'PICO-8 Standard',
    colors: PICO8_PALETTE,
    tintRGB: [1.0, 1.0, 1.0],
  },
  arcadeCafe: {
    id: 'arcadeCafe',
    label: 'Late Byte 1989 (Warm CRT)',
    colors: [
      '#07090f', '#0b0f1a', '#1b2838', '#2c4257',
      '#4f7388', '#8fb8cc', '#d8d2c5', '#f4efe4',
      '#d8342b', '#ff6b63', '#ffb000', '#ffe082',
      '#00b894', '#3fa9f5', '#74b9ff', '#a29bfe',
    ],
    tintRGB: [1.02, 0.99, 0.95], // Subtle warm cathode tube balance
  },
  lcdPocket: {
    id: 'lcdPocket',
    label: 'Pocket Dot-Matrix (4-Tone LCD)',
    colors: [
      '#141f18', // Deepest LCD shadow pixel
      '#2e4a38', // Dark mid-tone
      '#618768', // Light mid-tone
      '#a8c499', // Unlit reflective olive-green substrate
      '#141f18', '#2e4a38', '#618768', '#a8c499',
      '#141f18', '#2e4a38', '#618768', '#a8c499',
      '#141f18', '#2e4a38', '#618768', '#a8c499',
    ],
    tintRGB: [0.88, 1.0, 0.84],
  },
  amberPhosphor: {
    id: 'amberPhosphor',
    label: 'Halden Amber Monitor',
    colors: [
      '#0a0600', '#1f1100', '#382000', '#593300',
      '#7a4600', '#9c5a00', '#bf6f00', '#e08400',
      '#ff9800', '#ffa726', '#ffb74d', '#ffc870',
      '#ffd699', '#ffe4bd', '#fff1db', '#fffaf0',
    ],
    tintRGB: [1.0, 0.72, 0.22],
  },
  nightOverworld: {
    id: 'nightOverworld',
    label: 'Late Hour Overworld',
    colors: [
      '#05070c', '#101b33', '#4e1a3d', '#005238',
      '#6e3522', '#3d3833', '#8a8c91', '#e6dec8',
      '#cc1f47', '#d97a00', '#e6c822', '#00a838',
      '#2482cc', '#615678', '#cc5c88', '#d9a68c',
    ],
    tintRGB: [0.92, 0.95, 1.04],
  },
};

export type SkinId =
  | 'beige-1989'
  | 'midnight-black'
  | 'atomic-purple'
  | 'red-white'
  | 'teal-90s'
  | 'gold-edition';

export interface SkinDefinition {
  id: SkinId;
  name: string;
  cabinetFinish: MaterialToken;
  bezelColor: string;
  uiAccent: string;
  defaultPalette: PaletteId;
  bootLogoVariant: 'classic' | 'neon' | 'translucent' | 'famicom' | 'rad' | 'prestige';
  unlockedByDefault: boolean;
  unlockHint?: string;
}

/**
 * Section 11: Starter Set of 6 Skins ("Skins are data").
 * Each defines the shell material override, UI accent, and boot variant.
 */
export const SKINS: Record<SkinId, SkinDefinition> = {
  'beige-1989': {
    id: 'beige-1989',
    name: 'Beige 1989',
    cabinetFinish: {
      base: '#d8d2c5',
      highlight: '#f4efe4',
      shadow: '#8c8578',
      noise: 0.04,
      opacity: 1.0,
      bevelPx: 2,
    },
    bezelColor: '#23272e',
    uiAccent: UI_PALETTE.accentBlue,
    defaultPalette: 'arcadeCafe',
    bootLogoVariant: 'classic',
    unlockedByDefault: true,
  },
  'midnight-black': {
    id: 'midnight-black',
    name: 'Midnight Black',
    cabinetFinish: {
      base: '#181c24',
      highlight: '#2e3545',
      shadow: '#090b0f',
      noise: 0.06,
      opacity: 1.0,
      bevelPx: 2,
    },
    bezelColor: '#07090f',
    uiAccent: '#3fa9f5',
    defaultPalette: 'arcadeCafe',
    bootLogoVariant: 'neon',
    unlockedByDefault: true,
  },
  'atomic-purple': {
    id: 'atomic-purple',
    name: 'Atomic Purple',
    cabinetFinish: {
      base: '#6b4c9a',
      highlight: '#b39ddb',
      shadow: '#2c1947',
      noise: 0.02,
      opacity: 0.78,
      bevelPx: 2,
    },
    bezelColor: '#12131a',
    uiAccent: '#b388ff',
    defaultPalette: 'lcdPocket',
    bootLogoVariant: 'translucent',
    unlockedByDefault: true,
  },
  'red-white': {
    id: 'red-white',
    name: 'Red/White',
    cabinetFinish: {
      base: '#f0ece1',
      highlight: '#ffffff',
      shadow: '#9e2420',
      noise: 0.03,
      opacity: 1.0,
      bevelPx: 2,
    },
    bezelColor: '#8c1d19',
    uiAccent: UI_PALETTE.scoreRed,
    defaultPalette: 'pico8',
    bootLogoVariant: 'famicom',
    unlockedByDefault: true,
  },
  'teal-90s': {
    id: 'teal-90s',
    name: 'Teal 90s',
    cabinetFinish: {
      base: '#008b8b',
      highlight: '#48d1cc',
      shadow: '#004d4d',
      noise: 0.05,
      opacity: 1.0,
      bevelPx: 2,
    },
    bezelColor: '#162426',
    uiAccent: '#48d1cc',
    defaultPalette: 'pico8',
    bootLogoVariant: 'rad',
    unlockedByDefault: false,
    unlockHint: 'Explore 3 portfolio sections or tune to Teletext Channel 9',
  },
  'gold-edition': {
    id: 'gold-edition',
    name: 'Gold Edition',
    cabinetFinish: {
      base: '#c59b27',
      highlight: '#ffeb82',
      shadow: '#6e520c',
      noise: 0.12,
      opacity: 1.0,
      bevelPx: 2,
    },
    bezelColor: '#1a1405',
    uiAccent: UI_PALETTE.amber,
    defaultPalette: 'amberPhosphor',
    bootLogoVariant: 'prestige',
    unlockedByDefault: false,
    unlockHint: 'Water the cafe plant three times or set an Arcade high score',
  },
};

/**
 * Converts a 6-digit hex color string (#RRGGBB) into a normalized [R, G, B] float tuple (0..1)
 * for direct upload to WebGL2 shader uniforms without runtime string parsing overhead.
 */
export function hexToNormalizedRGB(hex: string): [number, number, number] {
  const clean = hex.charAt(0) === '#' ? hex.slice(1) : hex;
  const num = parseInt(clean, 16);
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

/**
 * Applies a skin's cabinet material and accent color directly to CSS custom properties
 * so the SVG hardware body updates live without a page reload (Section 7).
 */
export function applySkinVariables(
  skinId: SkinId,
  root: HTMLElement = document.documentElement
): void {
  const skin = SKINS[skinId] ?? SKINS['beige-1989'];
  const s = root.style;
  s.setProperty('--shell-base', skin.cabinetFinish.base);
  s.setProperty('--shell-highlight', skin.cabinetFinish.highlight);
  s.setProperty('--shell-shadow', skin.cabinetFinish.shadow);
  s.setProperty('--shell-noise', String(skin.cabinetFinish.noise));
  s.setProperty('--shell-opacity', String(skin.cabinetFinish.opacity));
  s.setProperty('--shell-bezel', skin.bezelColor);
  s.setProperty('--ui-accent-active', skin.uiAccent);
}