/**
 * 準備階段 UI - 播放前奏音樂時顯示
 * 前奏結束後自動進入遊戲進行階段
 */
function GameIntroScreen() {
  return (
    <div className="glass-card-elevated w-full h-full mx-auto p-8 rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 animate-pulse">
          <span className="text-4xl">🎵</span>
        </div>
        <p className="text-lg font-bold text-gray-700 mb-2">前奏播放中...</p>
        <p className="text-sm text-gray-400">準備開始！</p>
      </div>
    </div>
  )
}

export default GameIntroScreen
