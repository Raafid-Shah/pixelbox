// src/hardware/bodies/broadcastwood.ts
import { Body, BodyCtx, BodyForm, MirrorSlot, ShaderPreset, SpeakerProfile } from '../../engine/bus';
import { DISPLAY_CONSTANTS, UI_PALETTE } from '../../theme/tokens';

export class BroadcastWoodBody implements Body {
  public readonly id = 'broadcast-wood';
  public readonly form: BodyForm = 'tv';
  public readonly shader: ShaderPreset = 'CRT';
  public readonly speaker: SpeakerProfile = 'crt';

  private rootEl: HTMLElement | null = null;
  private internalScreenRect: DOMRectReadOnly;
  public readonly mirrors: MirrorSlot[] = [];

  constructor() {
    // Large CRT screen bounding rect inside the 1989 wooden console frame
    this.internalScreenRect = new DOMRectReadOnly(72, 48, 336, 189);
  }

  public screenRect(): DOMRectReadOnly {
    return this.internalScreenRect;
  }

  public mount(root: HTMLElement, ctx: BodyCtx): void {
    this.rootEl = root;
    root.innerHTML = '';
    root.style.cssText = `
      position: relative;
      width: 480px;
      height: 380px;
      margin: 0 auto;
      background: var(--shell-base, #5c3824);
      border: 4px solid var(--shell-shadow, #2e190e);
      border-radius: 16px;
      box-shadow: var(--hardware-dual-shadow, 0 20px 40px rgba(7, 9, 15, 0.95));
      user-select: none;
    `;

    // 1. Wood-grain texture overlay line
    const grain = document.createElement('div');
    grain.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.12) 100%);
      pointer-events: none;
      border-radius: 12px;
    `;
    root.appendChild(grain);

    // 2. Thick Curved CRT Bezel & Screen
    const bezel = document.createElement('div');
    bezel.style.cssText = `
      position: absolute;
      top: 36px;
      left: 60px;
      width: 360px;
      height: 204px;
      background: ${UI_PALETTE.nearBlack};
      border: 6px solid #1b1f24;
      border-radius: 12px;
      box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.9), 0 0 16px rgba(255, 176, 64, 0.15);
      overflow: hidden;
      z-index: 1;
    `;

    const gameCanvas = ctx.getScreenCanvas();
    gameCanvas.style.cssText = 'width: 100%; height: 100%; image-rendering: pixelated; display: block;';
    bezel.appendChild(gameCanvas);
    root.appendChild(bezel);

    // 3. Control Panel Shelf (Channel Dial, Volume, Picture Knobs)
    const controlShelf = document.createElement('div');
    controlShelf.style.cssText = `
      position: absolute;
      bottom: 24px;
      left: 60px;
      width: 360px;
      height: 80px;
      background: #3a414a;
      border: 3px inset #1b1f24;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 0 16px;
      z-index: 2;
    `;

    const channelDial = this.createKnob('CHANNEL', 'Channel Selector (Static & Scenes)', () => {
      ctx.bus.emit('channel:change', { channel: 2, prevChannel: 1, reason: 'dial' });
    });

    const volumeKnob = this.createKnob('VOLUME', 'Master Volume', () => {
      ctx.bus.emit('setting:change', { path: 'audio.masterVolume', value: 0.8 });
    });

    const powerKnob = this.createKnob('POWER', 'TV Power Toggle', () => {
      ctx.bus.emit('power:toggle', { powered: true });
    });

    controlShelf.append(channelDial, volumeKnob, powerKnob);
    root.appendChild(controlShelf);
  }

  public unmount(): void {
    if (this.rootEl) {
      this.rootEl.innerHTML = '';
      this.rootEl = null;
    }
  }

  private createKnob(label: string, title: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.style.cssText = `
      width: 44px;
      height: 44px;
      background: radial-gradient(circle, #687382 0%, #1b1f24 100%);
      border: 2px solid #8fb8cc;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: "Press Start 2P", monospace;
      font-size: 7px;
      color: ${UI_PALETTE.warmWhite};
    `;
    btn.innerHTML = `<span style="font-size: 6px; margin-bottom: 2px;">${label}</span><span style="width: 2px; height: 10px; background: #ffb000;"></span>`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }
}