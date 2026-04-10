import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import type { CanonicalOffer } from '../../../types'
import { OfferCard } from '../list/OfferCard'

interface FavoritesPageProps {
  offers: CanonicalOffer[]
  favorites: Set<string>
  onToggleFavorite: (id: string) => void
}

export function FavoritesPage({ offers, favorites, onToggleFavorite }: FavoritesPageProps) {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="app-header">
        <div className="app-header-top">
          <span className="app-title">お気に入り</span>
          <span className="header-meta">{offers.length}件</span>
        </div>
      </div>

      <div className="offer-list">
        {offers.length === 0 ? (
          <div className="empty-state">
            <Heart size={40} strokeWidth={1} style={{ color: 'var(--color-text-tertiary)', marginBottom: 12 }} />
            <p style={{ marginBottom: 8 }}>お気に入りはまだありません</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: 16 }}>
              案件カードの ♥ をタップして保存できます
            </p>
            <button className="text-link" onClick={() => navigate('/')}>
              案件を探す
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
