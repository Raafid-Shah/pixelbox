// src/scenes/about.ts
import { bus, EventBus } from '../engine/bus';
import { bitmapFont } from '../engine/bitmapfont';
import { content } from '../content';
import { PanelRenderer } from '../engine/ui/panel';
import { UI_PALETTE } from '../../theme/tokens';

export class AboutScene {
  private profile = content.getProfile();

  constructor(private readonly eventBus: EventBus = bus) {}

  public render(ctx: CanvasRenderingContext2D, _nowMs: number): void {
    // 1. Clear Screen
    ctx.fillStyle = UI_PALETTE.nearBlack;
    ctx.fillRect(0, 0, 320, 180);

    // 2. Character Header Banner
    bitmapFont.drawText(
      ctx,
      `PLAYER STATS: LVL ${this.profile.level} ${this.profile.class.toUpperCase()}`,
      160,
      10,
      {
        style: 'bevelAmber',
        size: 8,
        align: 'center',
      }
    );

    // 3. Bio Glass Panel
    PanelRenderer.drawPanel(ctx, 16, 26, 288, 64, { variant: 'glass' });
    let bioY = 34;
    this.profile.bio.slice(0, 3).forEach((line) => {
      bitmapFont.drawText(ctx, line.slice(0, 44), 24, bioY, {
        style: 'plain',
        size: 8,
      });
      bioY += 12;
    });

    // 4. Attributes & Skill Gauges
    let attrY = 98;
    this.profile.attributes.forEach((attr) => {
      PanelRenderer.drawPanel(ctx, 16, attrY, 288, 16, { variant: 'standard' });
      bitmapFont.drawText(ctx, `${attr.code}: ${attr.label}`, 24, attrY + 4, {
        style: 'plain',
        size: 8,
      });

      // Gauge Bar
      const barX = 180;
      const barW = 100;
      const barH = 6;
      ctx.fillStyle = UI_PALETTE.nearBlack;
      ctx.fillRect(barX, attrY + 5, barW, barH);
      ctx.strokeStyle = UI_PALETTE.borderShadow;
      ctx.strokeRect(barX, attrY + 5, barW, barH);

      const fillW = Math.round((attr.value / 100) * (barW - 2));
      ctx.fillStyle = UI_PALETTE.accentBlue;
      ctx.fillRect(barX + 1, attrY + 6, fillW, barH - 2);

      attrY += 20;
    });
  }
}