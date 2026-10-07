// src/shaders/ribbon.ts — Ribbon: sweeping glass ribbons lit by an environment taken from the palette.
// A warped sweep coordinate lays half-round tubes across the frame; the height field gives normals,
// and those reflect an environment (dark below, pale above, a warm patch at the end of the palette).
// scale → ribbon density   curl → how far the ribbons are bent   drift → flow speed
// openness → softness of the highlights   seed → shifts the whole pattern

import { VERTEX_SHADER, makeFragmentShader } from './shared'

const FRAGMENT_SHADER = makeFragmentShader(/* glsl */`
// Height of the ribbon surface at p. Phase is cyclic (cos/sin) so the loop is seamless.
float ribbonHeight(vec2 p, float ph, float sd) {
  vec2 q = p * (0.75 + 0.4 * u_scale);
  vec2 spin = vec2(cos(ph), sin(ph));
  vec2 w = vec2(
    gnoise(q * 0.7 + spin * 0.55 + sd),
    gnoise(q * 0.7 + vec2(5.2, 1.3) - spin.yx * 0.55 + sd)
  );
  q += w * (0.55 + 0.75 * u_curl);
  float sweep = q.x * 0.95 + q.y * 0.5 + 0.45 * gnoise(q * 1.3 + sd + spin * 0.3);
  float x = fract(sweep * 0.5) * 2.0 - 1.0;
  return pow(max(1.0 - x * x, 0.0), 0.7);
}

// What a studio around the ribbons would reflect.
vec3 environment(vec3 r, float soft) {
  float v = clamp(r.y * 0.5 + 0.5, 0.0, 1.0);
  float side = r.x * 0.5 + 0.5;
  float t = clamp(v * 1.15 - 0.08 + 0.3 * sin(side * 6.0 + r.y * 5.0), 0.0, 1.0);
  vec3 c = samplePalette(t);
  float box = smoothstep(0.1 + soft, 0.0, abs(r.y - 0.32 + 0.2 * r.x));
  float rim = smoothstep(0.07 + soft, 0.0, abs(r.x - 0.62));
  return c + vec3(0.5) * box + vec3(0.22) * rim;
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = (v_uv - 0.5) * vec2(aspect, 1.0);
  float sd = u_seed * 1.337;
  float ph = fract(u_time * u_speed * 0.05) * TAU;
  float soft = 0.02 + 0.16 * u_openness;

  float e = 1.5 / u_resolution.y;
  float h0 = ribbonHeight(p, ph, sd);
  float hx = ribbonHeight(p + vec2(e, 0.0), ph, sd);
  float hy = ribbonHeight(p + vec2(0.0, e), ph, sd);
  vec2 g = vec2(hx - h0, hy - h0) / e;
  vec3 n = normalize(vec3(-g * 1.25, 1.0));

  vec3 r = vec3(0.0, 0.0, -1.0) + 2.0 * n.z * n;
  vec3 reflected = environment(r, soft);

  float facing = clamp(n.z, 0.0, 1.0);
  vec3 body = samplePalette(0.28 + 0.4 * (1.0 - facing));
  float fresnel = 0.18 + 0.82 * pow(1.0 - facing, 1.6);
  vec3 color = mix(body, reflected, fresnel);

  // Creases between ribbons stay dark, which is what makes them read as tubes.
  color *= mix(0.4, 1.0, smoothstep(0.0, 0.28, h0));

  float spec = pow(max(dot(n, normalize(vec3(-0.4, 0.55, 0.72))), 0.0), 30.0);
  color += vec3(0.6) * spec * (0.4 + 0.6 * (1.0 - soft));

  color = clamp(color, 0.0, 1.0);
  float lum = dot(color, vec3(0.299, 0.587, 0.114));

  if (u_grain > 0.001) {
    color = clamp(color + filmGrain(lum) * u_grain * 0.42, 0.0, 1.0);
  }
  gl_FragColor = vec4(color, 1.0);
}
`)

export const ribbonShader = { vertex: VERTEX_SHADER, fragment: FRAGMENT_SHADER }
