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
uniform vec2 u_resolution;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  ) * 0.5 + 0.5;
}

float fbm(vec2 p, float s) {
  float f = 0.0;
  float a = 0.5;
  p += s * 0.17;
  for (int i = 0; i < 5; i++) {
    f += a * noise(p);
    p = p * 2.1 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return f;
}

vec3 samplePalette(float t) {
  t = clamp(t, 0.0, 1.0);
  float u = (t * (u_numColors - 1.0) + 0.5) / 8.0;
  return texture2D(u_colorPalette, vec2(u, 0.5)).rgb;
}

void main() {
  vec2 uv = v_uv;
  uv.x *= u_resolution.x / u_resolution.y;

  float t   = u_time * u_speed * 0.25;
  float sd  = u_seed;
  vec2 sc   = uv * u_scale;

  vec2 q = vec2(
    fbm(sc + t * 0.10, sd),
    fbm(sc + vec2(5.2, 1.3) + t * 0.10, sd + 1.0)
  );
  vec2 r = vec2(
    fbm(sc + u_curl * q + vec2(1.7, 9.2) + t * 0.15, sd + 2.0),
    fbm(sc + u_curl * q + vec2(8.3, 2.8) + t * 0.13, sd + 3.0)
  );

  float f = fbm(sc + u_drift * r, sd + 4.0);
  f = f * u_openness * 2.0 + (1.0 - u_openness);
  f = clamp(f, 0.0, 1.0);

  if (u_grain > 0.001) {
    float g = noise(uv * 512.0 + t * 97.0) * 2.0 - 1.0;
    f = clamp(f + g * u_grain, 0.0, 1.0);
  }

  gl_FragColor = vec4(samplePalette(f), 1.0);
}
`

export const flowShader = { vertex: VERTEX_SHADER, fragment: FRAGMENT_SHADER }
