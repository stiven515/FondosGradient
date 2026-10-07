import { useSnapshot, type SnapshotRequest } from '../engine/snapshot'
import { Cut } from './Cut'

interface SnapshotThumbProps {
  request:   Omit<SnapshotRequest, 'width' | 'height'>
  width:     number
  height:    number
  className?: string
}

// A chamfered thumbnail that shows the engine's real output, and a plain gradient until (or unless) it renders.
export function SnapshotThumb({ request, width, height, className = '' }: SnapshotThumbProps) {
  const url = useSnapshot({ ...request, width: width * 2, height: height * 2 })
  const fallback = `linear-gradient(135deg, ${request.colors.join(', ')})`
  return (
    <Cut
      aria-hidden="true"
      className={`flex-shrink-0 ${className}`}
      style={{
        '--cut': '8px',
        width,
        height,
        background: url ? `center / cover no-repeat url(${url})` : fallback,
      } as React.CSSProperties}
    />
  )
}
