// src/shaders/index.ts
import type { ShaderType } from '../types/gradient'
import { flowShader } from './flow'

// Phases 2+ will replace placeholders with real shaders
export const shaders: Record<ShaderType, { vertex: string; fragment: string }> = {
  flow:   flowShader,
  beam:   flowShader,
  mesh:   flowShader,
  liquid: flowShader,
  wave:   flowShader,
  silk:   flowShader,
  stripe: flowShader,
}
