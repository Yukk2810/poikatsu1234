/**
 * フィルター状態をURLハッシュと同期する
 * キャッシュに依存しない状態管理
 */
import { useEffect } from 'react'
import type { FilterState, OfferCategory } from '../types'

export function useFilterSync(
  filter: FilterState,
  updateFilter: (p: Partial<FilterState>) => void
) {
  // URLから初期状態を復元
  useEffect(() => {
    const hash = window.location.hash
    const paramStr = hash.includes('?') ? hash.split('?')[1] : ''
    if (!paramStr) return
    const params = new URLSearchParams(paramStr)
    const cat = params.get('cat')
    if (cat && cat !== 'all') {
      updateFilter({ category: cat as OfferCategory })
    }
  }, [])

  // フィルター変更時にURLを更新
  useEffect(() => {
    const hash = window.location.hash.split('?')[0]
    if (filter.category !== 'all') {
      const newHash = `${hash}?cat=${filter.category}`
      window.history.replaceState(null, '', newHash)
    } else {
      window.history.replaceState(null, '', hash)
    }
  }, [filter.category])
}
