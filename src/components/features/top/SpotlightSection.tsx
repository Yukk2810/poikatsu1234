import { useNavigate } from 'react-router-dom'
import type { CanonicalOffer } from '../../../types'
import { formatReward, formatDelta, getBadges } from '../../../lib/utils'
import { Badge } from '../../ui/Badge'
import { MiniChart } from '../../ui/MiniChart'

interface SpotlightCardProps {
  offer: CanonicalOffer
}

function SpotlightCard({ offer }: SpotlightCardProps) {
  const navigate = useNavigate()
  const badges = getBadges(offer)

  return (
    <div className="spotlight-card" onClick={() => navigate(`/offers/${offer.id}`)}>
      <div className="spot-site">
        <span className="site-dot" style={{ backgroundColor: offer.bestSiteColor }} />
        {offer.bestSiteName}
      </div>
      <div className="spot-name">{offer.name}</div>
      <div className="spot-reward">
        {formatReward(offer.bestRewardValue, offer.bestRewardType)}
      </div>
      {offer.deltaToday !== 0 && (
        <div className={`spot-delta ${offer.deltaToday > 0 ? 'up' : 'down'}`}>
          {formatDelta(offer.deltaToday, offer.bestRewardType)} 今日
        </div>
      )}
      <div className="badge-row">
        {badges.map((b) => <Badge key={b} type={b} />)}
      </div>
      <MiniChart history={offer.rewardHistory} />
    </div>
  )
}

interface SpotlightSectionProps {
  offers: CanonicalOffer[]
  title?: string
}

export function SpotlightSection({ offers, title = '今日の注目案件' }: SpotlightSectionProps) {
  return (
    <section className="section">
      <div className="section-header">
        <span className="section-title">{title}</span>
        <span className="section-meta">本日更新</span>
      </div>
      <div className="scroll-row">
        {offers.map((offer) => (
          <SpotlightCard key={offer.id} offer={offer} />
        ))}
      </div>
    </section>
  )
}
