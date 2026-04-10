import type { OfferCategory } from '../../../types'

const CATEGORIES: Array<{ key: OfferCategory | 'all'; label: string }> = [
  { key: 'all', label: 'すべて' },
  { key: 'credit_card', label: 'クレカ' },
  { key: 'securities', label: '証券・投資' },
  { key: 'telecom', label: '通信' },
  { key: 'video', label: '動画' },
  { key: 'travel', label: '旅行' },
  { key: 'insurance', label: '保険' },
  { key: 'bank', label: '銀行' },
  { key: 'furusato', label: 'ふるさと納税' },
  { key: 'shopping', label: 'ショッピング' },
]

interface CategoryChipsProps {
  active: OfferCategory | 'all'
  onChange: (cat: OfferCategory | 'all') => void
}

export function CategoryChips({ active, onChange }: CategoryChipsProps) {
  return (
    <section className="section section-sm">
      <div className="chip-row">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            className={`chip ${active === key ? 'chip-active' : ''}`}
            onClick={() => onChange(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}
