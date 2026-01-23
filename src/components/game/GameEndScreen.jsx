/**
 * 結束階段 UI - 遊戲完成或使用者停止時顯示
 * 播放結束音樂並提供重新播放或返回設定選項
 *
 * 使用與 ImageGrid 相同的 grid 結構來保持一致高度
 */
function GameEndScreen({ groupCount, onReplay, onBackToSetup }) {
  return (
    <div className="glass-card-elevated relative w-full max-w-256 mx-auto p-2 sm:p-4 rounded-2xl">
      {/* 隱藏的 grid 結構，用於撐出與 ImageGrid 相同的高度 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-5 invisible">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square" />
        ))}
      </div>
      {/* 實際內容，絕對定位置中 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 sm:mb-6 animate-float">
          <span className="text-3xl sm:text-5xl">🎉</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">太棒了！</p>
        <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">你完成了 {groupCount} 個回合的挑戰</p>
        <div className="flex gap-2 sm:gap-3 w-full max-w-xs">
          <button
            onClick={onReplay}
            className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            }}
          >
            🔄 再玩一次
          </button>
          <button
            onClick={onBackToSetup}
            className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-300 hover:-translate-y-0.5"
          >
            ⚙️ 返回設定
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameEndScreen
