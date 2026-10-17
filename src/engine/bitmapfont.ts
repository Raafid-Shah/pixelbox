// src/engine/bitmapfont.ts
import { FONT_STYLES, UI_PALETTE } from '../theme/tokens';

export type FontStyleName = keyof typeof FONT_STYLES;
export type FontSizePx = 8 | 16 | 24;

export interface DrawTextOptions {
  style?: FontStyleName;
  size?: FontSizePx;
  align?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  maxWidth?: number;
  /** Typewriter effect: number of visible characters to render */
  charLimit?: number;
  /** Blink interval in ms (e.g., 500 for INSERT COIN prompt) */
  blinkMs?: number;
  /** Shake amplitude in px (automatically suppressed when reducedMotion is true) */
  shakePx?: number;
  reducedMotion?: boolean;
  /** Optional clock timestamp (ms) for deterministic blink/shake/marquee in tests */
  nowMs?: number;
}

export interface TypewriterState {
  fullText: string;
  visibleChars: number;
  elapsedMs: number;
  charsPerSecond: number;
  done: boolean;
}

const FIRST_CHAR = 32; // Space ' '
const LAST_CHAR = 126; // Tilde '~'
const GLYPH_COUNT = LAST_CHAR - FIRST_CHAR + 1;
const CELL_SIZE = 10; // 8x8 glyph + 1px outline padding on all sides

const STYLE_ORDER: readonly FontStyleName[] = [
  'plain',
  'outlined',
  'shadowed',
  'bevel',
  'bevelAmber',
  'scoreRed',
];

/**
 * Built-in crisp 8x8 arcade bitmap patterns for digits and core glyphs so
 * the engine renders zero-blur pixel text on Frame 1 even before WebFonts resolve.
 */
const BUILTIN_8X8_HEX: Record<string, readonly number[]> = {
  '0': [0x3c, 0x66, 0x6e, 0x76, 0x66, 0x66, 0x3c, 0x00],
  '1': [0x18, 0x38, 0x18, 0x18, 0x18, 0x18, 0x7e, 0x00],
  '2': [0x3c, 0x66, 0x06, 0x1c, 0x30, 0x66, 0x7e, 0x00],
  '3': [0x3c, 0x66, 0x06, 0x1c, 0x06, 0x66, 0x3c, 0x00],
  '4': [0x0c, 0x1c, 0x3c, 0x6c, 0x7e, 0x0c, 0x0c, 0x00],
  '5': [0x7e, 0x60, 0x7c, 0x06, 0x06, 0x66, 0x3c, 0x00],
  '6': [0x1c, 0x30, 0x60, 0x7c, 0x66, 0x66, 0x3c, 0x00],
  '7': [0x7e, 0x66, 0x06, 0x0c, 0x18, 0x18, 0x18, 0x00],
  '8': [0x3c, 0x66, 0x66, 0x3c, 0x66, 0x66, 0x3c, 0x00],
  '9': [0x3c, 0x66, 0x66, 0x3e, 0x06, 0x0c, 0x38, 0x00],
};

export class BitmapFont {
  private atlasCanvas: HTMLCanvasElement | null = null;
  private scoreAtlasCanvas: HTMLCanvasElement | null = null;
  private ready = false;

  constructor() {
    if (typeof document !== 'undefined') {
      this.bakeRuntimeAtlas();
      this.bakeScoreNumeralAtlas();
      this.waitForFontAndRebake();
    }
  }

  public isReady(): boolean {
    return this.ready;
  }

  /**
   * Returns the internal atlas canvas so Phase 0 / Sprint 1 can render a debug
   * test sheet of every glyph in every style (Section 16, Step 5).
   */
  public getAtlasCanvas(): HTMLCanvasElement | null {
    return this.atlasCanvas;
  }

