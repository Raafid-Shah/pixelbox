// src/engine/ui/panel.ts
import { UI_PALETTE } from '../../theme/tokens';

export type PanelVariant = 'standard' | 'highlighted' | 'danger' | 'glass';

export interface PanelOptions {
  variant?: PanelVariant;
  /** Optional header title text rendered inside the top border rule */
  title?: string;
  /** Whether the panel is currently focused by the UI focus manager */
  focused?: boolean;
}

/**
 * Section 5: 9-Slice Double-Bordered Panel Renderer.
 * Draws arcade HUD panels with 1px/2px bevels, corner notches, and variant colour schemes
 * without scaling corner pixels.
 */
export class PanelRenderer {
  /**
   * Draws a double-bordered 9-slice panel onto a 2D canvas context.
   */
  public static drawPanel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    opts: PanelOptions = {}
  ): void {
    const px = Math.round(x);
    const py = Math.round(y);
    const pw = Math.max(16, Math.round(width));
    const ph = Math.max(16, Math.round(height));

    const variant = opts.variant ?? 'standard';
    const focused = opts.focused ?? false;

    // Determine variant border and fill colors
   // Determine variant border and fill colors with explicit string typing
    let borderColor: string = UI_PALETTE.border; // '#8fb8cc'
    let shadowColor: string = UI_PALETTE.borderShadow; // '#4f7388'
    let fillColor: string = UI_PALETTE.panel; // '#0b0f1a'

    if (variant === 'highlighted' || focused) {
      borderColor = UI_PALETTE.accentBlue; // '#3fa9f5'
      shadowColor = '#1a5f96';
    } else if (variant === 'danger') {
      borderColor = UI_PALETTE.scoreRed; // '#d8342b'
      shadowColor = '#661410';
    } else if (variant === 'glass') {
      fillColor = 'rgba(7, 9, 15, 0.75)';
      borderColor = '#687382';
      shadowColor = '#1b1f24';
    }

    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    // 1. Fill panel interior background
    ctx.fillStyle = fillColor;
    ctx.fillRect(px + 2, py + 2, pw - 4, ph - 4);

    // 2. Outer border (Double-line HUD reference style)
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);

    // 3. Inner border shadow / bezel line
    ctx.strokeStyle = shadowColor;
    ctx.strokeRect(px + 2.5, py + 2.5, pw - 5, ph - 5);

    // 4. Clean clipped corner bevels (Arcade aesthetic)
    ctx.fillStyle = UI_PALETTE.nearBlack;
    // Top-left
    ctx.fillRect(px, py, 1, 1);
    // Top-right
    ctx.fillRect(px + pw - 1, py, 1, 1);
    // Bottom-left
    ctx.fillRect(px, py + ph - 1, 1, 1);
    // Bottom-right
    ctx.fillRect(px + pw - 1, py + ph - 1, 1, 1);

    // 5. Optional header title badge inset into top border
    if (opts.title) {
      const badgeText = ` ${opts.title} `;
      const charW = 6; // Approximate compact 8px font width per char
      const badgeW = badgeText.length * charW + 8;
      const badgeX = px + 12;
      const badgeY = py - 4;

      ctx.fillStyle = UI_PALETTE.nearBlack;
      ctx.fillRect(badgeX, badgeY, badgeW, 9);

      ctx.strokeStyle = borderColor;
      ctx.strokeRect(badgeX, badgeY, badgeW, 9);
    }

    ctx.imageSmoothingEnabled = prevSmoothing;
  }
}