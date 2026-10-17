// src/scenes/menu.ts
import { bus, EventBus } from '../engine/bus';
import { bitmapFont } from '../engine/bitmapfont';
import { content, ProjectEntry } from '../content';
import { FocusManager } from '../engine/ui/focus';
import { PanelRenderer } from '../engine/ui/panel';
import { UI_PALETTE } from '../theme/tokens';

export class MenuScene {
  private focusManager: FocusManager;
  private projects: ReadonlyArray<ProjectEntry>;
  private selectedIndex = 0;

  constructor(private readonly eventBus: EventBus = bus) {
    this.projects = content.getProjects();
    this.focusManager = new FocusManager('horizontal', this.projects.length);

    const items = this.projects.map((proj, idx) => ({
      id: proj.id,
      onFocus: () => {
        this.selectedIndex = idx;
      },
      onSelect: () => {
        this.eventBus.emit('cartridge:insert', { slug: proj.id, title: proj.title });
      },
    }));

    this.focusManager.setItems(items, 0);

    // Listen to input bus navigation events
    this.eventBus.on('input:action', ({ action }) => {
      if (action === 'LEFT') this.focusManager.navigate('LEFT');
      if (action === 'RIGHT') this.focusManager.navigate('RIGHT');
      if (action === 'A') this.focusManager.select();
    });
  }

  public render(ctx: CanvasRenderingContext2D, nowMs: number): void {
    // 1. Clear Screen
    ctx.fillStyle = UI_PALETTE.nearBlack;
    ctx.fillRect(0, 0, 320, 180);

    // 2. Header Title Banner
    bitmapFont.drawText(ctx, 'SELECT CARTRIDGE SLOT', 160, 12, {
      style: 'bevelAmber',
      size: 8,
      align: 'center',
    });

    // 3. Render Cartridge Shelf Slots
    const startX = 32;
    const shelfY = 56;
    const cartW = 64;
    const cartH = 72;
    const gap = 20;

    this.projects.forEach((proj, idx) => {
      const x = startX + idx * (cartW + gap);
      const isFocused = idx === this.selectedIndex;
      const cartStyle = content.getCartridgeStyle(proj.id);

      // Cartridge Plastic Shell
      PanelRenderer.drawPanel(ctx, x, shelfY, cartW, cartH, {
        variant: isFocused ? 'highlighted' : 'standard',
        focused: isFocused,
      });

      // Procedural Colored Sticker Label
      ctx.fillStyle = cartStyle.badgeBg;
      ctx.fillRect(x + 8, shelfY + 12, cartW - 16, 36);

      ctx.fillStyle = cartStyle.stripeColor;
      ctx.fillRect(x + 8, shelfY + 12, cartW - 16, 8);

      bitmapFont.drawText(ctx, proj.version, x + cartW / 2, shelfY + 24, {
        style: 'bevel',
        size: 8,
        align: 'center',
      });

      // Cartridge Title
      bitmapFont.drawText(ctx, proj.title.slice(0, 8), x + cartW / 2, shelfY + 54, {
        style: isFocused ? 'bevelAmber' : 'plain',
        size: 8,
        align: 'center',
      });
    });

    // 4. Selected Project Summary Footer Card
    const currentProj = this.projects[this.selectedIndex];
    if (currentProj) {
      PanelRenderer.drawPanel(ctx, 16, 136, 288, 36, { variant: 'glass' });
      bitmapFont.drawText(ctx, currentProj.summary.slice(0, 48), 24, 144, {
        style: 'plain',
        size: 8,
      });
      bitmapFont.drawText(ctx, '[PRESS A / ENTER TO LOAD CARTRIDGE]', 160, 160, {
        style: 'scoreRed',
        size: 8,
        align: 'center',
        nowMs,
        blinkMs: 500,
      });
    }
  }
}