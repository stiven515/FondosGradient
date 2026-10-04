// src/shaders/wave.ts — Wave: N sine waves propagating in different directions.
// Where waves constructively interfere their colour dominates, creating
// moiré / mandala-like interference patterns.
// scale → wave frequency   curl → wave direction spread   openness → fringe softness

import { VERTEX_SHADER, makeFragmentShader } from './shared'

const FRAGMENT_SHADER = makeFragmentShader(/* glsl */`
void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv  = vec2(v_uv.x * aspect, v_uv.y);
  float sd = u_seed * 1.337;
  float phase = fract(u_time * u_speed * 0.05) * TAU;

  vec2 centre = vec2(aspect * 0.5, 0.5);

  vec3  colSum = vec3(0.0);
  float wSum   = 0.0;
  // Narrower temp → crisp interference fringes; wider → soft wash
  float temp = 0.06 + u_openness * 0.30;

  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_numColors) break;
    float fi  = float(i) / max(u_numColors - 1.0, 1.0);
    float phi = float(i) * 2.39996 + sd;

    // Wave direction — distributed around the circle, spread by curl
    float baseAngle = fi * TAU + sd * 0.7;
    float spread    = u_curl * 0.25;
    float waveAngle = baseAngle + sin(phase * 0.4 + phi) * spread;
    vec2  dir       = vec2(cos(waveAngle), sin(waveAngle));

    // Drift: the wave origin moves slowly
    vec2 origin = centre + vec2(
      sin(phase * 0.5 + phi) * 0.15 * u_drift * aspect,
      cos(phase * 0.5 + phi) * 0.15 * u_drift
    );

    float freq = u_scale * 5.0 * (0.85 + fi * 0.3);
    float wavePhase = phase * (1.0 + fi * 0.4);
    float wave = sin(dot(uv - origin, dir) * freq + wavePhase);

    // Only positive wave peaks contribute (creates distinct fringes)
    float w = exp(wave / temp);
    colSum += samplePalette(fi) * w;
    wSum   += w;
  }

  vec3 color = colSum / max(wSum, 1e-6);

  // Extra saturation — geometric patterns look best vivid
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  color = clamp(mix(vec3(lum), color, 1.20), 0.0, 1.0);

  if (u_grain > 0.001) {
    color = clamp(color + filmGrain(lum) * u_grain * 0.42, 0.0, 1.0);
  }
  gl_FragColor = vec4(color, 1.0);
}
`)

export const waveShader = { vertex: VERTEX_SHADER, fragment: FRAGMENT_SHADER }
