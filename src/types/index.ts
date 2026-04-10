// ポイントサイト
export interface PointSite {
  id: string
  name: string
  color: string
  url: string
}

// 還元種別
export type RewardType = 'pt' | 'yen' | 'mile' | 'percent'

// デバイス条件
export type DeviceType = 'all' | 'pc' | 'mobile'

// 案件ステータス
export type OfferStatus = 'active' | 'inactive' | 'unknown'

// カテゴリ
export type OfferCategory =
  | 'credit_card'
  | 'securities'
  | 'telecom'
  | 'video'
  | 'travel'
  | 'insurance'
  | 'shopping'
  | 'furusato'
  | 'bank'
  | 'other'

export const CATEGORY_LABELS: Record<OfferCategory, string> = {
  credit_card: 'クレジットカード',
  securities: '証券・投資',
  telecom: '通信・格安SIM',
  video: '動画・エンタメ',
  travel: '旅行・宿泊',
  insurance: '保険',
  shopping: 'ショッピング',
  furusato: 'ふるさと納税',
  bank: '銀行・口座',
  other: 'その他',
}

// サイト別観測データ
export interface SiteOffer {
  siteId: string
  siteName: string
  siteColor: string
  rewardValue: number
  rewardType: RewardType
  rewardNormalized: number // 円換算
  offerUrl: string
  status: OfferStatus
  observedAt: string
}

// 代表案件（複数サイトを統合した1案件）
export interface CanonicalOffer {
  id: string
  name: string
  advertiserName: string
  category: OfferCategory
  deviceType: DeviceType
  // 最高還元
  bestSiteId: string
  bestSiteName: string
  bestSiteColor: string
  bestRewardValue: number
  bestRewardType: RewardType
  bestRewardNormalized: number
  // サイト横断
  siteOffers: SiteOffer[]
  // 差分・履歴
  rewardHistory: RewardHistoryPoint[]
  deltaToday: number // 今日の変化額（正=上昇、負=下落）
  deltaTodayPercent: number
  isAllTimeHigh: boolean
  isNewToday: boolean
  isTrending: boolean
  // スコア
  recommendScore: number
  // メタ
  updatedAt: string
}

// 履歴の1点
export interface RewardHistoryPoint {
  date: string
  value: number
  siteId: string
}

// バッジ種別
export type BadgeType = 'best' | 'up' | 'hot' | 'new' | 'ending'

// フィルター状態
export interface FilterState {
  category: OfferCategory | 'all'
  onlyRising: boolean
  onlyAllTimeHigh: boolean
  deviceType: DeviceType | 'all'
  rewardMin: number | null
  rewardMax: number | null
  siteId: string | 'all'
}

// ソート順
export type SortKey =
  | 'recommend'
  | 'reward_desc'
  | 'delta_desc'
  | 'delta_percent_desc'
  | 'updated_desc'

export const SORT_LABELS: Record<SortKey, string> = {
  recommend: 'おすすめ順',
  reward_desc: '還元額が高い順',
  delta_desc: '上昇額が大きい順',
  delta_percent_desc: '上昇率が高い順',
  updated_desc: '更新が新しい順',
}
