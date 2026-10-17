// src/room/themes/cafe1989.ts
import { UI_PALETTE } from '../../theme/tokens';

export class Cafe1989Room {
  private rootEl: HTMLElement | null = null;

  public mount(container: HTMLElement): void {
    this.rootEl = container;
    container.innerHTML = '';
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: radial-gradient(circle at 35% 40%, #151b2b 0%, #07090f 100%);
      overflow: hidden;
      z-index: 0;
      user-select: none;
    `;

    // 1. Room Background SVG Layers (Patterned wall, rainy window, neon signs)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 1280 720');
    svg.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;';
    svg.innerHTML = `
      <!-- Wainscoting & Patterned Wall -->
      <rect width="1280" height="720" fill="#0b0f1a"/>
      <rect y="480" width="1280" height="240" fill="#141c2e"/>
      <line x1="0" y1="480" x2="1280" y2="480" stroke="#4f7388" stroke-width="3"/>

      <!-- Rainy Night Window with Skyline -->
      <g transform="translate(850, 80)">
        <rect width="280" height="360" rx="8" fill="#05070c" stroke="#8fb8cc" stroke-width="4"/>
        <path d="M 40 40 V 320 M 140 40 V 320 M 240 40 V 320" stroke="#4f7388" stroke-width="2"/>
        <rect x="60" y="120" width="30" height="200" fill="#1b2838"/>
        <rect x="180" y="80" width="40" height="240" fill="#2c4257"/>
        <circle cx="90" cy="100" r="4" fill="#ffb000" opacity="0.8"/>
        <circle cx="200" cy="70" r="4" fill="#d8342b" opacity="0.8"/>
      </g>

      <!-- Neon Sign: Late Byte -->
      <g transform="translate(120, 100)">
        <text x="0" y="40" font-family="'Press Start 2P', monospace" font-size="28" fill="#ff77a8" filter="drop-shadow(0 0 12px #ff77a8)">LATE BYTE</text>
        <text x="10" y="72" font-family="'Press Start 2P', monospace" font-size="14" fill="#3fa9f5" filter="drop-shadow(0 0 8px #3fa9f5)">CAFE 1989</text>
      </g>

      <!-- Counter Surface & Warm Lamp Spill Glow -->
      <rect y="540" width="1280" height="180" fill="#5c3824" opacity="0.95"/>
      <ellipse cx="640" cy="540" rx="450" ry="120" fill="var(--light-spill-center, rgba(63, 169, 245, 0.22))" style="mix-blend-mode: screen;"/>
    `;

    container.appendChild(svg);
  }

  public unmount(): void {
    if (this.rootEl) {
      this.rootEl.innerHTML = '';
      this.rootEl = null;
    }
  }
}

export const cafeRoom = new Cafe1989Room();