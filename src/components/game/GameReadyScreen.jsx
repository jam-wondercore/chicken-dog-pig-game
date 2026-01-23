/**
 * 停止階段 UI - 顯示準備開始畫面
 * 使用者點擊開始按鈕後進入準備階段
 *
 * 使用與 ImageGrid 相同的 grid 結構來保持一致高度
 */
function GameReadyScreen() {
  return (
    <div className="glass-card-elevated relative w-full max-w-256 mx-auto p-2 sm:p-4 rounded-2xl">
      {/* 隱藏的 grid 結構，用於撐出與 ImageGrid 相同的高度 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-5 invisible">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square" />
        ))}
      </div>
      {/* 實際內容，絕對定位置中 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mb-4 sm:mb-6">
          <span className="text-3xl sm:text-4xl">🎮</span>
        </div>
        <p className="text-base sm:text-lg font-bold text-gray-700 mb-2">準備好挑戰了嗎？</p>
        <p className="text-xs sm:text-sm text-gray-400">跟著節奏一起動起來！</p>
      </div>
    </div>
  )
}

export default GameReadyScreen
