import type { TKey } from '../i18n/en'

export interface PalettePreset {
  id:      string
  nameKey: TKey
  colors:  string[]
}

export const PALETTE_PRESETS: PalettePreset[] = [
  { id: 'soft-pink',   nameKey: 'preset.softPink',   colors: ['#FFB3BA', '#FFCCC9', '#FFDDD2', '#FFE8D6', '#FFF0E0'] },
  { id: 'lavender',    nameKey: 'preset.lavender',   colors: ['#C5AEF0', '#D4B8F7', '#E0C8FB', '#EDD8FF', '#F7E8FF'] },
  { id: 'sky',         nameKey: 'preset.sky',        colors: ['#A8D8EA', '#B8E2F4', '#C8ECFE', '#D8F4FF', '#E8F9FF'] },
  { id: 'mint',        nameKey: 'preset.mint',       colors: ['#B5EAD7', '#C5F0E3', '#D5F7EE', '#E0FBF3', '#F0FFF9'] },
  { id: 'cream',       nameKey: 'preset.cream',      colors: ['#FFDAC1', '#FFE6CE', '#FFEEDD', '#FFF5EA', '#FFFAF5'] },
  { id: 'sunset',      nameKey: 'preset.sunset',     colors: ['#FF9999', '#FFB380', '#FFD166', '#FF8566', '#FF6B6B'] },
  { id: 'deep-purple', nameKey: 'preset.deepPurple', colors: ['#6B21A8', '#7E22CE', '#9333EA', '#A855F7', '#C084FC'] },
  { id: 'ocean',       nameKey: 'preset.ocean',      colors: ['#0EA5E9', '#06B6D4', '#14B8A6', '#10B981', '#22D3EE'] },
  { id: 'gold',        nameKey: 'preset.gold',       colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7'] },
]
