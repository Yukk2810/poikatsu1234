import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { CanonicalOffer, OfferCategory, FilterState } from '../../../types'
import {
  getSpotlightOffers,
  getRisingOffers,
  getTopRewardOffers,
  applyFilter,
} from '../../../lib/utils'
import { SpotlightSection } from './SpotlightSection'
import { RisingSection } from './RisingSection'
import { RankingSection } from './RankingSection'
import { CategoryChips } from './CategoryChips'
import { formatDate } from '../../../lib/utils'

interface TopPageProps {
  allOffers: CanonicalOffer[]
  filter: FilterState
  onUpdateFilter: (p: Partial<FilterState>) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  updatedAt: string
  totalSites: number
  totalOffers: number
  isMock: boolean
}

export function TopPage({ allOffers, filter, onUpdateFilter, updatedAt, totalSites, totalOffers, isMock }: TopPageProps) {
  const navigate = useNavigate()

  // カテゴリフィルターを適用した上でセクションを生成
  const filteredOffers = applyFilter(allOffers, filter)

  const spotlight = getSpotlightOffers(filteredOffers)
  const rising = getRisingOffers(filteredOffers, 4)
  const ranking = getTopRewardOffers(filteredOffers, 5)

  const isFiltered = filter.category !== 'all'

  return (
    <div className="page">
      <div className="app-header">
        <div className="app-header-top">
          <span className="app-title">ポイ活レコメンくん</span>
          <span className="header-meta">更新 {formatDate(updatedAt)}</span>
        </div>
        <div className="search-bar" onClick={() => navigate('/list')}>
          <Search size={14} className="search-icon" />
          <span className="search-placeholder">案件名・サイト名で絞り込む</span>
        </div>
      </div>

      <div className="update-bar">
        <span className="update-dot" />
        <span className="update-text">
          {totalSites}サイト / {totalOffers}件取得済み{isMock ? '（モックデータ）' : ''}
        </span>
      </div>

      <CategoryChips
        active={filter.category}
        onChange={(cat: OfferCategory | 'all') => onUpdateFilter({ category: cat })}
      />

      {filteredOffers.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <p>このカテゴリの案件はありません</p>
          <button className="text-link" onClick={() => onUpdateFilter({ category: 'all' })}>
            すべて表示
          </button>
        </div>
      ) : (
        <>
          <SpotlightSection
            offers={spotlight}
            title={isFiltered ? '注目案件' : '今日の注目案件'}
          />
          <RisingSection
            offers={rising}
            onSeeAll={() => navigate('/list?sort=delta_desc&onlyRising=true')}
          />
          <RankingSection
            offers={ranking}
            onSeeAll={() => navigate('/list?sort=reward_desc')}
          />
        </>
      )}

      <div style={{ height: 24 }} />
    </div>
  )
}
