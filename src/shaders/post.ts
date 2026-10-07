// src/shaders/post.ts — screen-space effects applied over the rendered gradient.
// Intensity curves live in effectParams.ts and arrive through u_params; lengths there are
// expressed for a 900 px tall frame and scaled here by pxScale() so exports match the preview.
import { EFFECTS, postEffectId } from '../constants/effects'

export const POST_UNIFORMS = ['u_scene', 'u_resolution', 'u_effect', 'u_params'] as const

const FUNCTION_NAME: Record<string, string> = {
  glow: 'fxGlow',
  chromatic: 'fxChromatic',
  glass: 'fxGlass',
  dither: 'fxDither',
  halftone: 'fxHalftone',
}

// GLSL function each post effect runs, keyed by the id from the effect registry.
export const POST_FUNCTIONS: Record<number, string> = Object.fromEntries(
  EFFECTS.filter(e => e.stage === 'post').map(e => [postEffectId(e.id)!, FUNCTION_NAME[e.id]]),
)

const DISPATCH = Object.entries(POST_FUNCTIONS)
  .map(([id, fn]) => `if (abs(u_effect - ${id}.0) < 0.5) color = ${fn}(uv, color);`)
  .join('\n  else ')

export const POST_FRAGMENT = /* glsl */`
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_scene;
uniform vec2  u_resolution;
uniform float u_effect;
uniform vec4  u_params;

const float TAU = 6.28318530;
const float GOLDEN = 2.39996323;

float pxScale() { return u_resolution.y / 900.0; }
vec3 scene(vec2 uv) { return texture2D(u_scene, clamp(uv, 0.0, 1.0)).rgb; }
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Interleaved gradient noise: turns sampling patterns into fine, unobtrusive noise.
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

// 16-tap golden-angle spiral blur; radius in pixels.
vec3 blurTaps(vec2 uv, float radiusPx, float rot) {
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    float a = float(i) * GOLDEN + rot;
    float d = sqrt((float(i) + 0.5) / 16.0);
    acc += scene(uv + vec2(cos(a), sin(a)) * d * radiusPx / u_resolution);
  }
  return acc / 16.0;
}

// Same spiral, keeping only what is brighter than the threshold (soft knee).
vec3 brightTaps(vec2 uv, float radiusPx, float rot, float threshold) {
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    float a = float(i) * GOLDEN + rot;
    float d = sqrt((float(i) + 0.5) / 16.0);
    vec3 s = scene(uv + vec2(cos(a), sin(a)) * d * radiusPx / u_resolution);
    acc += s * smoothstep(threshold, threshold + 0.3, luma(s));
  }
  return acc / 16.0;
}

// Bloom: a tight and a wide halo of the bright areas, screen-blended over the image.
vec3 fxGlow(vec2 uv, vec3 color) {
  float threshold = u_params.x;
  float gain = u_params.y;
  float rot = ign(gl_FragCoord.xy) * TAU;
  vec3 tight = brightTaps(uv, u_params.z * pxScale(), rot, threshold);
  vec3 wide  = brightTaps(uv, u_params.w * pxScale(), rot + 1.7, threshold);
  vec3 bloom = (tight * 0.55 + wide * 0.9) * gain;
  bloom = mix(vec3(luma(bloom)), bloom, 1.15);
  return 1.0 - (1.0 - color) * (1.0 - clamp(bloom, 0.0, 1.0));
}

// Lens dispersion: nine spectral taps along the radius, stronger toward the corners.
vec3 fxChromatic(vec2 uv, vec3 color) {
  vec2 d = uv - 0.5;
  vec2 da = vec2(d.x * (u_resolution.x / u_resolution.y), d.y);
  float r2 = dot(da, da);
  float strength = u_params.x * (0.5 + u_params.y * r2);
  vec3 acc = vec3(0.0);
  vec3 wsum = vec3(0.0);
  for (int i = 0; i < 9; i++) {
    float t = float(i) / 8.0;
    vec3 w = vec3(max(1.0 - 2.0 * t, 0.0), 1.0 - abs(2.0 * t - 1.0), max(2.0 * t - 1.0, 0.0));
    acc += scene(uv + d * (0.5 - t) * 2.0 * strength) * w;
    wsum += w;
  }
  vec3 c = acc / wsum;
  return mix(vec3(luma(c)), c, 1.0 + u_params.z * r2 * 2.0);
}

// Reeded glass: every flute is a cylindrical lens with frosting, a sheen and dark grooves.
vec3 fxGlass(vec2 uv, vec3 color) {
  float flute = u_params.x * pxScale();
  float bend = u_params.y;
  float frost = u_params.z * pxScale();
  float sheen = u_params.w;
  float n = fract(gl_FragCoord.x / flute) * 2.0 - 1.0;
  vec2 off = vec2(-n * bend * flute, 0.0) / u_resolution;
  float rot = ign(gl_FragCoord.xy) * TAU;
  vec3 c = blurTaps(uv + off, frost * (0.4 + 0.6 * abs(n)), rot);
  c.r = mix(c.r, scene(uv + off * 1.12).r, 0.5);
  c.b = mix(c.b, scene(uv + off * 0.88).b, 0.5);
  float highlight = pow(max(0.0, 1.0 - abs(n + 0.45) * 2.2), 3.0) * sheen;
  float groove = smoothstep(0.82, 1.0, abs(n)) * sheen * 0.9;
  return c + highlight - groove;
}

float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

// Ordered dithering: quantise each channel to a few levels with an 8x8 Bayer threshold.
vec3 fxDither(vec2 uv, vec3 color) {
  float steps = u_params.x - 1.0;
  float cellSize = max(1.0, floor(u_params.y * pxScale() + 0.5));
  vec2 cell = floor(gl_FragCoord.xy / cellSize);
  vec3 c = scene((cell + 0.5) * cellSize / u_resolution);
  return floor(c * steps + bayer8(cell)) / steps;
}

vec4 toCmyk(vec3 rgb) {
  float k = 1.0 - max(max(rgb.r, rgb.g), rgb.b);
  float inv = 1.0 / max(1.0 - k, 0.001);
  return vec4((1.0 - rgb - k) * inv, k);
}

// One printing plate: a rotated dot screen whose dot area follows that ink's coverage.
float plate(vec2 frag, float angle, float cell, vec4 channel) {
  float c = cos(angle);
  float s = sin(angle);
  vec2 p = mat2(c, -s, s, c) * frag;
  vec2 g = (floor(p / cell) + 0.5) * cell;
  vec2 center = mat2(c, s, -s, c) * g;
  float amount = clamp(dot(toCmyk(scene(center / u_resolution)), channel), 0.0, 1.0);
  float radius = sqrt(amount) * cell * 0.74;
  float aa = 0.75 * max(pxScale(), 1.0);
  return 1.0 - smoothstep(radius - aa, radius + aa, length(p - g));
}

// CMYK halftone printed on warm paper, with slight plate misregistration.
vec3 fxHalftone(vec2 uv, vec3 color) {
  float cell = u_params.x * pxScale();
  float shift = u_params.y * pxScale();
  vec2 f = gl_FragCoord.xy;
  float cyan    = plate(f - vec2( shift, 0.0),   0.262, cell, vec4(1.0, 0.0, 0.0, 0.0));
  float magenta = plate(f - vec2(-shift, shift), 1.309, cell, vec4(0.0, 1.0, 0.0, 0.0));
  float yellow  = plate(f - vec2(0.0, -shift),   0.0,   cell, vec4(0.0, 0.0, 1.0, 0.0));
  float black   = plate(f,                       0.785, cell, vec4(0.0, 0.0, 0.0, 1.0));
  vec3 col = vec3(0.985, 0.972, 0.945);
  col *= mix(vec3(1.0), vec3(0.00, 0.58, 0.87), cyan);
  col *= mix(vec3(1.0), vec3(0.89, 0.10, 0.55), magenta);
  col *= mix(vec3(1.0), vec3(1.00, 0.90, 0.05), yellow);
  col *= mix(vec3(1.0), vec3(0.09, 0.09, 0.10), black);
  return col;
}

void main() {
  vec2 uv = v_uv;
  vec3 color = scene(uv);
  ${DISPATCH}
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`
