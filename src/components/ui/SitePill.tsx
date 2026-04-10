interface SitePillProps {
  name: string
  color: string
  size?: 'sm' | 'xs'
}

export function SitePill({ name, color, size = 'sm' }: SitePillProps) {
  return (
    <span className={`site-pill site-pill-${size}`}>
      <span className="site-dot" style={{ backgroundColor: color }} />
      {name}
    </span>
  )
}
