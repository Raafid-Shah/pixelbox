// src/engine/ui/components.ts
import { bitmapFont } from '../bitmapfont';
import { UI_PALETTE } from '../../theme/tokens';
import { PanelRenderer } from './panel';

export interface ButtonRenderOptions {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  focused?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  nowMs?: number;
}

export interface SliderRenderOptions {
  label: string;
  value: number; // 0..1 normalized
  minLabel?: string;
  maxLabel?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  focused?: boolean;
  nowMs?: number;
}

export interface ToggleRenderOptions {
  label: string;
  checked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  focused?: boolean;
}

export interface LabelValueOptions {
  label: string;
  value: string;
  x: number;
  y: number;
  width: number;
  height: number;
  focused?: boolean;
}

export class UIComponents {
  /**
   * Renders an arcade button with idle, focused, pressed (1px offset), and disabled states.
   */
  public static drawButton(ctx: CanvasRenderingContext2D, opts: ButtonRenderOptions): void {
    const x = Math.round(opts.x);
    const y = Math.round(opts.y + (opts.pressed ? 1 : 0)); // Tactile 1px press offset
    const w = Math.round(opts.width);
    const h = Math.round(opts.height);
    const focused = opts.focused ?? false;
    const disabled = opts.disabled ?? false;
    const now = opts.nowMs ?? performance.now();

    const variant = disabled ? 'glass' : focused ? 'highlighted' : 'standard';
    PanelRenderer.drawPanel(ctx, x, y, w, h, { variant, focused });

    // Focus blinking indicator arrow '>'
    let labelText = opts.label;
    if (focused && !disabled) {
      const showArrow = Math.floor(now / 350) % 2 === 0;
      if (showArrow) {
        labelText = `> ${labelText} <`;
      }
    }

    bitmapFont.drawText(ctx, labelText, x + w / 2, y + h / 2 - 4, {
      style: disabled ? 'plain' : focused ? 'bevelAmber' : 'bevel',
      size: 8,
      align: 'center',
    });
  }

  /**
   * Renders a track slider with numerical progress and live value indicator.
   */
  public static drawSlider(ctx: CanvasRenderingContext2D, opts: SliderRenderOptions): void {
    const x = Math.round(opts.x);
    const y = Math.round(opts.y);
    const w = Math.round(opts.width);
    const h = Math.round(opts.height);
    const focused = opts.focused ?? false;
    const val = Math.max(0, Math.min(1, opts.value));

    PanelRenderer.drawPanel(ctx, x, y, w, h, { focused });

    // Label on left
    bitmapFont.drawText(ctx, opts.label, x + 8, y + 6, { style: 'plain', size: 8 });

    // Track bar
    const trackX = x + 100;
    const trackY = y + 8;
    const trackW = w - 130;
    const trackH = 6;

    ctx.fillStyle = UI_PALETTE.nearBlack;
    ctx.fillRect(trackX, trackY, trackW, trackH);
    ctx.strokeStyle = UI_PALETTE.borderShadow;
    ctx.strokeRect(trackX, trackY, trackW, trackH);

    // Filled progress
    const fillW = Math.round(trackW * val);
    if (fillW > 0) {
      ctx.fillStyle = focused ? UI_PALETTE.accentBlue : UI_PALETTE.border;
      ctx.fillRect(trackX + 1, trackY + 1, fillW - 2, trackH - 2);
    }

    // Handle thumb
    const thumbX = trackX + fillW - 3;
    ctx.fillStyle = UI_PALETTE.warmWhite;
    ctx.fillRect(thumbX, trackY - 2, 6, trackH + 4);
    ctx.strokeStyle = UI_PALETTE.nearBlack;
    ctx.strokeRect(thumbX, trackY - 2, 6, trackH + 4);

    // Percentage or value readout on right
    const pctStr = `${Math.round(val * 100)}%`;
    bitmapFont.drawText(ctx, pctStr, x + w - 8, y + 6, {
      style: focused ? 'bevelAmber' : 'plain',
      size: 8,
      align: 'right',
    });
  }

  /**
   * Renders a toggle switch component ([ ON ] / [ OFF ]).
   */
  public static drawToggle(ctx: CanvasRenderingContext2D, opts: ToggleRenderOptions): void {
    const x = Math.round(opts.x);
    const y = Math.round(opts.y);
    const w = Math.round(opts.width);
    const h = Math.round(opts.height);
    const focused = opts.focused ?? false;

    PanelRenderer.drawPanel(ctx, x, y, w, h, { focused });

    bitmapFont.drawText(ctx, opts.label, x + 8, y + 6, { style: 'plain', size: 8 });

    const stateStr = opts.checked ? '[ ON ]' : '[ OFF ]';
    bitmapFont.drawText(ctx, stateStr, x + w - 12, y + 6, {
      style: opts.checked ? 'bevelAmber' : 'plain',
      size: 8,
      align: 'right',
    });
  }

  /**
   * Renders a read-only or selectable Label/Value inspection box.
   */
  public static drawLabelValue(ctx: CanvasRenderingContext2D, opts: LabelValueOptions): void {
    const x = Math.round(opts.x);
    const y = Math.round(opts.y);
    const w = Math.round(opts.width);
    const h = Math.round(opts.height);
    const focused = opts.focused ?? false;

    PanelRenderer.drawPanel(ctx, x, y, w, h, { focused, variant: 'glass' });

    bitmapFont.drawText(ctx, opts.label, x + 8, y + 6, { style: 'plain', size: 8 });
    bitmapFont.drawText(ctx, opts.value, x + w - 12, y + 6, {
      style: focused ? 'bevelAmber' : 'outlined',
      size: 8,
      align: 'right',
    });
  }
}