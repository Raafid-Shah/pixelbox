// src/hardware/bodies/prismclear.ts
import { Body, BodyCtx, BodyForm, MirrorSlot, ShaderPreset, SpeakerProfile } from '../../engine/bus';
import { DISPLAY_CONSTANTS, UI_PALETTE } from '../../theme/tokens';

export class PrismClearBody implements Body {
  public readonly id = 'prism-clear';
  public readonly form: BodyForm = 'handheld';
  public readonly shader: ShaderPreset = 'LCD';
  public readonly speaker: SpeakerProfile = 'handheld';

  private rootEl: HTMLElement | null = null;
  private internalScreenRect: DOMRectReadOnly;
  public readonly mirrors: MirrorSlot[] = [];

  constructor() {
    // Default portrait screen bounding rect inside the translucent handheld shell
    this.internalScreenRect = new DOMRectReadOnly(36, 42, 180, 135);
  }

  public screenRect(): DOMRectReadOnly {
    return this.internalScreenRect;
  }

  public mount(root: HTMLElement, ctx: BodyCtx): void {
    this.rootEl = root;
    root.innerHTML = '';
    root.style.cssText = `
      position: relative;
      width: 252px;
      height: 420px;
      margin: 0 auto;
      background: rgba(107, 76, 154, 0.85);
      border: 3px solid rgba(177, 157, 219, 0.6);
      border-radius: 20px;
      box-shadow: var(--hardware-dual-shadow, 0 16px 32px rgba(7, 9, 15, 0.9));
      backdrop-filter: blur(4px);
      user-select: none;
    `;

    // 1. Exposed PCB SVG decorative trace underlay (Section 7)
    const pcbSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    pcbSvg.setAttribute('width', '100%');
    pcbSvg.setAttribute('height', '100%');
    pcbSvg.style.cssText = 'position: absolute; top: 0; left: 0; pointer-events: none; opacity: 0.35; z-index: 0;';
    pcbSvg.innerHTML = `
      <path d="M20 40 H100 V120 H220" stroke="#b39ddb" stroke-width="2" fill="none"/>
      <path d="M40 380 V300 H180 V350" stroke="#b39ddb" stroke-width="2" fill="none"/>
      <circle cx="100" cy="120" r="4" fill="#b39ddb"/>
      <rect x="110" y="220" width="30" height="20" fill="none" stroke="#b39ddb" stroke-width="1.5"/>
    `;
    root.appendChild(pcbSvg);

    // 2. Rim-lit Black Glass Bezel & Screen
    const bezel = document.createElement('div');
    bezel.style.cssText = `
      position: absolute;
      top: 36px;
      left: 24px;
      width: 204px;
      height: 150px;
      background: ${UI_PALETTE.nearBlack};
      border: 3px solid ${UI_PALETTE.accentBlue};
      border-radius: 6px;
      box-shadow: 0 0 12px rgba(63, 169, 245, 0.35);
      overflow: hidden;
      z-index: 1;
    `;

    const gameCanvas = ctx.getScreenCanvas();
    gameCanvas.style.cssText = 'width: 100%; height: 100%; image-rendering: pixelated; display: block;';
    bezel.appendChild(gameCanvas);
    root.appendChild(bezel);

    // 3. Jewel Action Buttons (Glow when pressed)
    const btnCluster = document.createElement('div');
    btnCluster.style.cssText = `
      position: absolute;
      bottom: 60px;
      right: 30px;
      display: flex;
      gap: 14px;
      z-index: 2;
    `;

    const aBtn = this.createJewelButton('A', 'Jewel A Button', () => {
      ctx.bus.emit('input:action', { action: 'A', pressed: true, source: 'hardware', timestamp: performance.now() });
      window.setTimeout(() => {
        ctx.bus.emit('input:action', { action: 'A', pressed: false, source: 'hardware', timestamp: performance.now() });
      }, 120);
    });

    const bBtn = this.createJewelButton('B', 'Jewel B Button', () => {
      ctx.bus.emit('input:action', { action: 'B', pressed: true, source: 'hardware', timestamp: performance.now() });
      window.setTimeout(() => {
        ctx.bus.emit('input:action', { action: 'B', pressed: false, source: 'hardware', timestamp: performance.now() });
      }, 120);
    });

    btnCluster.append(bBtn, aBtn);
    root.append(btnCluster);

    // 4. Battery / Power LED indicator
    const led = document.createElement('div');
    led.style.cssText = `
      position: absolute;
      bottom: 24px;
      left: 32px;
      width: 6px;
      height: 6px;
      background: #3fa9f5;
      border-radius: 50%;
      box-shadow: 0 0 8px #3fa9f5;
      z-index: 2;
    `;
    root.appendChild(led);
  }

  public unmount(): void {
    if (this.rootEl) {
      this.rootEl.innerHTML = '';
      this.rootEl = null;
    }
  }

  private createJewelButton(label: string, title: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.style.cssText = `
      width: 32px;
      height: 32px;
      background: radial-gradient(circle, #b39ddb 0%, #6b4c9a 100%);
      color: ${UI_PALETTE.warmWhite};
      border: 2px solid #ffffff;
      border-radius: 50%;
      font-family: "Press Start 2P", monospace;
      font-size: 10px;
      cursor: pointer;
      box-shadow: 0 3px 0 #311b47, 0 0 8px rgba(179, 157, 219, 0.6);
      transition: transform 80ms ease, box-shadow 80ms ease;
    `;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }
}