import { useNavigate } from 'react-router-dom'
import type { CanonicalOffer } from '../../../types'
import { formatReward } from '../../../lib/utils'

const RANK_COLORS = ['#BA7517', '#888780', '#D85A30']

interface RankRowProps {
  offer: CanonicalOffer
  rank: number
}

function RankRow({ offer, rank }: RankRowProps) {
  const navigate = useNavigate()
  const siteCount = offer.siteOffers.length
  const extraSites = siteCount - 2

  return (
    <div className="list-row" onClick={() => navigate(`/offers/${offer.id}`)}>
      <div className="list-rank" style={{ color: RANK_COLORS[rank - 1] || '#888780' }}>
        {rank}
      </div>
      <div className="list-info">
        <div className="list-name">{offer.name}</div>
        <div className="list-sites">
          {offer.siteOffers.slice(0, 2).map((s) => (
            <span key={s.siteId} className="site-pill-xs">
              <span className="site-dot-xs" style={{ backgroundColor: s.siteColor }} />
              {s.siteName}
            </span>
          ))}
          {extraSites > 0 && (
            <span className="site-pill-xs">+{extraSites}</span>
          )}
        </div>
      </div>
      <div className="list-right">
        <div className="list-reward">
          {formatReward(offer.bestRewardValue, offer.bestRewardType)}
        </div>
        <div className="list-best-site">{offer.bestSiteName}が最高</div>
      </div>
    </div>
  )
}

interface RankingSectionProps {
  offers: CanonicalOffer[]
  onSeeAll: () => void
}

export function RankingSection({ offers, onSeeAll }: RankingSectionProps) {
  return (
    <section className="section">
      <div className="section-header">
        <span className="section-title">高還元ランキング</span>
        <button className="text-link" onClick={onSeeAll}>すべて見る</button>
      </div>
      <div className="list-group">
        {offers.map((offer, i) => (
          <RankRow key={offer.id} offer={offer} rank={i + 1} />
        ))}
      </div>
    </section>
  )
}
