// src/shaders/flow.ts

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

// --- Gradient noise (Perlin-style) ---
// Returns values in [-1, 1]
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453123) * 2.0 - 1.0;
}

float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Quintic interpolation — smoother than cubic
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
  float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y); // [-1, 1]
}

// 6-octave fBm — returns values roughly in [-0.5, 0.5]
float fbm(vec2 p, float seed) {
  p += seed * vec2(0.131, 0.271);
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++) {
    v += a * gnoise(p);
    p  = p * 2.03 + vec2(5.2, 1.3);
    a *= 0.5;
  }
  return v; // sum of amplitudes ≈ 0.984, range ≈ [-0.5, 0.5]
}

vec3 samplePalette(float t) {
  t = clamp(t, 0.0, 1.0);
  float u = (t * (u_numColors - 1.0) + 0.5) / 8.0;
  return texture2D(u_colorPalette, vec2(u, 0.5)).rgb;
}

void main() {
  vec2 uv = v_uv;
  uv.x *= u_resolution.x / u_resolution.y;

  float t  = u_time * u_speed * 0.07; // gentle drift
  float sd = u_seed * 0.173;
  vec2  sc = uv * u_scale;

  // Three-level domain warping: q → r → f
  // Each level adds organic curvature to the color field
  vec2 q = vec2(
    fbm(sc + vec2(0.00, 0.00) + t * 0.11, sd),
    fbm(sc + vec2(5.20, 1.30) + t * 0.09, sd + 2.0)
  );
  vec2 r = vec2(
    fbm(sc + u_curl * q + vec2(1.70, 9.20) + t * 0.13, sd + 4.0),
    fbm(sc + u_curl * q + vec2(8.30, 2.80) + t * 0.11, sd + 6.0)
  );

  // Final field: roughly in [-0.5, 0.5] from gnoise/fBm
  float f = fbm(sc + u_drift * r, sd + 8.0);

  // Map to [0, 1] using full palette range.
  // fBm sits in ≈ [-0.35, 0.35] after domain warping —
  // scale to [-1, 1] then to [0, 1].
  f = f * 1.55 + 0.5; // [-0.35,0.35] → [0, 1]
  f = clamp(f, 0.0, 1.0);

  // Openness: 0 = full rich palette; higher = shift towards lighter colours.
  // (Matches InstantGradient: Openness 0% shows full colour range.)
  f = mix(f, 0.80, u_openness * 0.70);
  f = clamp(f, 0.0, 1.0);

  // Film grain: discrete pixel grid, drifts very slowly
  if (u_grain > 0.001) {
    float gx = dot(floor(uv * 500.0 + t * 2.0), vec2(127.1, 311.7));
    float g  = fract(sin(gx) * 43758.5453) * 2.0 - 1.0;
    f = clamp(f + g * u_grain * 0.55, 0.0, 1.0);
  }

  gl_FragColor = vec4(samplePalette(f), 1.0);
}
`

export const flowShader = { vertex: VERTEX_SHADER, fragment: FRAGMENT_SHADER }
