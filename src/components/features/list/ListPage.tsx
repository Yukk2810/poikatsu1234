import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, X, SlidersHorizontal, TrendingUp, Star } from 'lucide-react'
import type { CanonicalOffer, FilterState, SortKey, OfferCategory } from '../../../types'
import { CategoryChips } from '../top/CategoryChips'
import { OfferCard } from './OfferCard'
import { SORT_LABELS } from '../../../types'

interface ListPageProps {
  offers: CanonicalOffer[]
  favorites: Set<string>
  searchQuery: string
  setSearchQuery: (q: string) => void
  filter: FilterState
  onUpdateFilter: (p: Partial<FilterState>) => void
  onResetFilter: () => void
  sort: SortKey
  setSort: (s: SortKey) => void
  onToggleFavorite: (id: string) => void
}

export function ListPage({
  offers,
  favorites,
  searchQuery,
  setSearchQuery,
  filter,
  onUpdateFilter,
  onResetFilter,
  sort,
  setSort,
  onToggleFavorite,
}: ListPageProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // 一覧に来たらすぐ検索欄にフォーカス
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const hasActiveFilter =
    filter.category !== 'all' ||
    filter.onlyRising ||
    filter.onlyAllTimeHigh ||
    searchQuery.trim() !== ''

  return (
    <div className="page">
      {/* ヘッダー */}
      <div className="app-header" style={{ gap: 0 }}>
        <div className="app-header-top">
          <button className="icon-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <span className="app-title">案件を探す</span>
          <div style={{ width: 36 }} />
        </div>
        <div className="search-bar search-bar-active">
          <Search size={14} className="search-icon" />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="案件名・サイト名で絞り込む"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="icon-btn-sm" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* カテゴリチップ */}
      <CategoryChips
        active={filter.category}
        onChange={(cat: OfferCategory | 'all') => onUpdateFilter({ category: cat })}
      />

      {/* フィルター＋ソートバー */}
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
            超高還元
          </button>
          <div className="filter-divider" />
          <div className="sort-select-wrap">
            <SlidersHorizontal size={12} />
            <select
              className="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>{SORT_LABELS[k]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-result-count">{offers.length}件</div>
      </div>

      {/* リセットバー */}
      {hasActiveFilter && (
        <div className="reset-bar">
          <span className="reset-bar-text">
            {searchQuery ? `「${searchQuery}」` : ''}
            {filter.category !== 'all' ? ` ${filter.category}` : ''}
            {filter.onlyRising ? ' 本日上昇' : ''}
            {filter.onlyAllTimeHigh ? ' 超高還元' : ''}
            で絞り込み中
          </span>
          <button className="text-link" onClick={() => { onResetFilter(); setSearchQuery('') }}>
            クリア
          </button>
        </div>
      )}

      {/* 案件リスト */}
      <div className="offer-list">
        {offers.length === 0 ? (
          <div className="empty-state">
            <Search size={36} strokeWidth={1} style={{ color: 'var(--text-3)', marginBottom: 12 }} />
            <p style={{ marginBottom: 6, fontWeight: 500 }}>
              {searchQuery ? `「${searchQuery}」に一致する案件がありません` : '条件に一致する案件がありません'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
              キーワードや絞り込み条件を変えてみてください
            </p>
            <button className="text-link" onClick={() => { onResetFilter(); setSearchQuery('') }}>
              条件をリセット
            </button>
          </div>
        ) : (
          offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              isFavorite={favorites.has(offer.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        )}
      </div>
      <div style={{ height: 24 }} />
    </div>
  )
}
