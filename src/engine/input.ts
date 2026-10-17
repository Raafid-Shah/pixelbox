// src/engine/input.ts
import { Action, bus, EventBus, InputSource } from './bus';

export type KeyMap = Record<string, Action>;

/**
 * Default keyboard bindings supporting WASD, Arrow keys, Z/X, J/K, and Enter/Escape
 * so visitors can play immediately with either hand without hunting for keys (Pillar 5).
 */
export const DEFAULT_KEYMAP: KeyMap = {
  ArrowUp: 'UP',
  KeyW: 'UP',
  ArrowDown: 'DOWN',
  KeyS: 'DOWN',
  ArrowLeft: 'LEFT',
  KeyA: 'LEFT',
  ArrowRight: 'RIGHT',
  KeyD: 'RIGHT',
  KeyZ: 'A',
  KeyJ: 'A',
  Enter: 'A',
  Space: 'A',
  KeyX: 'B',
  KeyK: 'B',
  Backspace: 'B',
  KeyC: 'START',
  ShiftRight: 'SELECT',
  Tab: 'SELECT',
  KeyQ: 'L',
  BracketLeft: 'L',
  KeyE: 'R',
  BracketRight: 'R',
};

// Standard W3C Gamepad button indices
const GAMEPAD_BUTTON_MAP: ReadonlyArray<readonly [number, Action]> = [
  [0, 'A'],      // Bottom face button (Cross / B)
  [1, 'B'],      // Right face button (Circle / A)
  [4, 'L'],      // Left shoulder bumper
  [5, 'R'],      // Right shoulder bumper
  [8, 'SELECT'], // Select / Back
  [9, 'START'],  // Start / Options
  [12, 'UP'],    // D-Pad Up
  [13, 'DOWN'],  // D-Pad Down
  [14, 'LEFT'],  // D-Pad Left
  [15, 'RIGHT'], // D-Pad Right
];

const KONAMI_SEQUENCE: readonly Action[] = [
  'UP', 'UP', 'DOWN', 'DOWN', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT', 'B', 'A',
];

export class InputManager {
  private readonly activeActions = new Set<Action>();
  private readonly gamepadHeld = new Set<Action>();
  private keyMap: KeyMap = { ...DEFAULT_KEYMAP };
  private attached = false;
  private lampLit = true;
  private screenDived = false;
  private konamiIndex = 0;

  // Ordered launch Sets for the 'V' quick-cycle shortcut (Section 7)
  private readonly launchSets = ['late-byte-cafe', 'deck-89', 'pocket-hour'] as const;
  private currentSetIndex = 0;

  constructor(private readonly eventBus: EventBus = bus) {}

  public attach(target: Window = window): void {
    if (this.attached) return;
    target.addEventListener('keydown', this.handleKeyDown);
    target.addEventListener('keyup', this.handleKeyUp);
    target.addEventListener('blur', this.releaseAll);
    this.attached = true;
  }

  public detach(target: Window = window): void {
    if (!this.attached) return;
    target.removeEventListener('keydown', this.handleKeyDown);
    target.removeEventListener('keyup', this.handleKeyUp);
    target.removeEventListener('blur', this.releaseAll);
    this.attached = false;
  }

  /**
   * Updates key bindings live (used by Settings > Controls > Remapping in Phase 7).
   */
  public setKeyMap(customMap: KeyMap): void {
    this.keyMap = { ...customMap };
    this.eventBus.emit('setting:change', { path: 'controls.keyMap', value: this.keyMap });
  }

  public getKeyMap(): Readonly<KeyMap> {
    return this.keyMap;
  }

  public isDown(action: Action): boolean {
    return this.activeActions.has(action);
  }

  /**
   * Emits a unified input action from any source (keyboard, gamepad, touch, SVG hardware, remote).
   * Subscribed hardware parts tilt joysticks (3 deg) and depress buttons (2-3 px) automatically.
   */
  public trigger(action: Action, pressed: boolean, source: InputSource = 'hardware'): void {
    const alreadyDown = this.activeActions.has(action);
    if (pressed && alreadyDown) return; // Ignore OS key-repeat floods
    if (!pressed && !alreadyDown) return;

    if (pressed) {
      this.activeActions.add(action);
      this.checkKonamiStep(action);
    } else {
      this.activeActions.delete(action);
    }

    this.eventBus.emit('input:action', {
      action,
      pressed,
      source,
      timestamp: performance.now(),
    });
  }

