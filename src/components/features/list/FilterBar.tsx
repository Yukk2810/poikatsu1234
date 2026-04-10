import { SlidersHorizontal, TrendingUp, Star } from 'lucide-react'
import type { FilterState, SortKey } from '../../../types'
import { SORT_LABELS } from '../../../types'

interface FilterBarProps {
  filter: FilterState
  sort: SortKey
  onUpdateFilter: (partial: Partial<FilterState>) => void
  onSetSort: (sort: SortKey) => void
  resultCount: number
}

export function FilterBar({ filter, sort, onUpdateFilter, onSetSort, resultCount }: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="filter-chips">
        <button
          className={`filter-chip ${filter.onlyRising ? 'filter-chip-active' : ''}`}
          onClick={() => onUpdateFilter({ onlyRising: !filter.onlyRising })}
        >
          <TrendingUp size={12} />
          本日上昇
        </button>
        <button
          className={`filter-chip ${filter.onlyAllTimeHigh ? 'filter-chip-active' : ''}`}
          onClick={() => onUpdateFilter({ onlyAllTimeHigh: !filter.onlyAllTimeHigh })}
        >
          <Star size={12} />
          過去最高
        </button>
        <div className="filter-divider" />
        <div className="sort-select-wrap">
          <SlidersHorizontal size={12} />
          <select
            className="sort-select"
            value={sort}
            onChange={(e) => onSetSort(e.target.value as SortKey)}
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>{SORT_LABELS[k]}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="filter-result-count">{resultCount}件</div>
    </div>
  )
}
