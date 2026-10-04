// src/shaders/beam.ts — Beam: N colored rays radiating from an animated focal point.
// curl → twists rays into spirals   openness → soft/wide vs. hard/narrow ray edges
// drift → how far the focal point wanders   scale → ray length / radial falloff distance

import { VERTEX_SHADER, makeFragmentShader } from './shared'

const FRAGMENT_SHADER = makeFragmentShader(/* glsl */`
void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv  = vec2(v_uv.x * aspect, v_uv.y);
  float sd = u_seed * 1.337;
  float phase = fract(u_time * u_speed * 0.05) * TAU;

  // Focal point orbits the canvas centre
  vec2 focal = vec2(
    0.5 * aspect + sin(phase        + sd) * 0.18 * aspect * u_drift,
    0.5          + cos(phase * 0.73 + sd) * 0.18          * u_drift
  );

  vec2  delta = uv - focal;
  float dist  = length(delta);

  // Angle + curl warp so rays have organic rather than straight edges
  float warp    = gnoise(uv * u_scale * 0.6 + phase * 0.07) * u_curl * 0.45;
  float angle   = atan(delta.y, delta.x) + warp;
  float t       = fract(angle / TAU + 0.5); // [0, 1]

  vec3  colSum = vec3(0.0);
  float wSum   = 0.0;
  float temp   = 0.10 + u_openness * 0.35;

  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_numColors) break;
    float fi  = float(i) / max(u_numColors - 1.0, 1.0);
    float phi = float(i) * 2.39996 + sd;

    // Each ray drifts its angular position slightly over time
    float beamT = fi + sin(phase * 0.5 + phi) * 0.03 * u_drift;
    float da    = fract(t - beamT + 0.5) - 0.5;

    // Radial envelope: fade near focal, fade far out
    float near  = smoothstep(0.0, 0.05, dist);
    float far   = exp(-dist / max(u_scale * 0.55, 0.1));
    float radial = near * far;

    float w = exp(-da * da / temp) * radial;
    colSum += samplePalette(fi) * w;
    wSum   += w;
  }

  vec3 color = colSum / max(wSum, 1e-6);

  // Soft glow at the focal point
  color += exp(-dist * dist * 3.5) * 0.30;
  color  = clamp(color, 0.0, 1.0);

  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  color = clamp(mix(vec3(lum), color, 1.15), 0.0, 1.0);

  if (u_grain > 0.001) {
    color = clamp(color + filmGrain(lum) * u_grain * 0.42, 0.0, 1.0);
  }
  gl_FragColor = vec4(color, 1.0);
}
`)

export const beamShader = { vertex: VERTEX_SHADER, fragment: FRAGMENT_SHADER }
