// src/engine/camera.ts
import { bus, EventBus } from './bus';
import { computeIntegerScale, DISPLAY_CONSTANTS, UI_PALETTE } from '../theme/tokens';

export type CameraMode = 'room' | 'theater' | 'dive';
export type DeviceProfile = 'desktop-wide' | 'tablet-mid' | 'mobile-portrait';

export interface CameraState {
  mode: CameraMode;
  deviceProfile: DeviceProfile;
  scale: number;
  translateX: number;
  translateY: number;
  integerGameScale: number;
  reducedMotion: boolean;
  hudVisible: boolean;
}

/**
 * Section 4 & Section 12: Responsive Camera & Screen Dive Controller.
 * Ensures the CRT/LCD screen is never tiny on large monitors or phones,
 * computes the exact matrix mapping screenRect() to the viewport during Screen Dive,
 * and renders an auto-hiding translucent Command Popup Bar when immersed.
 */
export class CameraController {
  private rootEl: HTMLElement | null = null;
  private roomLayerEl: HTMLElement | null = null;
  private hudOverlayEl: HTMLElement | null = null;
  private getScreenRectFn: (() => DOMRectReadOnly) | null = null;
  private hudHideTimer: number | null = null;

  private state: CameraState = {
    mode: 'theater', // Default to generous Theater framing so screen is never tiny
    deviceProfile: 'desktop-wide',
    scale: 1,
    translateX: 0,
    translateY: 0,
    integerGameScale: 3,
    reducedMotion: false,
    hudVisible: true,
  };

  constructor(private readonly eventBus: EventBus = bus) {}

  /**
   * Mounts the camera controller onto the stage wrapper and injects the
   * floating Immersion Command HUD so users always have one-click access to commands.
   */
  public mount(
    stageWrapper: HTMLElement,
    roomLayer: HTMLElement | null,
    getScreenRect: () => DOMRectReadOnly
  ): void {
    this.rootEl = stageWrapper;
    this.roomLayerEl = roomLayer;
    this.getScreenRectFn = getScreenRect;

    this.state.reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    this.injectFloatingCommandHud(stageWrapper.parentElement ?? document.body);
    this.detectDeviceAndRecommendSet();
    this.recomputeTransform();

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousemove', this.handleUserActivity, { passive: true });
    window.addEventListener('touchstart', this.handleUserActivity, { passive: true });
    window.addEventListener('keydown', this.handleUserActivity, { passive: true });

    // Listen to 'F' / 'Escape' Screen Dive events from engine/input.ts
    this.eventBus.on('screen:dive', ({ active }) => {
      this.setMode(active ? 'dive' : 'theater');
    });

    this.eventBus.on('setting:change', ({ path, value }) => {
      if (path === 'a11y.reducedMotion') {
        this.state.reducedMotion = Boolean(value);
        this.applyCssVariables();
      }
    });
  }

