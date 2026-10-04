// src/shaders/silk.ts — Silk: smooth horizontal colour bands with gentle vertical
// rippling. Like watered silk fabric or an aurora seen edge-on.
// scale → ripple frequency   curl → ripple amplitude   drift → band flow speed
// openness → band edge softness (narrow bands vs. wide gradient wash)

import { VERTEX_SHADER, makeFragmentShader } from './shared'

const FRAGMENT_SHADER = makeFragmentShader(/* glsl */`
void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv  = vec2(v_uv.x * aspect, v_uv.y);
  float sd = u_seed * 1.337;
  float phase = fract(u_time * u_speed * 0.05) * TAU;

  // Base horizontal position normalised to [0,1]
  float x = uv.x / aspect;

  // Two-octave ripple displaces the horizontal coordinate vertically
  float ripple =
    gnoise(vec2(uv.y * u_scale * 1.5 + sd,       phase * 0.3      )) * 0.60 +
    gnoise(vec2(uv.y * u_scale * 3.1 + sd + 7.3, phase * 0.5 + 2.1)) * 0.30;
  ripple *= u_curl * 0.08;

  // Slow horizontal drift of the whole band pattern
  float drift  = fract(phase * u_drift * 0.04 + sd * 0.11);
  float t      = fract(x + ripple + drift);

  // Subtle vertical shimmer — modulates position slightly for a sheen effect
  float shimmer =
    gnoise(vec2(uv.x * u_scale * 2.0, uv.y * u_scale * 4.5 - phase * 0.8)) * 0.18;
  t = clamp(t + shimmer * u_openness * 0.15, 0.0, 1.0);

  vec3  colSum = vec3(0.0);
  float wSum   = 0.0;
  float temp   = 0.05 + u_openness * 0.28;

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

export const silkShader = { vertex: VERTEX_SHADER, fragment: FRAGMENT_SHADER }
