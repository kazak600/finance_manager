export type Tab = 'home' | 'add' | 'templates' | 'analytics'

type Props = {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3L21 9.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" />
  </svg>
)

const AddIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </svg>
)

const TemplatesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 8h10M7 12h10M7 16h6" />
  </svg>
)

const AnalyticsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20h18" />
    <rect x="5" y="12" width="3" height="8" rx="1" fill="currentColor" stroke="none" />
    <rect x="10.5" y="7" width="3" height="13" rx="1" fill="currentColor" stroke="none" />
    <rect x="16" y="4" width="3" height="16" rx="1" fill="currentColor" stroke="none" />
  </svg>
)

const TABS = [
  { id: 'home' as Tab, icon: <HomeIcon /> },
  { id: 'add' as Tab, icon: <AddIcon /> },
  { id: 'templates' as Tab, icon: <TemplatesIcon /> },
  { id: 'analytics' as Tab, icon: <AnalyticsIcon /> },
]

export function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-100 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ id, icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex h-12 w-14 items-center justify-center rounded-2xl transition-colors ${
            activeTab === id ? 'text-revo-blue' : 'text-slate-400 hover:text-revo-text'
          }`}
        >
          {icon}
        </button>
      ))}
    </nav>
  )
}
