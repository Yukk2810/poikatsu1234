import { useLocation, useNavigate } from 'react-router-dom'
import { BarChart2, List, Heart } from 'lucide-react'

const TABS = [
  { path: '/',          icon: BarChart2, label: 'トップ'    },
  { path: '/list',      icon: List,      label: '一覧'      },
  { path: '/favorites', icon: Heart,     label: 'お気に入り' },
]

export function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  const activeTab = TABS.findIndex((t) => {
    if (t.path === '/') return location.pathname === '/'
    return location.pathname.startsWith(t.path)
  })

  return (
    <nav className="tab-bar">
      {TABS.map((tab, i) => {
        const Icon = tab.icon
        const isActive = i === activeTab
        return (
          <button
            key={tab.path}
            className={`tab-item ${isActive ? 'tab-active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
            <span className="tab-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
