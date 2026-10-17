// src/engine/gl/pipeline.ts
import { ShaderPreset, bus, EventBus } from '../bus';
import { DISPLAY_CONSTANTS } from '../../theme/tokens';
import { DISPLAY_FRAGMENT_SHADER_SRC, VERTEX_SHADER_SRC, getShaderUniforms, ShaderUniforms } from './shader';

export class WebGLPipeline {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private fallbackCtx: CanvasRenderingContext2D | null = null;
  private activePreset: ShaderPreset = 'CRT';
  private uniforms: ShaderUniforms;
  private isFallbackMode = false;

  constructor(
    private readonly sourceCanvas: HTMLCanvasElement,
    private readonly targetContainer: HTMLElement,
    private readonly eventBus: EventBus = bus
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = DISPLAY_CONSTANTS.BASE_WIDTH;
    this.canvas.height = DISPLAY_CONSTANTS.BASE_HEIGHT;
    this.canvas.style.cssText = 'width: 100%; height: 100%; image-rendering: pixelated; display: block;';
    this.targetContainer.appendChild(this.canvas);

    this.uniforms = getShaderUniforms('CRT');
    this.initContext();

    // Listen to quality governor to shed bloom/persistence under load (Section 6)
    this.eventBus.on('quality:governor', ({ tier }) => {
      if (tier >= 2) {
        this.uniforms.bloom = 0.0;
      }
    });
  }

  public getDisplayCanvas(): HTMLCanvasElement {
    return this.isFallbackMode && this.fallbackCtx ? this.canvas : this.canvas;
  }

  public setPreset(preset: ShaderPreset): void {
    this.activePreset = preset;
    this.uniforms = getShaderUniforms(preset);
    this.isFallbackMode = preset === 'Fast';
  }

  public renderFrame(): void {
    if (this.isFallbackMode || !this.gl || !this.program) {
      this.renderFallback();
      return;
    }

    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    // Upload source game canvas frame into WebGL texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this.sourceCanvas
    );

    // Set uniforms
    gl.uniform1i(gl.getUniformLocation(this.program, 'u_texture'), 0);
    gl.uniform2f(gl.getUniformLocation(this.program, 'u_texSize'), this.canvas.width, this.canvas.height);
    gl.uniform1f(gl.getUniformLocation(this.program, 'u_curvature'), this.uniforms.curvature);
    gl.uniform1f(gl.getUniformLocation(this.program, 'u_scanlines'), this.uniforms.scanlines);
    gl.uniform1f(gl.getUniformLocation(this.program, 'u_bloom'), this.uniforms.bloom);
    gl.uniform1f(gl.getUniformLocation(this.program, 'u_noise'), this.uniforms.noise);
    gl.uniform1f(gl.getUniformLocation(this.program, 'u_brightness'), this.uniforms.brightness);
    gl.uniform1f(gl.getUniformLocation(this.program, 'u_contrast'), this.uniforms.contrast);
    gl.uniform3f(
      gl.getUniformLocation(this.program, 'u_tintRGB'),
      this.uniforms.tintRGB[0],
      this.uniforms.tintRGB[1],
      this.uniforms.tintRGB[2]
    );

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private initContext(): void {
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      this.enableFallbackMode();
      return;
    }

    this.gl = gl;
    try {
      this.program = this.createShaderProgram(gl, VERTEX_SHADER_SRC, DISPLAY_FRAGMENT_SHADER_SRC);
      if (!this.program) {
        this.enableFallbackMode();
        return;
      }

      // Setup screen quad buffers
      const quadVertices = new Float32Array([
        -1, -1, 0, 0,
         1, -1, 1, 0,
        -1,  1, 0, 1,
        -1,  1, 0, 1,
         1, -1, 1, 0,
         1,  1, 1, 1,
      ]);

      this.quadBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

      const posAttr = gl.getAttribLocation(this.program, 'a_position');
      const texAttr = gl.getAttribLocation(this.program, 'a_texCoord');

      gl.enableVertexAttribArray(posAttr);
      gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 16, 0);

      gl.enableVertexAttribArray(texAttr);
      gl.vertexAttribPointer(texAttr, 2, gl.FLOAT, false, 16, 8);

      // Setup texture
      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } catch {
      this.enableFallbackMode();
    }
  }

  private enableFallbackMode(): void {
    this.isFallbackMode = true;
    this.fallbackCtx = this.canvas.getContext('2d', { alpha: false });
  }

  private renderFallback(): void {
    if (!this.fallbackCtx) return;
    this.fallbackCtx.imageSmoothingEnabled = false;
    this.fallbackCtx.drawImage(this.sourceCanvas, 0, 0, this.canvas.width, this.canvas.height);
  }

  private createShaderProgram(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string): WebGLProgram | null {
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertShader) return null;
    gl.shaderSource(vertShader, vertSrc);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragShader) return null;
    gl.shaderSource(fragShader, fragSrc);
    gl.compileShader(fragShader);

    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return null;
    }
    return program;
  }
}