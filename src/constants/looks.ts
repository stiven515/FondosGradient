import type { Design, EffectType, ShaderParameters, ShaderType } from '../types/gradient'
import { DEFAULT_PARAMETERS } from './parameters'

export interface Look extends Design {
  name: string
}

function look(
  name: string,
  shader: ShaderType,
  colors: string[],
  effect: EffectType,
  effectAmount: number,
  parameters: Partial<ShaderParameters> = {},
): Look {
  return {
    name,
    shader,
    colors,
    effect,
    effectAmount,
    parameters: { ...DEFAULT_PARAMETERS, ...parameters, grain: effect === 'grain' ? DEFAULT_PARAMETERS.grain : 0 },
  }
}

export const LOOKS: Look[] = [
  look('Aurora',        'silk',   ['#0B1026', '#1B4965', '#3DDC97', '#A8E6CF', '#F4F1BB'], 'grain',     0.5, { scale: 1.4, curl: 1.8, openness: 0.55 }),
  look('Sunset Glass',  'mesh',   ['#FF5E5B', '#FFB997', '#FFD97D', '#EA638C', '#6C4AB6'], 'glass',     0.4, { scale: 1.2, drift: 0.4 }),
  look('Neon Halftone', 'beam',   ['#0D0221', '#541388', '#F72585', '#4CC9F0', '#FFFFFF'], 'halftone',  0.45, { scale: 1.6, speed: 0.8 }),
  look('Liquid Gold',   'liquid', ['#1A1100', '#7A4E00', '#F2B134', '#FFE29A', '#FFF6D6'], 'glow',      0.5, { curl: 2.1, scale: 1.3 }),
  look('Ocean Dither',  'wave',   ['#03045E', '#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8'], 'dither',    0.5, { scale: 1.8, speed: 0.7 }),
  look('Cotton Candy',  'flow',   ['#FFC8DD', '#FFAFCC', '#BDE0FE', '#A2D2FF', '#CDB4DB'], 'grain',     0.5),
  look('Midnight Line', 'stripe', ['#0B0C10', '#1F2833', '#45A29E', '#66FCF1', '#C5C6C7'], 'chromatic', 0.5, { scale: 2.2, curl: 0.9 }),
  look('Ember',         'flow',   ['#1B0000', '#6A040F', '#D00000', '#F48C06', '#FFBA08'], 'glow',      0.6, { curl: 1.6, drift: 0.7 }),
]
