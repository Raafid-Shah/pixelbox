// src/engine/loop.ts
import { bus, EventBus } from './bus';
import { DISPLAY_CONSTANTS } from '../theme/tokens';
import { input, InputManager } from './input';

export type QualityTier = 0 | 1 | 2 | 3;

export interface LoopMetrics {
  fps: number;
  frameTimeMs: number;
  updateTimeMs: number;
  renderTimeMs: number;
  qualityTier: QualityTier;
  frameCount: number;
}

export interface LoopCallbacks {
  /** Fixed 60Hz (16.666ms) simulation tick */
  update: (dtMs: number, frameCount: number) => void;
  /** Variable-rate render pass with sub-frame interpolation alpha (0..1) */
  render: (alpha: number, frameCount: number) => void;
  /** Optional hook fired every 2nd frame for 80x45 secondary Mirror Screens (< 0.2ms) */
  onMirrorTick?: (frameCount: number) => void;
  /** Optional hook fired every 4th frame for 3-region screen light spill sampling */
  onLightSampleTick?: (frameCount: number) => void;
}

export class GameLoop {
  private rafId: number | null = null;
  private running = false;
  private lastTimestamp = 0;
  private accumulator = 0;
  private frameCount = 0;

  // Fixed 60 FPS simulation step (16.6667 ms)
  private readonly STEP_MS = 1000 / 60;
  // Clamp max delta to 100ms (6 steps) to prevent spiral-of-death after tab unfocus
  private readonly MAX_DELTA_MS = 100;

  // Adaptive Quality Governor state (Section 6)
  // 0 = Full Ultra | 1 = Drop Room FX | 2 = Drop Shader Bloom | 3 = Drop Persistence
  private qualityTier: QualityTier = 0;
  private overBudgetAccumMs = 0;
  private readonly GOVERNOR_THRESHOLD_MS = DISPLAY_CONSTANTS.TARGET_FRAME_MS + 1.4; // 18.0 ms
  private readonly GOVERNOR_WINDOW_MS = 2000; // 2 seconds continuous overrun

  // Pre-allocated metrics object (Zero hot-path allocation for Service Menu overlay)
  private readonly metrics: LoopMetrics = {
    fps: 60,
    frameTimeMs: 16.6,
    updateTimeMs: 0,
    renderTimeMs: 0,
    qualityTier: 0,
    frameCount: 0,
  };

  constructor(
    private readonly callbacks: LoopCallbacks,
    private readonly eventBus: EventBus = bus,
    private readonly inputMgr: InputManager = input
  ) {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  public stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public destroy(): void {
    this.stop();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  public getQualityTier(): QualityTier {
    return this.qualityTier;
  }

  /**
   * Allows manual override of quality tier from Settings > Display (Phase 7).
   */
  public setQualityTier(tier: QualityTier): void {
    this.qualityTier = tier;
    this.metrics.qualityTier = tier;
    this.overBudgetAccumMs = 0;
    this.eventBus.emit('quality:governor', {
      tier: this.qualityTier,
      avgFrameMs: this.metrics.frameTimeMs,
    });
  }

  /**
   * Returns a read-only reference to the pre-allocated metrics struct (zero GC allocation).
   */
  public getMetrics(): Readonly<LoopMetrics> {
    return this.metrics;
  }

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  };

  private tick = (now: number): void => {
    if (!this.running) return;

    const rawDelta = now - this.lastTimestamp;
    this.lastTimestamp = now;

    // Smooth exponential moving average for telemetry FPS & frame time
    this.metrics.frameTimeMs = this.metrics.frameTimeMs * 0.9 + rawDelta * 0.1;
    this.metrics.fps = Math.min(240, Math.round(1000 / Math.max(1, this.metrics.frameTimeMs)));

    // Section 6: Check Adaptive Quality Governor
    this.evaluateGovernor(rawDelta);

    const clampedDelta = rawDelta > this.MAX_DELTA_MS ? this.MAX_DELTA_MS : rawDelta;
    this.accumulator += clampedDelta;

    // Poll hardware gamepads once per display frame
    this.inputMgr.pollGamepads();

    // Fixed-timestep simulation updates
    const updateStart = performance.now();
    while (this.accumulator >= this.STEP_MS) {
      this.callbacks.update(this.STEP_MS, this.frameCount);
      this.accumulator -= this.STEP_MS;
    }
    this.metrics.updateTimeMs = performance.now() - updateStart;

    // Interpolation factor (0..1) for smooth sub-frame camera pushes
    const alpha = this.accumulator / this.STEP_MS;

    // Render pass
    const renderStart = performance.now();
    this.frameCount++;
    this.metrics.frameCount = this.frameCount;
    this.callbacks.render(alpha, this.frameCount);

    // Section 8: Every 2nd frame -> update 80x45 Mirror Screens (< 0.2 ms budget)
    if ((this.frameCount & 1) === 0 && this.callbacks.onMirrorTick) {
      this.callbacks.onMirrorTick(this.frameCount);
    }

    // Section 8: Every 4th frame -> sample 3 screen zones for real room light spill
    if ((this.frameCount & 3) === 0 && this.callbacks.onLightSampleTick && this.qualityTier < 1) {
      this.callbacks.onLightSampleTick(this.frameCount);
    }

    this.metrics.renderTimeMs = performance.now() - renderStart;
    this.rafId = requestAnimationFrame(this.tick);
  };

  private evaluateGovernor(frameDurationMs: number): void {
    if (this.qualityTier >= 3) return;

    if (frameDurationMs > this.GOVERNOR_THRESHOLD_MS) {
      this.overBudgetAccumMs += frameDurationMs;
      if (this.overBudgetAccumMs >= this.GOVERNOR_WINDOW_MS) {
        this.qualityTier = (this.qualityTier + 1) as QualityTier;
        this.metrics.qualityTier = this.qualityTier;
        this.overBudgetAccumMs = 0;
        this.eventBus.emit('quality:governor', {
          tier: this.qualityTier,
          avgFrameMs: this.metrics.frameTimeMs,
        });
      }
    } else if (this.overBudgetAccumMs > 0) {
      // Recover gradually when frame times are comfortably under budget
      this.overBudgetAccumMs = Math.max(0, this.overBudgetAccumMs - frameDurationMs * 0.5);
    }
  }
}