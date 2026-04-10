import type { BadgeType } from '../../types'

const BADGE_CONFIG: Record<BadgeType, { label: string; className: string }> = {
  best:   { label: '過去最高',     className: 'badge-best'   },
  hot:    { label: '急騰中',       className: 'badge-hot'    },
  up:     { label: '本日上昇',     className: 'badge-up'     },
  new:    { label: '新着',         className: 'badge-new'    },
  ending: { label: 'まもなく終了', className: 'badge-ending' },
}

interface BadgeProps {
  type: BadgeType
}

export function Badge({ type }: BadgeProps) {
  const { label, className } = BADGE_CONFIG[type]
  return <span className={`badge ${className}`}>{label}</span>
}
