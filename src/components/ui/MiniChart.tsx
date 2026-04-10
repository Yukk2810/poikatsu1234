import type { RewardHistoryPoint } from '../../types'

interface MiniChartProps {
  history: RewardHistoryPoint[]
}

export function MiniChart({ history }: MiniChartProps) {
  const values = history.map((h) => h.value)
  const max = Math.max(...values)
  if (max === 0) return null

  return (
    <div className="mini-chart">
      {values.map((v, i) => {
        const isToday = i === values.length - 1
        const height = max > 0 ? Math.max(4, Math.round((v / max) * 100)) : 0
        return (
          <div
            key={i}
            className={`mini-bar ${isToday ? 'today' : ''}`}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}
