import type { CanonicalOffer, FilterState, SortKey, BadgeType } from '../types'

// 還元額フォーマット
export function formatReward(value: number, type: string): string {
  if (type === 'yen') return `¥${value.toLocaleString()}`
  if (type === 'mile') return `${value.toLocaleString()}マイル`
  if (type === 'percent') return `${value}%`
  return `${value.toLocaleString()}pt`
}

// 差分フォーマット（+/-付き）
export function formatDelta(value: number, type: string): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatReward(value, type)}`
}

// 日付フォーマット
export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// バッジ判定
export function getBadges(offer: CanonicalOffer): BadgeType[] {
  const badges: BadgeType[] = []
  if (offer.isAllTimeHigh) badges.push('best')
  if (offer.isTrending) badges.push('hot')
  if (offer.deltaToday > 0) badges.push('up')
  if (offer.isNewToday) badges.push('new')
  // まもなく終了バッジ（isEndingフィールドまたは案件名から判定）
  const isEnding = (offer as CanonicalOffer & { isEnding?: boolean }).isEnding
  if (isEnding) badges.push('ending')
  return badges
}

// フィルター適用
export function applyFilter(offers: CanonicalOffer[], filter: FilterState): CanonicalOffer[] {
  return offers.filter((o) => {
    if (filter.category !== 'all' && o.category !== filter.category) return false
    if (filter.onlyRising && o.deltaToday <= 0) return false
    if (filter.onlyAllTimeHigh && !o.isAllTimeHigh) return false
    if (filter.deviceType !== 'all' && o.deviceType !== 'all' && o.deviceType !== filter.deviceType) return false
    if (filter.rewardMin !== null && o.bestRewardNormalized < filter.rewardMin) return false
    if (filter.rewardMax !== null && o.bestRewardNormalized > filter.rewardMax) return false
    if (filter.siteId !== 'all' && !o.siteOffers.some((s) => s.siteId === filter.siteId)) return false
    return true
  })
}

// ソート適用
export function applySort(offers: CanonicalOffer[], sort: SortKey): CanonicalOffer[] {
  const copy = [...offers]
  switch (sort) {
    case 'recommend':
      return copy.sort((a, b) => b.recommendScore - a.recommendScore)
    case 'reward_desc':
      return copy.sort((a, b) => b.bestRewardNormalized - a.bestRewardNormalized)
    case 'delta_desc':
      return copy.sort((a, b) => b.deltaToday - a.deltaToday)
    case 'delta_percent_desc':
      return copy.sort((a, b) => b.deltaTodayPercent - a.deltaTodayPercent)
    case 'updated_desc':
      return copy.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    default:
      return copy
  }
}

// トップ画面用：recommend_score順で上位表示
export function getSpotlightOffers(offers: CanonicalOffer[], limit = 5): CanonicalOffer[] {
  return [...offers]
    .sort((a, b) => b.recommendScore - a.recommendScore)
    .slice(0, limit)
}

// 本日上昇した案件
export function getRisingOffers(offers: CanonicalOffer[], limit = 8): CanonicalOffer[] {
  return offers
    .filter((o) => o.deltaToday !== 0)
    .sort((a, b) => b.deltaToday - a.deltaToday)
    .slice(0, limit)
}

// 高還元ランキング
export function getTopRewardOffers(offers: CanonicalOffer[], limit = 10): CanonicalOffer[] {
  return [...offers]
    .sort((a, b) => b.bestRewardNormalized - a.bestRewardNormalized)
    .slice(0, limit)
}

// カテゴリ別トップ案件
export function getTopByCategory(offers: CanonicalOffer[]): Record<string, CanonicalOffer> {
  const map: Record<string, CanonicalOffer> = {}
  for (const offer of offers) {
    const cat = offer.category
    if (!map[cat] || offer.bestRewardNormalized > map[cat].bestRewardNormalized) {
      map[cat] = offer
    }
  }
  return map
}
