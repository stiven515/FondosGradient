const MESH_POSITIONS = ['20% 20%', '80% 15%', '75% 80%', '15% 85%', '50% 50%', '90% 50%', '10% 50%', '50% 10%']

export function toCss(colors: string[], kind: 'linear' | 'mesh'): string {
  if (colors.length === 0) return ''
  const stops = colors.length === 1 ? [colors[0], colors[0]] : colors
  const linear = `linear-gradient(135deg, ${stops.join(', ')})`
  const layers = kind === 'mesh'
    ? [...colors.map((c, i) => `radial-gradient(at ${MESH_POSITIONS[i % MESH_POSITIONS.length]}, ${c} 0px, transparent 55%)`), linear]
    : [linear]
  return `background-color: ${colors[0]};\nbackground-image: ${layers.join(',\n    ')};`
}
