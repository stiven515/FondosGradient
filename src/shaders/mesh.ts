// src/shaders/mesh.ts — Mesh: colors placed on a regular 3×3 grid, blended by
// inverse-distance weighting. Comparable to Photoshop's Gradient Mesh tool.
// curl → organic deformation of the mesh  openness → zone softness  drift → node movement

import { VERTEX_SHADER, makeFragmentShader } from './shared'

const FRAGMENT_SHADER = makeFragmentShader(/* glsl */`
void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv  = vec2(v_uv.x * aspect, v_uv.y);
  float sd = u_seed * 1.337;
  float phase = fract(u_time * u_speed * 0.05) * TAU;

  // Light curl-noise warp — organic mesh deformation
  float ws = u_scale * 1.2;
  vec2  wp = uv * ws + sd * 0.17;
  float ce = 0.018;
  float n_px = warpNoise(wp + vec2(ce, 0.0));
  float n_mx = warpNoise(wp - vec2(ce, 0.0));
  float n_py = warpNoise(wp + vec2(0.0, ce));
  float n_my = warpNoise(wp - vec2(0.0, ce));
  vec2 q = vec2(n_py - n_my, n_mx - n_px) * u_curl * 0.14;
  vec2 warped = uv + q;

  vec3  colSum = vec3(0.0);
  float wSum   = 0.0;
  // Smaller temp → sharper Voronoi-like boundaries; larger → smooth wash
  float temp = 0.035 + u_openness * 0.22;

  // Up to 9 grid nodes (capped at u_numColors)
  for (int i = 0; i < 9; i++) {
    if (float(i) >= u_numColors) break;
    float fi  = float(i) / max(u_numColors - 1.0, 1.0);
    float gf  = float(i);
    float phi = float(i) * 2.39996 + sd;

    // Node grid position — 3-wide columns, rows grow downward
    float col = mod(gf, 3.0);
    float row = floor(gf / 3.0);
    float maxRow = floor(max(u_numColors - 1.0, 0.0) / 3.0);

    vec2 node = vec2(
      (col + 0.5) / 3.0 * aspect,
      (row + 0.5) / max(maxRow + 1.0, 1.0)
    );

    // Gentle animated drift
    node += vec2(
      sin(phase + phi)         * 0.04 * u_drift * aspect,
      cos(phase * 0.7 + phi)   * 0.04 * u_drift
    );

    vec2  d = warped - node;
    float w = exp(-dot(d, d) / temp);
    colSum += samplePalette(fi) * w;
    wSum   += w;
  }

  vec3 color = colSum / max(wSum, 1e-6);

  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  color = clamp(mix(vec3(lum), color, 1.15), 0.0, 1.0);

  if (u_grain > 0.001) {
    color = clamp(color + filmGrain(lum) * u_grain * 0.42, 0.0, 1.0);
  }
  gl_FragColor = vec4(color, 1.0);
}
`)

export const meshShader = { vertex: VERTEX_SHADER, fragment: FRAGMENT_SHADER }
