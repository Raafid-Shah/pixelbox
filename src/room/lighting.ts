// src/room/lighting.ts
import { bus, EventBus } from '../engine/bus';

export class LightingManager {
  private sampleCanvas: HTMLCanvasElement;
  private sampleCtx: CanvasRenderingContext2D | null = null;

  constructor(private readonly eventBus: EventBus = bus) {
    this.sampleCanvas = document.createElement('canvas');
    this.sampleCanvas.width = 3;
    this.sampleCanvas.height = 1; // 3 horizontal pixels: [Left, Center, Right]
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true });
  }

  /**
   * Samples the active game frame canvas and writes RGB averages into CSS variables
   * to relight the room walls dynamically (Section 8)[cite: 8].
   */
  public sampleScreenSpill(sourceCanvas: HTMLCanvasElement): void {
    if (!this.sampleCtx) return;
    try {
      this.sampleCtx.drawImage(sourceCanvas, 0, 0, 3, 1);
      const imgData = this.sampleCtx.getImageData(0, 0, 3, 1).data;

      const leftColor = `rgba(${imgData[0]}, ${imgData[1]}, ${imgData[2]}, 0.22)`;
      const centerColor = `rgba(${imgData[4]}, ${imgData[5]}, ${imgData[6]}, 0.28)`;
      const rightColor = `rgba(${imgData[8]}, ${imgData[9]}, ${imgData[10]}, 0.22)`;

      const docStyle = document.documentElement.style;
      docStyle.setProperty('--light-spill-left', leftColor);
      docStyle.setProperty('--light-spill-center', centerColor);
      docStyle.setProperty('--light-spill-right', rightColor);

      this.eventBus.emit('frame:glow', {
        left: [imgData[0], imgData[1], imgData[2]],
        center: [imgData[4], imgData[5], imgData[6]],
        right: [imgData[8], imgData[9], imgData[10]],
      });
    } catch {
      // Suppress cross-origin or uninitialized texture errors gracefully
    }
  }
}

export const lighting = new LightingManager(bus);