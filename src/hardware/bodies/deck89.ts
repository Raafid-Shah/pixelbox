// src/hardware/bodies/deck89.ts
import { Body, BodyCtx, BodyForm, MirrorSlot, ShaderPreset, SpeakerProfile } from '../../engine/bus';
import { DISPLAY_CONSTANTS, UI_PALETTE } from '../../theme/tokens';

export class Deck89Body implements Body {
  public readonly id = 'deck-89';
  public readonly form: BodyForm = 'deck';
  public readonly shader: ShaderPreset = 'CRT';
  public readonly speaker: SpeakerProfile = 'deck';

  private rootEl: HTMLElement | null = null;
  private screenCanvas: HTMLCanvasElement;
  private internalScreenRect: DOMRectReadOnly;
  public readonly mirrors: MirrorSlot[] = [];

  constructor() {
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = DISPLAY_CONSTANTS.BASE_WIDTH;
    this.screenCanvas.height = DISPLAY_CONSTANTS.BASE_HEIGHT;

    // Default bounding rect matching the recessed CRT bezel slot
    this.internalScreenRect = new DOMRectReadOnly(64, 34, 192, 108);
  }

  public screenRect(): DOMRectReadOnly {
    return this.internalScreenRect;
  }

  public mount(root: HTMLElement, ctx: BodyCtx): void {
    this.rootEl = root;
    root.innerHTML = '';
    root.style.cssText = `
      position: relative;
      width: 440px;
      height: 280px;
      margin: 0 auto;
      background: var(--shell-base, #d8d2c5);
      border-radius: 12px;
      box-shadow: var(--hardware-dual-shadow, 0 12px 24px rgba(7, 9, 15, 0.85));
      border: 3px solid var(--shell-shadow, #8c8578);
      user-select: none;
    `;

    // 1. Recessed Bezel & Screen Slot
    const bezel = document.createElement('div');
    bezel.style.cssText = `
      position: absolute;
      top: 24px;
      left: 60px;
      width: 200px;
      height: 120px;
      background: ${UI_PALETTE.nearBlack};
      border: 4px inset ${UI_PALETTE.borderShadow};
      border-radius: 4px;
      overflow: hidden;
    `;

    // Append WebGL / Canvas game screen container
    const gameCanvas = ctx.getScreenCanvas();
    gameCanvas.style.cssText = 'width: 100%; height: 100%; image-rendering: pixelated; display: block;';
    bezel.appendChild(gameCanvas);
    root.appendChild(bezel);

    // 2. D-Pad & Action Buttons Container (Right control cluster)
    const btnCluster = document.createElement('div');
    btnCluster.style.cssText = `
      position: absolute;
      top: 40px;
      right: 45px;
      display: flex;
      gap: 12px;
      align-items: center;
    `;

    // A/B Buttons
    const aBtn = this.createAccessibleButton('A', 'Action A (Z / Enter)', () => {
      ctx.bus.emit('input:action', { action: 'A', pressed: true, source: 'hardware', timestamp: performance.now() });
      window.setTimeout(() => {
        ctx.bus.emit('input:action', { action: 'A', pressed: false, source: 'hardware', timestamp: performance.now() });
      }, 120);
    });

    const bBtn = this.createAccessibleButton('B', 'Action B (X / Esc)', () => {
      ctx.bus.emit('input:action', { action: 'B', pressed: true, source: 'hardware', timestamp: performance.now() });
      window.setTimeout(() => {
        ctx.bus.emit('input:action', { action: 'B', pressed: false, source: 'hardware', timestamp: performance.now() });
      }, 120);
    });

    btnCluster.append(bBtn, bBtn); // Styled action pill
    root.append(btnCluster);

    // 3. Power Slider & LED indicator
    const powerBar = document.createElement('div');
    powerBar.style.cssText = `
      position: absolute;
      bottom: 18px;
      left: 30px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: "Press Start 2P", monospace;
      font-size: 8px;
      color: ${UI_PALETTE.warmWhite};
    `;
    powerBar.innerHTML = `<span style="width: 8px; height: 8px; background: ${UI_PALETTE.scoreRed}; border-radius: 50%; box-shadow: 0 0 8px ${UI_PALETTE.scoreRed}; display: inline-block;"></span> POWER: DECK 89`;
    root.appendChild(powerBar);
  }

  public unmount(): void {
    if (this.rootEl) {
      this.rootEl.innerHTML = '';
      this.rootEl = null;
    }
  }

  private createAccessibleButton(label: string, title: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.style.cssText = `
      width: 28px;
      height: 28px;
      background: ${UI_PALETTE.scoreRed};
      color: ${UI_PALETTE.warmWhite};
      border: 2px solid ${UI_PALETTE.nearBlack};
      border-radius: 50%;
      font-family: "Press Start 2P", monospace;
      font-size: 9px;
      cursor: pointer;
      box-shadow: 0 3px 0 #4a0b07;
    `;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }
}