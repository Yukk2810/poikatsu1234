/**
 * offers.json を読み込むhook
 * GitHub Actions が Apps Script API から定期取得して生成する
 */

import { useState, useEffect } from 'react'
import type { CanonicalOffer } from '../types'
import { MOCK_OFFERS, LAST_UPDATED, TOTAL_SITES, TOTAL_OFFERS } from '../data/mockOffers'

interface OffersJson {
  updatedAt: string
  totalOffers: number
  totalSites: number
  offers: CanonicalOffer[]
}

interface UseOffersDataResult {
  offers: CanonicalOffer[]
  updatedAt: string
  totalSites: number
  totalOffers: number
  isLoading: boolean
  isMock: boolean
  error: string | null
}

const JSON_PATH = import.meta.env.BASE_URL + 'offers.json'

export function useOffersData(): UseOffersDataResult {
  const [offers, setOffers] = useState<CanonicalOffer[]>(MOCK_OFFERS)
  const [updatedAt, setUpdatedAt] = useState(LAST_UPDATED)
  const [totalSites, setTotalSites] = useState(TOTAL_SITES)
  const [totalOffers, setTotalOffers] = useState(TOTAL_OFFERS)
  const [isLoading, setIsLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch(JSON_PATH + '?t=' + Date.now())
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: OffersJson = await res.json()
        if (data.offers && data.offers.length > 0) {
          setOffers(data.offers)
          setUpdatedAt(data.updatedAt)
          setTotalSites(data.totalSites)
          setTotalOffers(data.totalOffers)
          setIsMock(false)
        } else {
          setIsMock(true)
        }
      } catch (e) {
        setIsMock(true)
        setError(e instanceof Error ? e.message : 'fetch failed')
      } finally {
        setIsLoading(false)
      }
    }
    fetchOffers()
  }, [])

  return { offers, updatedAt, totalSites, totalOffers, isLoading, isMock, error }
}
