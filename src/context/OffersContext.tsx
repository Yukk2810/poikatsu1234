import { createContext, useContext, type ReactNode } from 'react'
import type { CanonicalOffer } from '../types'
import { useOffersData } from '../hooks/useOffersData'

interface OffersContextValue {
  offers: CanonicalOffer[]
  updatedAt: string
  totalSites: number
  totalOffers: number
  isLoading: boolean
  isMock: boolean
}

const OffersContext = createContext<OffersContextValue>({
  offers: [],
  updatedAt: '',
  totalSites: 0,
  totalOffers: 0,
  isLoading: true,
  isMock: false,
})

export function OffersProvider({ children }: { children: ReactNode }) {
  const data = useOffersData()
  return (
    <OffersContext.Provider value={data}>
      {children}
    </OffersContext.Provider>
  )
}

export function useOffers() {
  return useContext(OffersContext)
}
