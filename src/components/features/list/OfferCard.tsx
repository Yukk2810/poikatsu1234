import { useNavigate } from 'react-router-dom'
import type { CanonicalOffer } from '../../../types'
import { formatReward, formatDelta, getBadges } from '../../../lib/utils'
import { Badge } from '../../ui/Badge'
import { Heart } from 'lucide-react'

interface OfferCardProps {
  offer: CanonicalOffer
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
}

export function OfferCard({ offer, isFavorite, onToggleFavorite }: OfferCardProps) {
  const navigate = useNavigate()
  const badges = getBadges(offer)

  return (
    <div className="offer-card" onClick={() => navigate(`/offers/${offer.id}`)}>
      <div className="offer-card-header">
        <div className="offer-card-meta">
          <span className="site-dot" style={{ backgroundColor: offer.bestSiteColor }} />
          <span className="offer-card-site">{offer.bestSiteName}</span>
          <span className="offer-card-cat">
            {offer.category === 'credit_card' ? 'クレカ'
              : offer.category === 'securities' ? '証券'
              : offer.category === 'telecom' ? '通信'
              : offer.category === 'video' ? '動画'
              : offer.category === 'bank' ? '銀行'
              : offer.category === 'furusato' ? 'ふるさと'
              : offer.category}
          </span>
        </div>
        <button
          className={`fav-btn ${isFavorite ? 'fav-active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(offer.id) }}
          aria-label="お気に入り"
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="offer-card-name">{offer.name}</div>
      <div className="offer-card-advertiser">{offer.advertiserName}</div>

      <div className="offer-card-reward-row">
        <div className="offer-card-reward">
          {formatReward(offer.bestRewardValue, offer.bestRewardType)}
        </div>
        {offer.deltaToday !== 0 && (
          <div className={`delta-badge ${offer.deltaToday > 0 ? 'delta-up' : 'delta-down'}`}>
            {formatDelta(offer.deltaToday, offer.bestRewardType)} 今日
          </div>
        )}
      </div>

      <div className="offer-card-sites">
        {offer.siteOffers.slice(0, 3).map((s) => (
          <span key={s.siteId} className="site-pill-xs">
            <span className="site-dot-xs" style={{ backgroundColor: s.siteColor }} />
            {s.siteName} {formatReward(s.rewardValue, s.rewardType)}
          </span>
        ))}
        {offer.siteOffers.length > 3 && (
          <span className="site-pill-xs">+{offer.siteOffers.length - 3}サイト</span>
        )}
      </div>

      {badges.length > 0 && (
        <div className="badge-row">
          {badges.map((b) => <Badge key={b} type={b} />)}
        </div>
      )}
    </div>
  )
}
