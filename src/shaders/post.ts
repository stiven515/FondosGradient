// src/shaders/post.ts — screen-space effects applied over the rendered gradient
import type { EffectType } from '../types/gradient'

export const POST_EFFECT_IDS: Partial<Record<EffectType, number>> = {
  glow: 1, chromatic: 2, glass: 3, dither: 4, halftone: 5,
}

export const POST_FRAGMENT = /* glsl */`
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_scene;
uniform vec2  u_resolution;
uniform float u_effect;
uniform float u_amount;

vec3 scene(vec2 uv) { return texture2D(u_scene, clamp(uv, 0.0, 1.0)).rgb; }
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Golden-angle spiral blur, radius in pixels
vec3 blur(vec2 uv, float r) {
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 24; i++) {
    float a = float(i) * 2.39996;
    float d = sqrt((float(i) + 0.5) / 24.0);
    acc += scene(uv + vec2(cos(a), sin(a)) * d * r / u_resolution);
  }
  return acc / 24.0;
}

float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

float halftoneInk(vec2 frag, float ang, float size, vec3 mask) {
  float c = cos(ang), s = sin(ang);
  vec2 p = mat2(c, -s, s, c) * frag;
  vec2 cell = (floor(p / size) + 0.5) * size;
  vec2 center = mat2(c, s, -s, c) * cell;
  float ink = 1.0 - dot(scene(center / u_resolution), mask);
  float r = sqrt(ink) * size * 0.72;
  return 1.0 - smoothstep(r - 0.8, r + 0.8, length(p - cell));
}

void main() {
  vec2 uv = v_uv;
  float k = u_amount;
  float px = u_resolution.y / 900.0;
  vec3 color = scene(uv);

  if (u_effect < 1.5) {
    vec3 b = blur(uv, (20.0 + 80.0 * k) * px);
    vec3 bright = max(b - 0.55, 0.0) * (0.5 + 1.5 * k);
    color = 1.0 - (1.0 - color) * (1.0 - bright);
  } else if (u_effect < 2.5) {
    vec2 dir = uv - 0.5;
    float s = 0.006 + 0.05 * k;
    color = vec3(scene(uv + dir * s).r, color.g, scene(uv - dir * s).b);
  } else if (u_effect < 3.5) {
    float flutes = u_resolution.x / ((14.0 + 40.0 * (1.0 - k)) * px);
    float f = fract(uv.x * flutes);
    vec2 offset = vec2((f - 0.5) * (0.02 + 0.08 * k), 0.0);
    color = blur(uv + offset, (2.0 + 10.0 * k) * px);
    color += smoothstep(0.82, 1.0, f) * 0.08 - smoothstep(0.2, 0.0, f) * 0.04;
  } else if (u_effect < 4.5) {
    float size = floor(1.0 + 3.0 * k * px + 0.5);
    vec2 cell = floor(gl_FragCoord.xy / size);
    color = scene((cell + 0.5) * size / u_resolution);
    float levels = floor(mix(8.0, 2.0, k));
    color = floor(color * levels + bayer8(cell)) / levels;
  } else {
    float size = (5.0 + 14.0 * k) * px;
    vec2 frag = gl_FragCoord.xy;
    color = vec3(
      1.0 - halftoneInk(frag, 0.261, size, vec3(1.0, 0.0, 0.0)),
      1.0 - halftoneInk(frag, 1.309, size, vec3(0.0, 1.0, 0.0)),
      1.0 - halftoneInk(frag, 0.785, size, vec3(0.0, 0.0, 1.0))
    );
  }

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`
