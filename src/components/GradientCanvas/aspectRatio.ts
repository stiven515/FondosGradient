import type { AspectRatioType } from '../../types/gradient'

const AR_MAP: Record<AspectRatioType, string> = {
  'free': '',
  '16:9': '16 / 9',
  '4:3':  '4 / 3',
  '1:1':  '1 / 1',
  '9:16': '9 / 16',
}

export function aspectRatioCss(ar: AspectRatioType): string {
  return AR_MAP[ar]
}