  /**
   * Polls connected gamepads once per display frame with zero heap allocations.
   */
  public pollGamepads(): void {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    const pad = pads[0];
    if (!pad) return;

    for (let i = 0; i < GAMEPAD_BUTTON_MAP.length; i++) {
      const [btnIdx, action] = GAMEPAD_BUTTON_MAP[i];
      const btn = pad.buttons[btnIdx];
      const isPressed = Boolean(btn && btn.pressed);
      this.syncGamepadState(action, isPressed);
    }

    // Left analog stick deadzone threshold (0.42) when D-Pad buttons aren't physically held
    const axisX = pad.axes[0] ?? 0;
    const axisY = pad.axes[1] ?? 0;
    if (!pad.buttons[14]?.pressed && !pad.buttons[15]?.pressed) {
      this.syncGamepadState('LEFT', axisX < -0.42);
      this.syncGamepadState('RIGHT', axisX > 0.42);
    }
    if (!pad.buttons[12]?.pressed && !pad.buttons[13]?.pressed) {
      this.syncGamepadState('UP', axisY < -0.42);
      this.syncGamepadState('DOWN', axisY > 0.42);
    }
  }

  private syncGamepadState(action: Action, isPressed: boolean): void {
    const wasPressed = this.gamepadHeld.has(action);
    if (isPressed && !wasPressed) {
      this.gamepadHeld.add(action);
      this.trigger(action, true, 'gamepad');
    } else if (!isPressed && wasPressed) {
      this.gamepadHeld.delete(action);
      this.trigger(action, false, 'gamepad');
    }
  }

  private checkKonamiStep(action: Action): void {
    if (action === KONAMI_SEQUENCE[this.konamiIndex]) {
      this.konamiIndex++;
      if (this.konamiIndex === KONAMI_SEQUENCE.length) {
        this.konamiIndex = 0;
        this.eventBus.emit('unlock', {
          id: 'konami-rainbow',
          kind: 'secret',
          label: 'KONAMI CODE: Rainbow Phosphor Mode Unlocked!',
        });
      }
    } else {
      this.konamiIndex = action === KONAMI_SEQUENCE[0] ? 1 : 0;
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // Section 8: 'L' toggles the warm key lamp
    if (e.code === 'KeyL') {
      e.preventDefault();
      this.lampLit = !this.lampLit;
      document.documentElement.style.setProperty('--lamp-key-opacity', this.lampLit ? '1' : '0');
      this.eventBus.emit('lamp:toggle', { lit: this.lampLit });
      return;
    }

    // Section 12: 'F' toggles Screen Dive camera push; 'Escape' returns from Dive or acts as B
    if (e.code === 'KeyF') {
      e.preventDefault();
      this.screenDived = !this.screenDived;
      this.eventBus.emit('screen:dive', { active: this.screenDived });
      return;
    }

    if (e.code === 'Escape') {
      e.preventDefault();
      if (this.screenDived) {
        this.screenDived = false;
        this.eventBus.emit('screen:dive', { active: false });
        return;
      }
      this.trigger('B', true, 'keyboard');
      return;
    }

    // Section 7: 'V' cycles Sets live with static/cross-fade transition
    if (e.code === 'KeyV') {
      e.preventDefault();
      this.currentSetIndex = (this.currentSetIndex + 1) % this.launchSets.length;
      const nextSetId = this.launchSets[this.currentSetIndex];
      this.eventBus.emit('setting:change', { path: 'display.set', value: nextSetId });
      return;
    }

    const action = this.keyMap[e.code];
    if (action) {
      e.preventDefault();
      this.trigger(action, true, 'keyboard');
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (e.code === 'Escape') {
      this.trigger('B', false, 'keyboard');
      return;
    }
    const action = this.keyMap[e.code];
    if (action) {
      e.preventDefault();
      this.trigger(action, false, 'keyboard');
    }
  };

  private releaseAll = (): void => {
    for (const action of this.activeActions) {
      this.eventBus.emit('input:action', {
        action,
        pressed: false,
        source: 'keyboard',
        timestamp: performance.now(),
      });
    }
    this.activeActions.clear();
    this.gamepadHeld.clear();
  };
}

export const input = new InputManager(bus);