  public unmount(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleUserActivity);
    window.removeEventListener('touchstart', this.handleUserActivity);
    window.removeEventListener('keydown', this.handleUserActivity);
    if (this.hudHideTimer !== null) {
      window.clearTimeout(this.hudHideTimer);
    }
    this.hudOverlayEl?.remove();
  }

  public getState(): Readonly<CameraState> {
    return this.state;
  }

  /**
   * Switches between:
   * - 'room': Wide atmospheric shot showing shelves, plant, lamp, and framed prints (62% screen fill)
   * - 'theater': Default hero view where the CRT/handheld commands the screen (78% screen fill)
   * - 'dive': Full-viewport immersion mapping screenRect() to 94% of the user's display
   */
  public setMode(mode: CameraMode): void {
    if (this.state.mode === mode) return;
    this.state.mode = mode;
    this.recomputeTransform();
    this.showHudTemporarily();
    this.updateHudButtonLabels();
  }

  public cycleMode(): void {
    const next: Record<CameraMode, CameraMode> = {
      theater: 'dive',
      dive: 'room',
      room: 'theater',
    };
    this.setMode(next[this.state.mode]);
  }

  /**
   * Section 7: Automatically selects the optimal default Set for the user's screen geometry
   * unless overridden by ?set= in the URL.
   * - Wide desktop (>= 1100px): 'late-byte-cafe' (Broadcast Wood CRT + controller)
   * - Mid screen / tablet (768px..1099px): 'deck-89' (Console deck)
   * - Narrow / touch phone (< 768px): 'pocket-hour' (Prism Clear portrait handheld)
   */
  public detectDeviceAndRecommendSet(): { profile: DeviceProfile; defaultSet: string } {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isTouchPortrait = w < 768 || (w < h && w < 1024);

    let profile: DeviceProfile = 'desktop-wide';
    let defaultSet = 'late-byte-cafe';

    if (isTouchPortrait) {
      profile = 'mobile-portrait';
      defaultSet = 'pocket-hour';
    } else if (w < 1100) {
      profile = 'tablet-mid';
      defaultSet = 'deck-89';
    }

    this.state.deviceProfile = profile;
    return { profile, defaultSet };
  }

  /**
   * Computes the exact CSS matrix transform mapping the hardware screenRect()
   * to the target viewport fill ratio, while accelerating room layer scale during Dive
   * so the room falls away naturally around the viewer's peripheral vision.
   */
  public recomputeTransform(): void {
    if (typeof window === 'undefined') return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Calculate largest crisp integer multiple of 320x180 for internal canvas backing
    this.state.integerGameScale = computeIntegerScale(vw * 0.92, vh * 0.92);

    if (!this.rootEl || !this.getScreenRectFn) return;

    // Reset transform briefly to measure natural layout coordinates
    const rect = this.getScreenRectFn();
    const screenW = rect.width || DISPLAY_CONSTANTS.BASE_WIDTH * 2;
    const screenH = rect.height || DISPLAY_CONSTANTS.BASE_HEIGHT * 2;
    const screenCenterX = rect.left + screenW / 2;
    const screenCenterY = rect.top + screenH / 2;

    const viewportCenterX = vw / 2;
    const viewportCenterY = vh / 2;

    // Target percentage of viewport the game screen itself should occupy
    let targetViewportFill = 0.76; // 'theater' default: large, commanding screen with bezel/room frame
    if (this.state.mode === 'room') {
      targetViewportFill = 0.58; // Pull back to admire shelf, plant, lamp, rain window
    } else if (this.state.mode === 'dive') {
      targetViewportFill = this.state.deviceProfile === 'mobile-portrait' ? 0.96 : 0.92;
    }

    const scaleX = (vw * targetViewportFill) / screenW;
    const scaleY = (vh * targetViewportFill) / screenH;
    const targetScale = Math.max(0.85, Math.min(scaleX, scaleY, 4.5));

    const tx =
      this.state.mode === 'room'
        ? 0
        : Math.round((viewportCenterX - screenCenterX) * (targetScale * 0.65));
    const ty =
      this.state.mode === 'room'
        ? 0
        : Math.round((viewportCenterY - screenCenterY) * (targetScale * 0.65));

    this.state.scale = Number(targetScale.toFixed(3));
    this.state.translateX = tx;
    this.state.translateY = ty;

    this.applyCssVariables();
  }

  private applyCssVariables(): void {
    const docStyle = document.documentElement.style;
    docStyle.setProperty('--pixel-scale', String(this.state.integerGameScale));
    docStyle.setProperty('--camera-scale', String(this.state.scale));
    docStyle.setProperty('--camera-tx', `${this.state.translateX}px`);
    docStyle.setProperty('--camera-ty', `${this.state.translateY}px`);

    if (!this.rootEl) return;

    // Pillar 2 (Tactile): Slight spring overshoot curve unless reducedMotion is enabled
    const transitionCurve = this.state.reducedMotion
      ? 'opacity 180ms ease-out'
      : 'transform 420ms cubic-bezier(0.22, 1.18, 0.36, 1)';

    this.rootEl.style.transition = transitionCurve;
    this.rootEl.style.transformOrigin = 'center center';
    this.rootEl.style.transform = `translate3d(${this.state.translateX}px, ${this.state.translateY}px, 0) scale(${this.state.scale})`;

    // Section 4: Room layers scale faster during Screen Dive so they fall away into periphery
    if (this.roomLayerEl) {
      const roomScale =
        this.state.mode === 'dive'
          ? this.state.scale * 1.35
          : this.state.mode === 'theater'
            ? 1.06
            : 1.0;
      const roomOpacity = this.state.mode === 'dive' ? '0.18' : '1';
      this.roomLayerEl.style.transition = this.state.reducedMotion
        ? 'opacity 180ms ease-out'
        : 'transform 460ms cubic-bezier(0.22, 1.12, 0.36, 1), opacity 320ms ease-out';
      this.roomLayerEl.style.transform = `scale(${roomScale.toFixed(3)})`;
      this.roomLayerEl.style.opacity = roomOpacity;
    }
  }

  /**
   * Injects the translucent, auto-hiding Arcade Cafe Command Popup Bar at the bottom of the screen.
   * Ensures that even in 100% Full Screen Dive (or on touch devices without keyboards),
   * the user can toggle immersion, switch Sets, toggle the lamp, or open Classic View in 1 tap.
   */
  private injectFloatingCommandHud(container: HTMLElement): void {
    if (typeof document === 'undefined') return;
    const bar = document.createElement('nav');
    bar.setAttribute('aria-label', 'Pixelbox Quick Commands and Immersion Controls');
    bar.style.cssText = `
      position: fixed;
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(11, 15, 26, 0.88);
      border: 2px solid ${UI_PALETTE.border};
      box-shadow: 0 4px 0 ${UI_PALETTE.borderShadow}, 0 8px 24px rgba(0, 0, 0, 0.75);
      border-radius: 4px;
      font-family: "Press Start 2P", monospace;
      font-size: 10px;
      color: ${UI_PALETTE.warmWhite};
      backdrop-filter: blur(6px);
      transition: opacity 260ms ease, transform 260ms ease;
      user-select: none;
    `;

    const makeBtn = (id: string, label: string, title: string, onClick: () => void) => {
      const btn = document.createElement('button');
      btn.id = id;
      btn.type = 'button';
      btn.textContent = label;
      btn.title = title;
      btn.style.cssText = `
        background: ${UI_PALETTE.nearBlack};
        color: ${UI_PALETTE.warmWhite};
        border: 1px solid ${UI_PALETTE.borderShadow};
        padding: 5px 8px;
        font-family: inherit;
        font-size: 9px;
        cursor: pointer;
        border-radius: 2px;
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
        this.showHudTemporarily();
      });
      return btn;
    };

    const diveBtn = makeBtn(
      'pb-cmd-dive',
      '[F] FULL SCREEN DIVE',
      'Toggle Full-Screen CRT Immersion (Shortcut: F or Esc)',
      () => this.setMode(this.state.mode === 'dive' ? 'theater' : 'dive')
    );

    const viewBtn = makeBtn(
      'pb-cmd-view',
      'VIEW: THEATER',
      'Cycle Camera Framing: Theater -> Full Dive -> Full Room',
      () => this.cycleMode()
    );

    const setBtn = makeBtn(
      'pb-cmd-set',
      '[V] SWITCH SET',
      'Cycle Hardware Set (Late Byte Cafe / Deck 89 / Pocket Hour)',
      () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV' }));
      }
    );

    const lampBtn = makeBtn(
      'pb-cmd-lamp',
      '[L] LAMP',
      'Toggle Warm Key Lamp Light',
      () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyL' }));
      }
    );

    const classicLink = document.createElement('a');
    classicLink.href = '?classic=1';
    classicLink.textContent = 'CLASSIC VIEW';
    classicLink.title = 'Instant plain-text portfolio view (Pillar 5)';
    classicLink.style.cssText = `
      color: ${UI_PALETTE.amber};
      text-decoration: none;
      padding: 5px 8px;
      border: 1px solid ${UI_PALETTE.amber};
      font-size: 9px;
      border-radius: 2px;
    `;

    bar.append(diveBtn, viewBtn, setBtn, lampBtn, classicLink);
    container.appendChild(bar);
    this.hudOverlayEl = bar;
    this.showHudTemporarily();
  }

  private updateHudButtonLabels(): void {
    if (!this.hudOverlayEl) return;
    const diveBtn = this.hudOverlayEl.querySelector('#pb-cmd-dive');
    const viewBtn = this.hudOverlayEl.querySelector('#pb-cmd-view');
    if (diveBtn) {
      diveBtn.textContent =
        this.state.mode === 'dive' ? '[ESC] EXIT FULL SCREEN' : '[F] FULL SCREEN DIVE';
    }
    if (viewBtn) {
      viewBtn.textContent = `VIEW: ${this.state.mode.toUpperCase()}`;
    }
  }

  private showHudTemporarily = (): void => {
    if (!this.hudOverlayEl) return;
    this.state.hudVisible = true;
    this.hudOverlayEl.style.opacity = '1';
    this.hudOverlayEl.style.pointerEvents = 'auto';

    if (this.hudHideTimer !== null) {
      window.clearTimeout(this.hudHideTimer);
    }

    // In Full Dive mode, auto-fade the command bar after 2.6s of idle cursor so nothing blocks the CRT
    if (this.state.mode === 'dive') {
      this.hudHideTimer = window.setTimeout(() => {
        if (this.hudOverlayEl && this.state.mode === 'dive') {
          this.state.hudVisible = false;
          this.hudOverlayEl.style.opacity = '0.12';
        }
      }, 2600);
    }
  };

  private handleUserActivity = (): void => {
    this.showHudTemporarily();
  };

  private handleResize = (): void => {
    this.detectDeviceAndRecommendSet();
    this.recomputeTransform();
  };
}

export const camera = new CameraController(bus);