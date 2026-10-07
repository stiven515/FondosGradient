// src/shaders/flow.ts — Flow: Fluid Aurora Gradient  [Option A+B]
//
// A: Value noise (hash21 → bilinear interp) — no gradient-direction artifacts.
//    Perlin gradient noise has inherent "tubes/streaks" along lattice diagonals
//    that become visible when grain amplifies micro-contrast. Value noise is
//    isotropic: no gradient vectors, no directional bias at any frequency.
//
// B: Removed warpedWave band overlay (it created a luminance ridge that grain
//    revealed as a hard line). Pure 3-field smooth fBM mixing only.
//    Grain mask reduced: 0.30+0.90*lum*(1-lum) → less midtone amplification.
//
// Pipeline: centered UV → slow drift → 2-level IQ domain warp (value noise)
// → 3× 5-octave fBM fields → smooth palette mixing → diffusion → grain

export const VERTEX_SHADER = /* glsl */`
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

export const FRAGMENT_SHADER = /* glsl */`
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

// ── Scalar hash — no gradient vectors, no directional artifacts ──────────
// Maps 2D integer grid → uniform [0,1] scalar.
float hash21(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// ── Value noise [0, 1] — isotropic by construction ───────────────────────
// Bilinear interpolation of scalar randoms with quintic C2 smoothstep.
// No gradient vectors → zero directional bias at any frequency or scale.
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// 37° rotation — decorrelates fBM octaves, prevents lattice alignment
const mat2 R37 = mat2(0.80, -0.60, 0.60, 0.80);

// ── Warp fBM — signed [-1, 1] for displacement vectors ──────────────────
// Centers value noise around 0 so warp has no net directional drift.
float warpNoise(vec2 p) {
  float v  = (vnoise(p) * 2.0 - 1.0)               * 0.500;
  p = R37 * p * 2.0 + vec2(5.1, 2.3);
  v += (vnoise(p) * 2.0 - 1.0)                      * 0.320;
  p = R37 * p * 2.0 + vec2(1.7, 6.5);
  v += (vnoise(p) * 2.0 - 1.0)                      * 0.180;
  return v;
}

// ── Color field fBM — unsigned [0, 1], 5 octaves ─────────────────────────
// Low spatial scale → large smooth color masses.
float fbm5(vec2 p) {
  float v  = vnoise(p)                              * 0.5000;
  p = R37 * p * 2.03 + vec2(3.13, 1.73);
  v += vnoise(p)                                    * 0.2500;
  p = R37 * p * 2.01 + vec2(7.31, 4.17);
  v += vnoise(p)                                    * 0.1250;
  p = R37 * p * 2.07 + vec2(2.17, 8.53);
  v += vnoise(p)                                    * 0.0625;
  p = R37 * p * 1.98 + vec2(6.83, 3.29);
  v += vnoise(p)                                    * 0.0625;
  return v;
}

// ── Palette sampler with half-texel offset ───────────────────────────────
vec3 samplePalette(float t) {
  float u = (0.5 + clamp(t, 0.0, 1.0) * (u_numColors - 1.0)) / 8.0;
  return texture2D(u_colorPalette, vec2(u, 0.5)).rgb;
}

// ── Per-pixel film grain — monochromatic, triangle distribution ───────────
// IMPORTANT: temporal offset must stay bounded to avoid float32 sin() breakdown.
// floor(time*24)*173 grows without bound → dot products exceed ~10^6 → fract(sin())
// outputs systematic large-scale patterns (visible as triangles) instead of noise.
// Fix: use a per-frame seed derived from a small-range hash of the frame index.
float filmGrain(float lum) {
  float frame = floor(u_time * 24.0);
  // Scramble frame index into bounded [0,200] offsets. Frame values stay small
  // (< frame * 0.22 < 200) so the final dot product stays under 10^6.
  vec2 temporal = vec2(
    fract(sin(frame * 0.17236) * 4831.5) * 200.0,
    fract(sin(frame * 0.21979) * 5927.3) * 200.0
  );
  float grainCell = max(1.0, floor(u_resolution.y / 900.0 + 0.5));
  vec2 ft = floor(gl_FragCoord.xy / grainCell) + temporal;
  float a = fract(sin(dot(ft,          vec2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(ft + 97.31, vec2(311.7, 127.1))) * 43758.5453);
  float g = a + b - 1.0;
  return g * 0.50;
}

void main() {
  // ── Aspect-corrected centered UV ────────────────────────────────────────
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = v_uv - 0.5;
  uv.x *= aspect;

  float sd = u_seed * 1.337;

  // ── Slow liquid motion — no jitter, no direction bias ───────────────────
  float t = u_time * u_speed * 0.035;
  vec2 motion = vec2(
    t * 0.22 + sd * 0.13,
    sin(t * 0.68 + sd * 0.31) * 0.06
  ) * (u_drift * 0.40 + 0.18);

  vec2 p = uv * (u_scale * 0.85) + motion + sd * 0.073;

  // ── 2-level Inigo Quilez domain warp (value noise, no gradient artifacts)
  //
  // Level 1: q = F(p) — large-scale organic deformation
  vec2 q;
  q.x = warpNoise(p + vec2(0.00, 0.00));
  q.y = warpNoise(p + vec2(5.20, 1.30));

  // Level 2: r = F(p + curl·q) — medium-scale refinement
  float warpAmt = u_curl * 1.05;
  vec2 r;
  r.x = warpNoise(p + warpAmt * q + vec2(1.70, 9.20));
  r.y = warpNoise(p + warpAmt * q + vec2(8.30, 2.80));

  vec2 warped = p + warpAmt * r;

  // ── 3 independent fBM color fields (Option B: no warpedWave band) ───────
  // Three scales and offsets → varied, non-correlated color structure.
  // All scales are LOW to ensure large smooth masses (not fine cells).
  float fieldA = fbm5(warped * 0.62 + sd * vec2(0.31, 0.57));
  float fieldB = fbm5(warped * 0.44 + vec2(4.30, 2.10) + sd * 0.21);
  float fieldC = fbm5(warped * 0.33 + vec2(7.10, 3.30) + sd * 0.15);

  // ── Openness → contrast of color mass separation ─────────────────────────
  // Cap contrast lower so rapid domain-warp gradients don't produce sharp lines.
  // Domain warping can compress spatial gradients 2-3x; a wide smoothstep edge
  // absorbs that compression without producing visible seams.
  float contrast = 1.0 + (1.0 - u_openness) * 0.75;
  float tA = clamp(0.5 + (fieldA - 0.5) * contrast, 0.0, 1.0);
  float tB = clamp(0.5 + (fieldB - 0.5) * contrast, 0.0, 1.0);
  float tC = clamp(0.5 + (fieldC - 0.5) * contrast, 0.0, 1.0);

  // ── Smooth continuous palette mixing (no hard edges, no band overlays) ───
  // Wide smoothstep [0.10, 0.90] → transition zone covers 80% of the range,
  // survives high-gradient warp regions that would snap a narrow edge to a line.
  vec3 colA = samplePalette(tA);
  vec3 colB = samplePalette(tB);
  vec3 colC = samplePalette(tC);

  // A→B driven by primary field
  vec3 color = mix(colA, colB, smoothstep(0.10, 0.90, tA));

  // C blend driven by independent field — adds color variety without ridges
  color = mix(color, colC, smoothstep(0.10, 0.90, fieldC) * 0.38);

  // ── Soft diffusion: haze at luminance extremes ───────────────────────────
  float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float softFocus = smoothstep(0.0, 0.30, lum) * smoothstep(1.0, 0.70, lum);
  color = mix(vec3(lum), color, 0.86 + softFocus * 0.14);

  // ── Saturation lift ───────────────────────────────────────────────────────
  lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = clamp(mix(vec3(lum), color, 1.22), 0.0, 1.0);

  // ── Cinematic color grading ───────────────────────────────────────────────
  color = pow(clamp(color, 0.0, 1.0), vec3(0.95));

  // ── Film grain — FINAL compositing layer ─────────────────────────────────
  // Per-pixel, monochromatic (vec3 delta), triangle distribution.
  // Applied strictly AFTER all gradient and grading operations.
  if (u_grain > 0.001) {
    lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float g = filmGrain(lum) * u_grain * 0.28;
    color = clamp(color + g, 0.0, 1.0);
  }

  gl_FragColor = vec4(color, 1.0);
}
`

export const flowShader = { vertex: VERTEX_SHADER, fragment: FRAGMENT_SHADER }
