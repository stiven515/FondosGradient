// src/shaders/liquid.ts — Liquid: three-level scalar domain warp producing
// marble / tie-dye / fluid-paint streaks. Much deeper warp than Flow.
// curl → warp depth (0 = gentle swirl, 3 = violent marbling)
// scale → base pattern frequency  openness → streak width

import { VERTEX_SHADER, makeFragmentShader } from './shared'

const FRAGMENT_SHADER = makeFragmentShader(/* glsl */`
void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv  = vec2(v_uv.x * aspect, v_uv.y);
  float sd = u_seed * 1.337;
  float phase = fract(u_time * u_speed * 0.05) * TAU;

  float ws = u_scale * 1.8;
  vec2  p  = uv * ws + sd * 0.2;

  // ── Level-1 warp ────────────────────────────────────────────
  vec2 a1 = vec2(sin(phase)         * 0.09, cos(phase)         * 0.09);
  float q1x = warpNoise(p                 + a1);
  float q1y = warpNoise(p + vec2(5.2,1.3) + a1);

  // ── Level-2 warp — pumped by level-1 ────────────────────────
  float warpStr = u_curl * 0.55;
  vec2  p2 = p + vec2(q1x, q1y) * warpStr;
  vec2  a2 = vec2(cos(phase * 1.4) * 0.09, sin(phase * 1.4) * 0.09);
  float q2x = warpNoise(p2 + vec2(1.7,9.2) + a2);
  float q2y = warpNoise(p2 + vec2(8.3,2.8) + a2);

  // ── Level-3 warp — final turbulence ─────────────────────────
  vec2  p3 = p2 + vec2(q2x, q2y) * warpStr;
  vec2  a3 = vec2(sin(phase * 0.8) * 0.07, cos(phase * 0.8) * 0.07);
  float q3x = warpNoise(p3 + vec2(3.9,7.6) + a3);
  float q3y = warpNoise(p3 + vec2(4.1,0.8) + a3);

  // Final warped point — use high-frequency colorField for thin streaks
  vec2  warped  = uv + vec2(q3x, q3y) * u_curl * 0.18;
  float field   = colorField(warped * u_scale * 3.5 + sd * 0.4);

  // Map field to palette position
  float t = clamp(field * 0.75 + 0.5, 0.0, 1.0);

  vec3  colSum = vec3(0.0);
  float wSum   = 0.0;
  float temp   = 0.05 + u_openness * 0.28;

  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_numColors) break;
    float fi = float(i) / max(u_numColors - 1.0, 1.0);
    float da = t - fi;
    float w  = exp(-da * da / temp);
    colSum  += samplePalette(fi) * w;
    wSum    += w;
  }

  vec3 color = colSum / max(wSum, 1e-6);

  // Slightly stronger saturation — pastels become vivid liquid dyes
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  color = clamp(mix(vec3(lum), color, 1.20), 0.0, 1.0);

  if (u_grain > 0.001) {
    color = clamp(color + filmGrain(lum) * u_grain * 0.42, 0.0, 1.0);
  }
  gl_FragColor = vec4(color, 1.0);
}
`)

export const liquidShader = { vertex: VERTEX_SHADER, fragment: FRAGMENT_SHADER }
