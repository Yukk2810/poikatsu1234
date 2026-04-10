import { useNavigate } from 'react-router-dom'
import type { CanonicalOffer } from '../../../types'
import { formatReward, formatDelta } from '../../../lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface RisingRowProps {
  offer: CanonicalOffer
  rank: number
}

function RisingRow({ offer, rank }: RisingRowProps) {
  const navigate = useNavigate()
  const isUp = offer.deltaToday > 0

  return (
    <div className="list-row" onClick={() => navigate(`/offers/${offer.id}`)}>
      <div className="list-rank">{rank}</div>
      <div className="list-info">
        <div className="list-name">{offer.name}</div>
        <div className="list-sub">{offer.advertiserName}</div>
      </div>
      <div className="list-right">
        <div className="list-reward">
          {formatReward(offer.bestRewardValue, offer.bestRewardType)}
        </div>
        <div className={`delta-badge ${isUp ? 'delta-up' : 'delta-down'}`}>
          {isUp
            ? <TrendingUp size={10} />
            : <TrendingDown size={10} />
          }
          {formatDelta(offer.deltaToday, offer.bestRewardType)}
        </div>
      </div>
    </div>
  )
}

interface RisingSectionProps {
  offers: CanonicalOffer[]
  onSeeAll: () => void
}

export function RisingSection({ offers, onSeeAll }: RisingSectionProps) {
  return (
    <section className="section">
      <div className="section-header">
        <span className="section-title">本日上昇した案件</span>
        <button className="text-link" onClick={onSeeAll}>すべて見る</button>
      </div>
      <div className="list-group">
        {offers.map((offer, i) => (
          <RisingRow key={offer.id} offer={offer} rank={i + 1} />
        ))}
      </div>
    </section>
  )
}
