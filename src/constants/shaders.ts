import type { ShaderType } from '../types/gradient'

export const SHADER_TYPES: ShaderType[] = [
  'flow', 'beam', 'mesh', 'liquid', 'wave', 'silk', 'stripe',
]

export const STYLE_LABELS: Record<ShaderType, string> = {
  flow:   'Flow',
  beam:   'Beam',
  mesh:   'Mesh',
  liquid: 'Liquid',
  wave:   'Wave',
  silk:   'Silk',
  stripe: 'Stripe',
}

export const STYLE_DESCRIPTIONS: Record<ShaderType, string> = {
  flow:   'Organic colour blobs with curl-noise warp',
  beam:   'Radial rays from an animated focal point',
  mesh:   'Smooth gradient mesh with grid nodes',
  liquid: 'Deep turbulent warp — marble & tie-dye',
  wave:   'Sine-wave interference moiré patterns',
  silk:   'Smooth horizontal bands that ripple',
  stripe: 'Organic stripes with curl-noise edges',
}
