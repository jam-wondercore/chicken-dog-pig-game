function TabBar({ currentTab, onTabChange }) {
  const tabs = [
    { id: 'data', label: '資料', icon: '💾' },
    { id: 'topics', label: '主題庫', icon: '📁' },
    { id: 'setup', label: '設定', icon: '⚙️' },
    { id: 'game', label: '遊戲', icon: '🎮' },
  ]

  return (
    <div className="glass-card p-1 sm:p-1.5 rounded-xl sm:rounded-2xl inline-flex gap-0.5 sm:gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-1 sm:gap-2 ${
            currentTab === tab.id
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
          }`}
        >
          {/* Active Background */}
          {currentTab === tab.id && (
            <div
              className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg"
              style={{
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
              }}
            />
          )}
          <span className={`relative text-lg sm:text-base ${currentTab === tab.id ? 'animate-pulse-soft' : ''}`}>
            {tab.icon}
          </span>
          <span className="relative hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export default TabBar
