import { useState, useMemo, useCallback } from 'react'
import { MOCK_OFFERS } from '../data/mockOffers'
import { applyFilter, applySort } from '../lib/utils'
import type { FilterState, SortKey, CanonicalOffer } from '../types'

const DEFAULT_FILTER: FilterState = {
  category: 'all',
  onlyRising: false,
  onlyAllTimeHigh: false,
  deviceType: 'all',
  rewardMin: null,
  rewardMax: null,
  siteId: 'all',
}

export function useOffers(externalOffers?: CanonicalOffer[]) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [sort, setSort] = useState<SortKey>('recommend')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // 外部データが渡された場合はそちらを使い、なければモックデータ
  const allOffers = externalOffers ?? MOCK_OFFERS

  const filtered = useMemo(() => {
    let result = allOffers

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.advertiserName.toLowerCase().includes(q) ||
          o.siteOffers.some((s) => s.siteName.toLowerCase().includes(q))
      )
    }

    result = applyFilter(result, filter)
    result = applySort(result, sort)
    return result
  }, [allOffers, searchQuery, filter, sort])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const favoriteOffers = useMemo<CanonicalOffer[]>(
    () => allOffers.filter((o) => favorites.has(o.id)),
    [allOffers, favorites]
  )

  const updateFilter = useCallback((partial: Partial<FilterState>) => {
    setFilter((prev) => ({ ...prev, ...partial }))
  }, [])

  const resetFilter = useCallback(() => setFilter(DEFAULT_FILTER), [])

  return {
    allOffers,
    filtered,
    favorites,
    favoriteOffers,
    searchQuery,
    setSearchQuery,
    filter,
    updateFilter,
    resetFilter,
    sort,
    setSort,
    toggleFavorite,
  }
}
