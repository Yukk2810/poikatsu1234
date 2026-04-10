import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { OffersProvider, useOffers } from './context/OffersContext'
import { applyFilter, applySort } from './lib/utils'
import { TabBar } from './components/layout/TabBar'
import { TopPage } from './components/features/top/TopPage'
import { ListPage } from './components/features/list/ListPage'
import { FavoritesPage } from './components/features/favorites/FavoritesPage'
import { DetailPage } from './components/features/detail/DetailPage'
import { MOCK_OFFERS, LAST_UPDATED, TOTAL_SITES, TOTAL_OFFERS } from './data/mockOffers'
import type { FilterState, SortKey, CanonicalOffer, OfferCategory } from './types'

const DEFAULT_FILTER: FilterState = {
  category: 'all',
  onlyRising: false,
  onlyAllTimeHigh: false,
  deviceType: 'all',
  rewardMin: null,
  rewardMax: null,
  siteId: 'all',
}

function AppInner() {
  const location = useLocation()
  const isDemo = location.pathname.startsWith('/demo')
  const liveData = useOffers()

  const allOffers = isDemo ? MOCK_OFFERS : liveData.offers
  const updatedAt = isDemo ? LAST_UPDATED : liveData.updatedAt
  const totalSites = isDemo ? TOTAL_SITES : liveData.totalSites
  const totalOffers = isDemo ? TOTAL_OFFERS : liveData.totalOffers
  const isMock = isDemo ? true : liveData.isMock

  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [sort, setSort] = useState<SortKey>('recommend')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // URLパラメータからカテゴリを復元（キャッシュ対策）
  useEffect(() => {
    const hash = window.location.hash
    const paramStr = hash.includes('?') ? hash.split('?')[1] : ''
    if (!paramStr) return
    const params = new URLSearchParams(paramStr)
    const cat = params.get('cat')
    if (cat) setFilter(prev => ({ ...prev, category: cat as OfferCategory }))
  }, [])

  // カテゴリ変更時にURLを更新（キャッシュ対策）
  useEffect(() => {
    const basePath = window.location.hash.split('?')[0]
    if (filter.category !== 'all') {
      window.history.replaceState(null, '', `${basePath}?cat=${filter.category}`)
    } else {
      window.history.replaceState(null, '', basePath)
    }
  }, [filter.category])

  const filtered = useMemo(() => {
    let result = allOffers
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(o =>
        o.name.toLowerCase().includes(q) ||
        o.advertiserName.toLowerCase().includes(q) ||
        o.siteOffers.some(s => s.siteName.toLowerCase().includes(q))
      )
    }
    result = applyFilter(result, filter)
    result = applySort(result, sort)
    return result
  }, [allOffers, searchQuery, filter, sort])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const favoriteOffers = useMemo<CanonicalOffer[]>(
    () => allOffers.filter(o => favorites.has(o.id)),
    [allOffers, favorites]
  )

  const updateFilter = useCallback((partial: Partial<FilterState>) => {
    setFilter(prev => ({ ...prev, ...partial }))
  }, [])

  const resetFilter = useCallback(() => setFilter(DEFAULT_FILTER), [])

  const showTab = !location.pathname.includes('/offers/')

  return (
    <div className="app-root">
      {isDemo && (
        <div style={{
          background: '#BA7517', color: '#fff', fontSize: 11,
          fontWeight: 600, textAlign: 'center', padding: '4px 0', letterSpacing: '0.5px',
        }}>
          デモモード（モックデータ）
        </div>
      )}
      <div className="app-scroll">
        <Routes>
          <Route path="/" element={
            <TopPage allOffers={allOffers} filter={filter} onUpdateFilter={updateFilter}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              updatedAt={updatedAt} totalSites={totalSites} totalOffers={totalOffers} isMock={isMock} />
          } />
          <Route path="/list" element={
            <ListPage offers={filtered} favorites={favorites} searchQuery={searchQuery}
              setSearchQuery={setSearchQuery} filter={filter} onUpdateFilter={updateFilter}
              onResetFilter={resetFilter} sort={sort} setSort={setSort} onToggleFavorite={toggleFavorite} />
          } />
          <Route path="/favorites" element={
            <FavoritesPage offers={favoriteOffers} favorites={favorites} onToggleFavorite={toggleFavorite} />
          } />
          <Route path="/offers/:id" element={
            <DetailPage allOffers={allOffers} favorites={favorites} onToggleFavorite={toggleFavorite} />
          } />
          <Route path="/demo" element={
            <TopPage allOffers={allOffers} filter={filter} onUpdateFilter={updateFilter}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              updatedAt={updatedAt} totalSites={totalSites} totalOffers={totalOffers} isMock={isMock} />
          } />
          <Route path="/demo/list" element={
            <ListPage offers={filtered} favorites={favorites} searchQuery={searchQuery}
              setSearchQuery={setSearchQuery} filter={filter} onUpdateFilter={updateFilter}
              onResetFilter={resetFilter} sort={sort} setSort={setSort} onToggleFavorite={toggleFavorite} />
          } />
          <Route path="/demo/favorites" element={
            <FavoritesPage offers={favoriteOffers} favorites={favorites} onToggleFavorite={toggleFavorite} />
          } />
          <Route path="/demo/offers/:id" element={
            <DetailPage allOffers={allOffers} favorites={favorites} onToggleFavorite={toggleFavorite} />
          } />
        </Routes>
      </div>
      {showTab && <TabBar />}
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <OffersProvider>
        <AppInner />
      </OffersProvider>
    </HashRouter>
  )
}
