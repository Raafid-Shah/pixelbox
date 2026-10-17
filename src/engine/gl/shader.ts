// src/engine/gl/shader.ts
import { ShaderPreset } from '../bus';

export interface ShaderUniforms {
  curvature: number;
  scanlines: number;
  bloom: number;
  noise: number;
  ghosting: number;
  brightness: number;
  contrast: number;
  hue: number;
  tintRGB: [number, number, number];
}

const DEFAULT_UNIFORMS: Record<ShaderPreset, ShaderUniforms> = {
  CRT: {
    curvature: 0.35,
    scanlines: 0.85,
    bloom: 0.60,
    noise: 0.12,
    ghosting: 0.25,
    brightness: 1.0,
    contrast: 1.05,
    hue: 0.0,
    tintRGB: [1.02, 0.99, 0.95],
  },
  'CRT-lite': {
    curvature: 0.12,
    scanlines: 0.40,
    bloom: 0.25,
    noise: 0.04,
    ghosting: 0.10,
    brightness: 1.02,
    contrast: 1.02,
    hue: 0.0,
    tintRGB: [1.0, 1.0, 1.0],
  },
  LCD: {
    curvature: 0.0,
    scanlines: 0.0,
    bloom: 0.0,
    noise: 0.08,
    ghosting: 0.65,
    brightness: 1.05,
    contrast: 1.10,
    hue: 0.0,
    tintRGB: [0.88, 1.0, 0.84], // 4-tone olive tint for Prism Clear
  },
  Fast: {
    curvature: 0.0,
    scanlines: 0.0,
    bloom: 0.0,
    noise: 0.0,
    ghosting: 0.0,
    brightness: 1.0,
    contrast: 1.0,
    hue: 0.0,
    tintRGB: [1.0, 1.0, 1.0],
  },
};

export const VERTEX_SHADER_SRC = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

/**
 * Section 6: Display pass fragment shader featuring barrel distortion,
 * scanlines aligned to source rows, aperture grille mask, and sharpUV upsampling.
 */
export const DISPLAY_FRAGMENT_SHADER_SRC = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec2 u_texSize;
uniform float u_curvature;
uniform float u_scanlines;
uniform float u_bloom;
uniform float u_noise;
uniform float u_brightness;
uniform float u_contrast;
uniform vec3 u_tintRGB;

vec2 barrel(vec2 uv, float k) {
  vec2 c = uv - 0.5;
  return uv + c * dot(c, c) * k;
}

vec2 sharpUV(vec2 uv, vec2 texSize, float scale) {
  vec2 p = uv * texSize;
  vec2 f = clamp((fract(p) - 0.5) * scale + 0.5, 0.0, 1.0);
  return (floor(p) + f) / texSize;
}

void main() {
  vec2 uv = barrel(v_texCoord, u_curvature);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec2 suv = sharpUV(uv, u_texSize, 4.0);
  vec4 texColor = texture(u_texture, suv);

  // Colour grading & tint
  vec3 col = texColor.rgb * u_tintRGB;
  col = (col - 0.5) * u_contrast + 0.5;
  col *= u_brightness;

  // Scanlines
  if (u_scanlines > 0.0) {
    float s = sin(uv.y * u_texSize.y * 3.14159 * 2.0);
    col -= vec3(pow(abs(s), 1.5) * 0.15 * u_scanlines);
  }

  // Vignette & mask
  vec2 vig = v_texCoord * (1.0 - v_texCoord.yx);
  float vignette = pow(vig.x * vig.y * 16.0, 0.25);
  col *= vignette;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export function getShaderUniforms(preset: ShaderPreset): ShaderUniforms {
  return { ...DEFAULT_UNIFORMS[preset] };
}