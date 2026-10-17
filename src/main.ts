// src/main.ts
import { bus } from './engine/bus';
import { GameLoop, LoopCallbacks } from './engine/loop';
import { camera } from './engine/camera';
import { WebGLPipeline } from './engine/gl/pipeline';
import { bitmapFont } from './engine/bitmapfont';
import { cafeRoom } from './room/themes/cafe1989';
import { lighting } from './room/lighting';
import { mixer } from './audio/mixer';
import { BroadcastWoodBody } from './hardware/bodies/broadcastwood';
import { Deck89Body } from './hardware/bodies/deck89';
import { PrismClearBody } from './hardware/bodies/prismclear';
import { MenuScene } from './scenes/menu';
import { classicView } from './scenes/classic';

class PixelboxApp {
  private container?: HTMLElement;
  private roomLayer?: HTMLElement;
  private hardwareLayer?: HTMLElement;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private pipeline: WebGLPipeline | null = null;
  private menuScene?: MenuScene;
  private activeBody: BroadcastWoodBody | Deck89Body | PrismClearBody;
  private loop?: GameLoop;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 320;
    this.offscreenCanvas.height = 180;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!;

    const recommended = camera.detectDeviceAndRecommendSet();
    if (recommended.defaultSet === 'deck-89') {
      this.activeBody = new Deck89Body();
    } else if (recommended.defaultSet === 'pocket-hour') {
      this.activeBody = new PrismClearBody();
    } else {
      this.activeBody = new BroadcastWoodBody();
    }

    // 1. Check for Classic View URL parameter (?classic=1)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('classic') === '1') {
      const root = document.getElementById('app') ?? document.body;
      classicView.mount(root);
      return;
    }

    const root = document.getElementById('app') ?? document.body;
    root.innerHTML = '';
    root.style.cssText = 'position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #07090f;';

    // 2. Room Background Layer
    this.roomLayer = document.createElement('div');
    this.roomLayer.id = 'pixelbox-room';
    root.appendChild(this.roomLayer);
    cafeRoom.mount(this.roomLayer);

    // 3. Stage Wrapper for Hardware & Camera
    this.container = document.createElement('div');
    this.container.id = 'pixelbox-stage';
    this.container.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10;';
    root.appendChild(this.container);

    this.hardwareLayer = document.createElement('div');
    this.container.appendChild(this.hardwareLayer);

    // 4. Initialize WebGL Pipeline
    this.pipeline = new WebGLPipeline(this.offscreenCanvas, this.hardwareLayer, bus);

    // 5. Mount Hardware Body
    this.activeBody.mount(this.hardwareLayer, {
      bus,
      getScreenCanvas: () => this.pipeline!.getDisplayCanvas(),
    });

    // 6. Mount Camera Controller
    camera.mount(this.container, this.roomLayer, () => this.activeBody.screenRect());

    // 7. Initialize Menu Scene & Audio Mixer
    this.menuScene = new MenuScene(bus);
    mixer.init();

    // 8. Instantiate GameLoop matching LoopCallbacks signature precisely
    const callbacks: LoopCallbacks = {
      update: (_dtMs: number, _frameCount: number) => {
        // Simulation step
      },
      render: (_alpha: number, frameCount: number) => {
        const nowMs = frameCount * 16.6;
        this.offscreenCtx.clearRect(0, 0, 320, 180);

        if (bitmapFont.isReady() && this.menuScene) {
          this.menuScene.render(this.offscreenCtx, nowMs);
        }

        this.pipeline?.renderFrame();
      },
      onLightSampleTick: (_frameCount: number) => {
        lighting.sampleScreenSpill(this.offscreenCanvas);
      },
    };

    this.loop = new GameLoop(callbacks, bus);
    this.loop.start();

    bus.on('power:toggle', () => {
      mixer.setSpeakerProfile(this.activeBody.speaker);
    });
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    new PixelboxApp();
  });
}