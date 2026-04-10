import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, ExternalLink } from 'lucide-react'
import type { CanonicalOffer } from '../../../types'
import { formatReward, formatDelta, formatDate, formatDateShort, getBadges } from '../../../lib/utils'
import { Badge } from '../../ui/Badge'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

interface DetailPageProps {
  allOffers: CanonicalOffer[]
  favorites: Set<string>
  onToggleFavorite: (id: string) => void
}

export function DetailPage({ allOffers, favorites, onToggleFavorite }: DetailPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const offer = allOffers.find((o) => o.id === id)

  if (!offer) {
    return (
      <div className="page-center">
        <p>案件が見つかりません</p>
        <button className="text-link" onClick={() => navigate('/')}>トップへ戻る</button>
      </div>
    )
  }

  const isFav = favorites.has(offer.id)
  const badges = getBadges(offer)
  const chartData = offer.rewardHistory.map((h) => ({
    date: formatDateShort(h.date),
    value: h.value,
  }))
  const maxVal = Math.max(...offer.rewardHistory.map((h) => h.value))

  return (
    <div className="page">
      {/* ヘッダー */}
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <span className="detail-header-title">案件詳細</span>
        <button
          className={`icon-btn ${isFav ? 'fav-active' : ''}`}
          onClick={() => onToggleFavorite(offer.id)}
        >
          <Heart size={20} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="detail-body">
        {/* 基本情報 */}
        <div className="detail-card">
          <div className="detail-site-row">
            <span className="site-dot" style={{ backgroundColor: offer.bestSiteColor }} />
            <span className="detail-site-name">{offer.bestSiteName}が最高還元</span>
          </div>
          <h1 className="detail-name">{offer.name}</h1>
          <p className="detail-advertiser">{offer.advertiserName}</p>
          <div className="detail-reward-row">
            <span className="detail-reward">
              {formatReward(offer.bestRewardValue, offer.bestRewardType)}
            </span>
            {offer.deltaToday !== 0 && (
              <span className={`delta-badge ${offer.deltaToday > 0 ? 'delta-up' : 'delta-down'}`}>
                {formatDelta(offer.deltaToday, offer.bestRewardType)} 今日
              </span>
            )}
          </div>
          {badges.length > 0 && (
            <div className="badge-row" style={{ marginTop: 10 }}>
              {badges.map((b) => <Badge key={b} type={b} />)}
            </div>
          )}
          <p className="detail-updated">更新: {formatDate(offer.updatedAt)}</p>
        </div>

        {/* サイト別比較 */}
        <div className="detail-section-title">サイト別還元比較</div>
        <div className="detail-card">
          {offer.siteOffers
            .sort((a, b) => b.rewardNormalized - a.rewardNormalized)
            .map((s, i) => {
              const pct = maxVal > 0 ? Math.round((s.rewardNormalized / maxVal) * 100) : 0
              return (
                <div key={s.siteId} className="site-compare-row">
                  <div className="site-compare-left">
                    <span className="site-dot" style={{ backgroundColor: s.siteColor }} />
                    <span className="site-compare-name">{s.siteName}</span>
                    {i === 0 && <span className="best-label">最高</span>}
                  </div>
                  <div className="site-compare-bar-wrap">
                    <div
                      className="site-compare-bar"
                      style={{ width: `${pct}%`, backgroundColor: s.siteColor + '33' }}
                    >
                      <div
                        className="site-compare-bar-fill"
                        style={{ backgroundColor: s.siteColor }}
                      />
                    </div>
                  </div>
                  <div className="site-compare-reward">
                    {formatReward(s.rewardValue, s.rewardType)}
                  </div>
                  <a
                    href={s.offerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="site-go-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              )
            })}
        </div>

        {/* 還元推移グラフ */}
        <div className="detail-section-title">還元推移（7日間）</div>
        <div className="detail-card">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) => [formatReward(v, offer.bestRewardType), '還元']}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === chartData.length - 1 ? offer.bestSiteColor : '#E5E7EB'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 案件情報 */}
        <div className="detail-section-title">案件情報</div>
        <div className="detail-card">
          <table className="info-table">
            <tbody>
              <tr>
                <td className="info-label">カテゴリ</td>
                <td className="info-value">
                  {offer.category === 'credit_card' ? 'クレジットカード'
                    : offer.category === 'securities' ? '証券・投資'
                    : offer.category === 'telecom' ? '通信・格安SIM'
                    : offer.category === 'video' ? '動画・エンタメ'
                    : offer.category === 'bank' ? '銀行・口座'
                    : offer.category === 'furusato' ? 'ふるさと納税'
                    : offer.category}
                </td>
              </tr>
              <tr>
                <td className="info-label">対応デバイス</td>
                <td className="info-value">
                  {offer.deviceType === 'all' ? 'PC・スマホ両対応'
                    : offer.deviceType === 'pc' ? 'PCのみ'
                    : 'スマホのみ'}
                </td>
              </tr>
              <tr>
                <td className="info-label">掲載サイト数</td>
                <td className="info-value">{offer.siteOffers.length}サイト</td>
              </tr>
              <tr>
                <td className="info-label">最高還元サイト</td>
                <td className="info-value">{offer.bestSiteName}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 遷移ボタン */}
        <a
          href={offer.siteOffers.find((s) => s.siteId === offer.bestSiteId)?.offerUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="go-btn"
        >
          <span>{offer.bestSiteName}で案件を見る</span>
          <ExternalLink size={16} />
        </a>
        <p className="detail-disclaimer">
          ※ 情報は取得時点のものです。最新の還元率はポイントサイトでご確認ください。
        </p>
      </div>
    </div>
  )
}
