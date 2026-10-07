import type { ShaderParameters } from '../../types/gradient'

// The landing's own look. It lives here, not in the studio's store, so visiting the page never alters a saved design.
export const HERO_PALETTE = ['#0E2A33', '#1D5A6B', '#8DB3C2', '#E4EAEE', '#F1F4F6', '#B8643F']

export const HERO_PARAMS: Partial<ShaderParameters> = {
  scale: 1.6,
  curl: 0.85,
  drift: 0.55,
  openness: 0.1,
  seed: 3,
  speed: 0.5,
  grain: 0.1,
}

export const SECTION_IDS = ['hero', 'styles', 'effects', 'export'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export const REPO_URL = 'https://github.com/stiven515/FondosGradient'