  /**
   * Measures pixel width and height of a string at the target integer font size.
   */
  public measureText(
    text: string,
    size: FontSizePx = 8,
    letterSpacing: number = 0
  ): { width: number; height: number } {
    if (!text) return { width: 0, height: size };
    const lines = text.split('\n');
    const scale = size / 8;
    const advance = 8 * scale + letterSpacing;
    let maxLineWidth = 0;

    for (let i = 0; i < lines.length; i++) {
      const len = lines[i].length;
      const w = len > 0 ? len * advance - letterSpacing : 0;
      if (w > maxLineWidth) maxLineWidth = w;
    }

    return {
      width: Math.ceil(maxLineWidth),
      height: Math.ceil(lines.length * (size + 2 * scale)),
    };
  }

  /**
   * Primary pixel-exact text renderer using drawImage slices from the pre-baked atlas.
   * Never invokes runtime ctx.fillText.
   */
  public drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    opts: DrawTextOptions = {}
  ): void {
    if (!this.atlasCanvas || !text) return;

    const style = opts.style ?? 'bevel';
    const size = opts.size ?? 8;
    const scale = size / 8;
    const spacing = opts.letterSpacing ?? 0;
    const now = opts.nowMs ?? performance.now();

    // Blink check
    if (opts.blinkMs && opts.blinkMs > 0) {
      if (Math.floor(now / opts.blinkMs) % 2 === 1) return;
    }

    const styleRowIdx = Math.max(0, STYLE_ORDER.indexOf(style));
    const sy = styleRowIdx * CELL_SIZE;
    const advanceX = Math.round(8 * scale + spacing);
    const destCell = Math.round(CELL_SIZE * scale);

    // Alignment offset
    let startX = Math.round(x);
    if (opts.align === 'center' || opts.align === 'right') {
      const measured = this.measureText(text, size, spacing).width;
      startX = opts.align === 'center' ? Math.round(x - measured / 2) : Math.round(x - measured);
    }

    const baseY = Math.round(y);
    const limit = opts.charLimit !== undefined ? Math.min(text.length, opts.charLimit) : text.length;
    const shakeAmp = opts.reducedMotion ? 0 : (opts.shakePx ?? 0);

    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    let cursorX = startX;
    let cursorY = baseY;
    const lineStepY = Math.round((opts.lineHeight ?? size + 2) * (size === 8 ? 1 : 1));

    for (let i = 0; i < limit; i++) {
      const ch = text.charCodeAt(i);
      if (ch === 10) {
        // '\n'
        cursorX = startX;
        cursorY += lineStepY;
        continue;
      }

      if (ch > FIRST_CHAR && ch <= LAST_CHAR) {
        const glyphIdx = ch - FIRST_CHAR;
        const sx = glyphIdx * CELL_SIZE;

        let jitterX = 0;
        let jitterY = 0;
        if (shakeAmp > 0) {
          jitterX = Math.round(Math.sin(now * 0.04 + i * 1.7) * shakeAmp);
          jitterY = Math.round(Math.cos(now * 0.05 + i * 2.3) * shakeAmp);
        }

        // Offset by -scale so the 1px atlas outline padding aligns the 8x8 glyph core to (cursorX, cursorY)
        ctx.drawImage(
          this.atlasCanvas,
          sx,
          sy,
          CELL_SIZE,
          CELL_SIZE,
          cursorX - scale + jitterX,
          cursorY - scale + jitterY,
          destCell,
          destCell
        );
      }

      cursorX += advanceX;
    }

    ctx.imageSmoothingEnabled = prevSmoothing;
  }

  /**
   * Word-wraps text cleanly inside maxWidth (in pixels) and draws each line.
   */
  public drawTextWrapped(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    opts: DrawTextOptions = {}
  ): number {
    const size = opts.size ?? 8;
    const spacing = opts.letterSpacing ?? 0;
    const scale = size / 8;
    const charW = 8 * scale + spacing;
    const maxCharsPerLine = Math.max(1, Math.floor((maxWidth + spacing) / charW));

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (candidate.length <= maxCharsPerLine) {
        currentLine = candidate;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineStep = opts.lineHeight ?? size + 4 * scale;
    let remainingChars = opts.charLimit ?? Infinity;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      if (remainingChars <= 0) break;
      const lineText = lines[lineIdx];
      const lineLimit = Math.min(lineText.length, remainingChars);

      this.drawText(ctx, lineText, x, y + lineIdx * lineStep, {
        ...opts,
        charLimit: lineLimit,
      });

      remainingChars -= lineLimit + 1;
    }

    return lines.length * lineStep;
  }

  /**
   * Section 5: Dedicated 16x24 Bevelled Red Score Numeral Renderer with leading zeros (e.g., 018500).
   */
  public drawScoreNumerals(
    ctx: CanvasRenderingContext2D,
    score: number,
    x: number,
    y: number,
    digits: number = 6
  ): void {
    if (!this.scoreAtlasCanvas) return;
    const formatted = Math.max(0, Math.floor(score)).toString().padStart(digits, '0').slice(-digits);

    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < formatted.length; i++) {
      const digit = formatted.charCodeAt(i) - 48; // '0' -> 0
      if (digit >= 0 && digit <= 9) {
        ctx.drawImage(
          this.scoreAtlasCanvas,
          digit * 16,
          0,
          16,
          24,
          Math.round(x + i * 16),
          Math.round(y),
          16,
          24
        );
      }
    }

    ctx.imageSmoothingEnabled = prevSmoothing;
  }

  /**
   * Horizontal scrolling marquee helper clipped to a fixed pixel viewport width.
   */
  public drawMarquee(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    viewportWidth: number,
    speedPxPerSec: number = 24,
    opts: DrawTextOptions = {}
  ): void {
    const size = opts.size ?? 8;
    const textW = this.measureText(text, size, opts.letterSpacing).width;
    const nowSec = (opts.nowMs ?? performance.now()) / 1000;
    const gap = 32;
    const cycleW = textW + gap;
    const offset = Math.floor((nowSec * speedPxPerSec) % cycleW);

    ctx.save();
    ctx.beginPath();
    ctx.rect(Math.round(x), Math.round(y - 2), Math.round(viewportWidth), size + 4);
    ctx.clip();

    this.drawText(ctx, text, Math.round(x - offset), y, opts);
    if (x - offset + cycleW < x + viewportWidth) {
      this.drawText(ctx, text, Math.round(x - offset + cycleW), y, opts);
    }

    ctx.restore();
  }

  /**
   * Advances a typewriter state and triggers the optional audio blip callback on new visible non-space characters.
   */
  public stepTypewriter(
    state: TypewriterState,
    dtMs: number,
    onBlip?: (char: string) => void
  ): TypewriterState {
    if (state.done) return state;
    state.elapsedMs += dtMs;
    const targetChars = Math.min(
      state.fullText.length,
      Math.floor((state.elapsedMs / 1000) * state.charsPerSecond)
    );

    if (targetChars > state.visibleChars) {
      const latestChar = state.fullText.charAt(targetChars - 1);
      state.visibleChars = targetChars;
      if (latestChar && latestChar !== ' ' && latestChar !== '\n' && onBlip) {
        onBlip(latestChar);
      }
    }

    if (state.visibleChars >= state.fullText.length) {
      state.done = true;
    }
    return state;
  }

  private waitForFontAndRebake(): void {
    if (typeof document === 'undefined' || !('fonts' in document)) return;
    document.fonts.ready.then(() => {
      this.bakeRuntimeAtlas();
    });
  }

  /**
   * Rasterises all 95 printable ASCII characters at 8px with strict binary alpha thresholding
   * (zero anti-aliasing) across all 6 arcade styles (plain, outlined, shadowed, bevel, bevelAmber, scoreRed).
   */
  private bakeRuntimeAtlas(): void {
    const atlasW = GLYPH_COUNT * CELL_SIZE;
    const atlasH = STYLE_ORDER.length * CELL_SIZE;

    const canvas = this.atlasCanvas ?? document.createElement('canvas');
    canvas.width = atlasW;
    canvas.height = atlasH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, atlasW, atlasH);

    // Scratch 8x8 canvas for binary thresholding each raw glyph
    const scratch = document.createElement('canvas');
    scratch.width = 8;
    scratch.height = 8;
    const sCtx = scratch.getContext('2d', { willReadFrequently: true });
    if (!sCtx) return;

    sCtx.imageSmoothingEnabled = false;
    sCtx.font = '8px "Press Start 2P", monospace';
    sCtx.textBaseline = 'top';

    for (let i = 0; i < GLYPH_COUNT; i++) {
      const charCode = FIRST_CHAR + i;
      const ch = String.fromCharCode(charCode);
      if (ch === ' ') continue;

      sCtx.clearRect(0, 0, 8, 8);
      sCtx.fillStyle = '#ffffff';
      sCtx.fillText(ch, 0, 0);

      const img = sCtx.getImageData(0, 0, 8, 8).data;
      // Extract 8x8 binary mask (true = active pixel)
      const mask = new Uint8Array(64);
      let hasPixels = false;
      for (let p = 0; p < 64; p++) {
        if (img[p * 4 + 3] >= 105) {
          mask[p] = 1;
          hasPixels = true;
        }
      }

      // Fallback to built-in crisp bitmap if font hasn't loaded yet
      if (!hasPixels && BUILTIN_8X8_HEX[ch]) {
        const rows = BUILTIN_8X8_HEX[ch];
        for (let r = 0; r < 8; r++) {
          const bits = rows[r];
          for (let c = 0; c < 8; c++) {
            mask[r * 8 + c] = (bits >> (7 - c)) & 1;
          }
        }
      }

      // Render this glyph across all 6 style rows
      for (let sIdx = 0; sIdx < STYLE_ORDER.length; sIdx++) {
        const styleKey = STYLE_ORDER[sIdx];
        const palette = FONT_STYLES[styleKey];
        const cellX = i * CELL_SIZE;
        const cellY = sIdx * CELL_SIZE;

        // Pass 1: 1px Outline or Drop Shadow
        if (palette.outline !== 'transparent') {
          ctx.fillStyle = palette.outline;
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (!mask[r * 8 + c]) continue;
              ctx.fillRect(cellX + c, cellY + r, 3, 3);
            }
          }
        }

        if (palette.shadow !== 'transparent') {
          ctx.fillStyle = palette.shadow;
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (!mask[r * 8 + c]) continue;
              ctx.fillRect(cellX + 1 + c, cellY + 2 + r, 1, 1);
            }
          }
        }

        // Pass 2: 2-Tone Bevel Body (Light top rows 0..3, Darker bottom rows 4..7)
        for (let r = 0; r < 8; r++) {
          ctx.fillStyle = r < 4 ? palette.top : palette.bottom;
          for (let c = 0; c < 8; c++) {
            if (!mask[r * 8 + c]) continue;
            ctx.fillRect(cellX + 1 + c, cellY + 1 + r, 1, 1);
          }
        }
      }
    }

    this.atlasCanvas = canvas;
    this.ready = true;
  }

  /**
   * Bakes the dedicated 16x24 tall bevelled red digit atlas (0..9) for HUD score readouts.
   */
  private bakeScoreNumeralAtlas(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 160; // 10 digits * 16px
    canvas.height = 24;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let d = 0; d <= 9; d++) {
      const rows = BUILTIN_8X8_HEX[String(d)];
      const ox = d * 16;

      // Dark recessed shadow/outline
      ctx.fillStyle = UI_PALETTE.nearBlack;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if ((rows[r] >> (7 - c)) & 1) {
            ctx.fillRect(ox + c * 2 - 1, r * 3 - 1, 4, 5);
          }
        }
      }

      // Main 2-tone bevelled red numeral with top specular highlight
      for (let r = 0; r < 8; r++) {
        ctx.fillStyle = r < 3 ? '#ff6b63' : UI_PALETTE.scoreRed;
        for (let c = 0; c < 8; c++) {
          if ((rows[r] >> (7 - c)) & 1) {
            ctx.fillRect(ox + c * 2, r * 3, 2, 3);
            // Inner bevel specular line on top edge of each pixel block
            if (r === 0 || !((rows[r - 1] >> (7 - c)) & 1)) {
              ctx.fillStyle = '#ffd6d1';
              ctx.fillRect(ox + c * 2, r * 3, 2, 1);
              ctx.fillStyle = r < 3 ? '#ff6b63' : UI_PALETTE.scoreRed;
            }
          }
        }
      }
    }

    this.scoreAtlasCanvas = canvas;
  }
}

export const bitmapFont = new BitmapFont();