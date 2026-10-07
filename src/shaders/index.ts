// src/shaders/index.ts
import type { ShaderType } from '../types/gradient'
import { flowShader   } from './flow'
import { beamShader   } from './beam'
import { meshShader   } from './mesh'
import { liquidShader } from './liquid'
import { waveShader   } from './wave'
import { silkShader   } from './silk'
import { stripeShader } from './stripe'
import { ribbonShader } from './ribbon'

export const shaders: Record<ShaderType, { vertex: string; fragment: string }> = {
  flow:   flowShader,
  beam:   beamShader,
  mesh:   meshShader,
  liquid: liquidShader,
  wave:   waveShader,
  silk:   silkShader,
  stripe: stripeShader,
  ribbon: ribbonShader,
}
