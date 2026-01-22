function TabBar({ currentTab, onTabChange }) {
  return (
    <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl shadow-md">
      <button
        onClick={() => onTabChange('setup')}
        className={`px-8 py-2.5 rounded-lg font-medium transition-all duration-200 text-base flex items-center gap-2 ${
          currentTab === 'setup'
            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-200'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span className="text-lg">⚙️</span>
        設定
      </button>
      <button
        onClick={() => onTabChange('game')}
        className={`px-8 py-2.5 rounded-lg font-medium transition-all duration-200 text-base flex items-center gap-2 ${
          currentTab === 'game'
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span className="text-lg">🎮</span>
        遊戲
      </button>
    </div>
  )
}

export default TabBar
