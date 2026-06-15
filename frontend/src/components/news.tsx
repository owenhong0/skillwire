import type { CSSProperties, ReactNode } from 'react'

// Shared empty/error state block (newspaper register).
export function NewsState({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="n-state">
      <h3>{title}</h3>
      <p>{children}</p>
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  )
}

// One shimmering skeleton bar.
export function Sk({ h, w, mt }: { h: number; w?: string; mt?: number }) {
  const style: CSSProperties = { height: h, width: w, marginTop: mt }
  return <div className="n-sk" style={style} />
}
