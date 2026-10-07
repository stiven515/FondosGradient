// Uniforms every style fragment shader must declare; useWebGL uploads these each frame.
export const STYLE_UNIFORMS = [
  'u_colorPalette', 'u_numColors', 'u_time',
  'u_speed', 'u_scale', 'u_curl', 'u_drift',
  'u_openness', 'u_seed', 'u_grain', 'u_resolution',
] as const
