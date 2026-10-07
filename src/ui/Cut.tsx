import type { CSSProperties, ElementType, ReactNode } from 'react'

interface CutProps {
  as?:           ElementType
  /** Draw a 1px outline along the chamfered edge. */
  line?:         boolean
  className?:    string
  fillClassName?: string
  style?:        CSSProperties
  fillStyle?:    CSSProperties
  children?:     ReactNode
  [attr: string]: unknown
}

// A surface with the top-right and bottom-left corners cut at 45 degrees.
export function Cut({
  as: Tag = 'div', line = false, className = '', fillClassName = '', style, fillStyle, children, ...rest
}: CutProps) {
  if (!line) {
    return <Tag className={`cut ${className}`} style={style} {...rest}>{children}</Tag>
  }
  return (
    <Tag className={`cut cut-line ${className}`} style={style} {...rest}>
      <div className={`cut-fill ${fillClassName}`} style={fillStyle}>{children}</div>
    </Tag>
  )
}
