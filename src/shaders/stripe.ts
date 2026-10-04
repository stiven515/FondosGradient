// src/shaders/stripe.ts — Stripe: colour-cycling stripes whose edges are deformed
// by curl-noise domain warp. Like a topographic contour map or organic zebra print.
// scale → stripe density   curl → edge curvature   drift → stripe flow
// openness → hard-edged vs. soft/blended transitions between stripe colours

import { VERTEX_SHADER, makeFragmentShader } from './shared'

const FRAGMENT_SHADER = makeFragmentShader(/* glsl */`
void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv  = vec2(v_uv.x * aspect, v_uv.y);
  float sd = u_seed * 1.337;
  float phase = fract(u_time * u_speed * 0.05) * TAU;

  // Curl-noise warp for organic stripe edges
  float ws = u_scale * 1.4;
  vec2  wp = uv * ws + sd * 0.13;
  vec2  an = vec2(sin(phase) * 0.06, cos(phase) * 0.06);

  float ce = 0.016;
  float n_px = warpNoise(wp + vec2(ce, 0.0) + an);
  float n_mx = warpNoise(wp - vec2(ce, 0.0) + an);
  float n_py = warpNoise(wp + vec2(0.0, ce) + an);
  float n_my = warpNoise(wp - vec2(0.0, ce) + an);
  vec2 q = vec2(n_py - n_my, n_mx - n_px) * u_curl * 0.28;

  vec2 warped = uv + q;

  // Stripe coordinate: diagonal angle varies with seed for variety
  float diagTilt = sin(sd * 1.9) * 0.45;
  float coord    = warped.x / aspect + warped.y * diagTilt;

  // Stripe density controlled by scale; flow via drift
  float freq = u_scale * 4.5;
  float flow = fract(phase * u_drift * 0.04);
  float t    = fract(coord * freq + flow);

  vec3  colSum = vec3(0.0);
  float wSum   = 0.0;
  float temp   = 0.035 + u_openness * 0.18;

  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_numColors) break;
    float fi = float(i) / max(u_numColors - 1.0, 1.0);
    float da = fract(t - fi + 0.5) - 0.5;
    float w  = exp(-da * da / temp);
    colSum  += samplePalette(fi) * w;
    wSum    += w;
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

export const stripeShader = { vertex: VERTEX_SHADER, fragment: FRAGMENT_SHADER }
