// src/shaders/shared.ts — common GLSL building blocks shared by all shaders

export const VERTEX_SHADER = /* glsl */`
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

export const FRAG_UNIFORMS = /* glsl */`
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_colorPalette;
uniform float u_numColors;
uniform float u_time;
uniform float u_speed;
uniform float u_scale;
uniform float u_curl;
uniform float u_drift;
uniform float u_openness;
uniform float u_seed;
uniform float u_grain;
uniform vec2  u_resolution;
const float TAU = 6.28318530;
`

export const FRAG_HELPERS = /* glsl */`
// Circle-gradient hash — isotropic, no 45° lattice bias
vec2 ghash(vec2 p) {
  float h = fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  float a = h * 6.28318530;
  return vec2(cos(a), sin(a));
}

// Perlin gradient noise [-0.7, 0.7]
float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(dot(ghash(i),             f           ),
        dot(ghash(i + vec2(1,0)), f - vec2(1,0)), u.x),
    mix(dot(ghash(i + vec2(0,1)), f - vec2(0,1)),
        dot(ghash(i + vec2(1,1)), f - vec2(1,1)), u.x),
    u.y);
}

// 37° rotation — breaks lattice alignment between fBm octaves
const mat2 R37 = mat2(0.80, -0.60, 0.60, 0.80);

// 3-octave fBm for domain warp
float warpNoise(vec2 p) {
  float v  = gnoise(p) * 0.50;
  p = R37 * p * 2.0 + vec2(5.1, 2.3);
  v += gnoise(p) * 0.32;
  p = R37 * p * 2.0 + vec2(1.7, 6.5);
  v += gnoise(p) * 0.18;
  return v;
}

// 4-octave fBm for color fields
float colorField(vec2 p) {
  float v  = gnoise(p)                              * 0.500;
  p = R37 * p * 2.03 + vec2(3.13, 1.73);
  v += gnoise(p)                                    * 0.300;
  p = R37 * p * 2.01 + vec2(7.31, 4.17);
  v += gnoise(p)                                    * 0.130;
  p = R37 * p * 2.07 + vec2(2.17, 8.53);
  v += gnoise(p)                                    * 0.070;
  return v;
}

// Palette sampler — samples the 8×1 RGBA texture
vec3 samplePalette(float t) {
  t = clamp(t, 0.0, 1.0);
  float u = (t * (u_numColors - 1.0) + 0.5) / 8.0;
  return texture2D(u_colorPalette, vec2(u, 0.5)).rgb;
}

// Cinematic film grain — triangle distribution + luminance-adaptive mask.
// IMPORTANT: temporal offset is bounded to prevent float32 sin() breakdown.
// Unbounded floor(time*24)*173 causes overflow after ~24 s → systematic
// large-scale patterns (visible as triangles). Use a per-frame random offset
// derived from a bounded hash of the frame index instead.
float filmGrain(float lum) {
  float frame = floor(u_time * 24.0);
  vec2 temporal = vec2(
    fract(sin(frame * 0.17236) * 4831.5) * 200.0,
    fract(sin(frame * 0.21979) * 5927.3) * 200.0
  );
  float grainCell = max(1.0, floor(u_resolution.y / 900.0 + 0.5));
  vec2 ft = floor(gl_FragCoord.xy / grainCell) + temporal;
  float a = fract(sin(dot(ft,          vec2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(ft + 97.31, vec2(311.7, 127.1))) * 43758.5453);
  float g = a + b - 1.0;
  float mask = 0.55 + 1.8 * lum * (1.0 - lum);
  return g * mask;
}
`

// Helper: build a complete fragment shader string from a main() body
export function makeFragmentShader(mainBody: string): string {
  return FRAG_UNIFORMS + FRAG_HELPERS + mainBody
}
