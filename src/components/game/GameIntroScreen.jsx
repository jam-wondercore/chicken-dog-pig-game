/**
 * 準備階段 UI - 播放前奏音樂時顯示
 * 前奏結束後自動進入遊戲進行階段
 *
 * 使用與 ImageGrid 相同的 grid 結構來保持一致高度
 */
function GameIntroScreen() {
  return (
    <div className="glass-card-elevated relative w-full max-w-256 mx-auto p-4 rounded-2xl">
      {/* 隱藏的 grid 結構，用於撐出與 ImageGrid 相同的高度 */}
      <div className="grid grid-cols-4 gap-5 invisible">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square" />
        ))}
      </div>
      {/* 實際內容，絕對定位置中 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 animate-pulse">
          <span className="text-4xl">🎵</span>
        </div>
        <p className="text-lg font-bold text-gray-700 mb-2">音樂即將開始...</p>
        <p className="text-sm text-gray-400">專注聆聽，跟上節拍！</p>
      </div>
    </div>
  )
}

export default GameIntroScreen
