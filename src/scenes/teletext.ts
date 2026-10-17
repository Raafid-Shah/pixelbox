// src/scenes/teletext.ts
import { bus, EventBus } from '../engine/bus';
import { bitmapFont } from '../engine/bitmapfont';
import { PanelRenderer } from '../engine/ui/panel';
import { UI_PALETTE } from '../../theme/tokens';

export class TeletextScene {
  private pageNumber = 901;

  constructor(private readonly eventBus: EventBus = bus) {}

  public render(ctx: CanvasRenderingContext2D, _nowMs: number): void {
    // 1. Clear Screen
    ctx.fillStyle = UI_PALETTE.nearBlack;
    ctx.fillRect(0, 0, 320, 180);

    // 2. Teletext Header Bar
    PanelRenderer.drawPanel(ctx, 8, 6, 304, 18, { variant: 'highlighted' });
    bitmapFont.drawText(ctx, `P${this.pageNumber} LATE BYTE CABLE TEXT`, 14, 11, {
      style: 'bevelAmber',
      size: 8,
    });
    bitmapFont.drawText(ctx, 'CH 9', 300, 11, { style: 'scoreRed', size: 8, align: 'right' });

    // 3. Teletext Content Body
    PanelRenderer.drawPanel(ctx, 8, 28, 304, 134, { variant: 'glass' });

    const lines = [
      'INDEX OF SYSTEM DOCUMENTATION:',
      '----------------------------------------',
      '902 - ARCHITECTURE PILLARS & TOKENS',
      '903 - WEBGL2 3-PASS CRT SHADER PIPELINE',
      '904 - AUDIO SYNTHESIZER & WORKLET',
      '905 - CONTENT-AS-DATA SCHEMA (JSON)',
      '----------------------------------------',
      'PRESS [1-5] OR ARROWS TO SELECT PAGE.',
      'PRESS [ESC] TO RETURN TO ROOM.',
    ];

    let y = 38;
    lines.forEach((line, idx) => {
      const style = idx === 0 ? 'bevel' : idx % 2 === 0 ? 'plain' : 'outlined';
      bitmapFont.drawText(ctx, line, 16, y, { style, size: 8 });
      y += 12;
    });

    // 4. Footer Page Guide
    bitmapFont.drawText(ctx, '1:SYS 2:GFX 3:AUDIO 4:DATA 5:MAIN', 160, 168, {
      style: 'bevel',
      size: 8,
      align: 'center',
    });
  }
}