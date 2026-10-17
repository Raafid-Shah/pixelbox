// src/theme/tokens.ts

/**
 * Section 3: Arcade Cafe, 1989 UI Palette
 * Mood: warm, slightly dusty, neon-lit, late evening.
 * The screen is the brightest thing in the room.
 */
export const UI_PALETTE = {
  nearBlack: '#07090f',
  panel: '#0b0f1a',
  border: '#8fb8cc',
  borderShadow: '#4f7388',
  accentBlue: '#3fa9f5',
  scoreRed: '#d8342b',
  warmWhite: '#f4efe4',
  amber: '#ffb000',
} as const;

/**
 * 2-Tone Font Bevel & Glyph Style Palettes (Section 5)
 * Used by the bitmap font rasterizer and HUD text renderer for chunky,
 * arcade-authentic letterforms (light top row, darker bottom row).
 */
export const FONT_STYLES = {
  plain: {
    top: '#f4efe4',
    bottom: '#f4efe4',
    outline: 'transparent',
    shadow: 'transparent',
  },
  outlined: {
    top: '#f4efe4',
    bottom: '#d8d2c5',
    outline: '#07090f',
    shadow: 'transparent',
  },
  shadowed: {
    top: '#f4efe4',
    bottom: '#d8d2c5',
    outline: 'transparent',
    shadow: '#07090f',
  },
  bevel: {
    top: '#ffffff',
    bottom: '#8fb8cc',
    outline: '#07090f',
    shadow: '#1b2838',
  },
  bevelAmber: {
    top: '#ffe082',
    bottom: '#ffb000',
    outline: '#07090f',
    shadow: '#4a2c00',
  },
  scoreRed: {
    top: '#ff6b63',
    bottom: '#d8342b',
    outline: '#07090f',
    shadow: '#4a0b07',
  },
} as const;

/**
 * Standard 16-color PICO-8 palette preserved for internal 320x180 gameplay scenes.
 */
export const PICO8_PALETTE = [
  '#000000', // 0: Black
  '#1D2B53', // 1: Dark Blue
  '#7E2553', // 2: Dark Purple
  '#008751', // 3: Dark Green
  '#AB5236', // 4: Brown
  '#5F574F', // 5: Dark Gray
  '#C2C3C7', // 6: Light Gray
  '#FFF1E8', // 7: White
  '#FF004D', // 8: Red
  '#FFA300', // 9: Orange
  '#FFEC27', // 10: Yellow
  '#00E436', // 11: Green
  '#29ADFF', // 12: Blue
  '#83769C', // 13: Indigo
  '#FF77A8', // 14: Pink
  '#FFCCAA', // 15: Peach
] as const;

export type MaterialName =
  | 'plastic'
  | 'translucentPlastic'
  | 'brushedMetal'
  | 'woodVeneer'
  | 'glass'
  | 'rubber'
  | 'fabric';

export interface MaterialToken {
  base: string;
  highlight: string;
  shadow: string;
  noise: number; // SVG feTurbulence baseFrequency / grain intensity
  opacity: number;
  bevelPx: number;
}

/**
 * Physical hardware materials as tokens.
 * A colourway or skin override is a single-line token swap.
 */
export const MATERIALS: Record<MaterialName, MaterialToken> = {
  plastic: {
    base: '#d8d2c5',
    highlight: '#f4efe4',
    shadow: '#8c8578',
    noise: 0.04,
    opacity: 1.0,
    bevelPx: 2,
  },
  translucentPlastic: {
    base: '#6b4c9a',
    highlight: '#b39ddb',
    shadow: '#311b47',
    noise: 0.02,
    opacity: 0.78,
    bevelPx: 2,
  },
  brushedMetal: {
    base: '#3a414a',
    highlight: '#687382',
    shadow: '#1b1f24',
    noise: 0.15,
    opacity: 1.0,
    bevelPx: 1,
  },
  woodVeneer: {
    base: '#5c3824',
    highlight: '#825236',
    shadow: '#2e190e',
    noise: 0.22,
    opacity: 1.0,
    bevelPx: 2,
  },
  glass: {
    base: '#0b0f1a',
    highlight: '#ffffff',
    shadow: '#000000',
    noise: 0.01,
    opacity: 0.18,
    bevelPx: 1,
  },
  rubber: {
    base: '#23272e',
    highlight: '#3b414c',
    shadow: '#101216',
    noise: 0.08,
    opacity: 1.0,
    bevelPx: 1,
  },
  fabric: {
    base: '#1e1a2b',
    highlight: '#2f2942',
    shadow: '#0e0c14',
    noise: 0.25,
    opacity: 1.0,
    bevelPx: 0,
  },
};

/**
 * Tactile motion and display constants (Pillars 1, 2, and 3)
 */
export const DISPLAY_CONSTANTS = {
  BASE_WIDTH: 320,
  BASE_HEIGHT: 180,
  MIRROR_WIDTH: 80,
  MIRROR_HEIGHT: 45,
  TARGET_FRAME_MS: 16.6,
  FONT_BASE_PX: 8,
  FONT_HEADING_PX: 16,
  FONT_NUMERAL_PX: 24,
  BUTTON_TRAVEL_PX: 2,
  PANEL_OVERSHOOT_FRAMES: 2,
} as const;

/**
 * Computes the largest integer scale factor (1x..8x) of 320x180 that fits
 * cleanly inside the available container dimensions. Guarantees Pillar 1 (Crisp).
 */
export function computeIntegerScale(
  availableWidth: number,
  availableHeight: number,
  baseWidth: number = DISPLAY_CONSTANTS.BASE_WIDTH,
  baseHeight: number = DISPLAY_CONSTANTS.BASE_HEIGHT
): number {
  const scaleX = Math.floor(availableWidth / baseWidth);
  const scaleY = Math.floor(availableHeight / baseHeight);
  return Math.max(1, Math.min(scaleX, scaleY));
}

/**
 * Mirrors UI_PALETTE, lighting rules (warm upper-left key + cool screen spill),
 * and tactile spacing tokens to CSS variables on :root.
 */
export function injectThemeVariables(root: HTMLElement = document.documentElement): void {
  const s = root.style;

  // Core HUD Palette
  s.setProperty('--ui-near-black', UI_PALETTE.nearBlack);
  s.setProperty('--ui-panel', UI_PALETTE.panel);
  s.setProperty('--ui-border', UI_PALETTE.border);
  s.setProperty('--ui-border-shadow', UI_PALETTE.borderShadow);
  s.setProperty('--ui-accent-blue', UI_PALETTE.accentBlue);
  s.setProperty('--ui-score-red', UI_PALETTE.scoreRed);
  s.setProperty('--ui-warm-white', UI_PALETTE.warmWhite);
  s.setProperty('--ui-amber', UI_PALETTE.amber);

  // Pillar 3 (Lit): Warm lamp key light (upper-left) + dynamic screen spill
  s.setProperty('--lamp-key-color', 'rgba(255, 176, 64, 0.28)');
  s.setProperty('--lamp-key-opacity', '1');
  s.setProperty('--light-spill-left', 'rgba(63, 169, 245, 0.16)');
  s.setProperty('--light-spill-center', 'rgba(63, 169, 245, 0.24)');
  s.setProperty('--light-spill-right', 'rgba(63, 169, 245, 0.16)');

  // Dual dynamic drop-shadows obeying upper-left key light and screen fill
  s.setProperty(
    '--hardware-dual-shadow',
    'drop-shadow(8px 12px 18px rgba(7, 9, 15, 0.85)) drop-shadow(-3px -3px 12px var(--light-spill-center))'
  );

  // Tactile physics variables
  s.setProperty('--button-travel-px', `${DISPLAY_CONSTANTS.BUTTON_TRAVEL_PX}px`);
  s.setProperty('--pixel-scale', '3');
}