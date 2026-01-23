/**
 * 結束階段 UI - 遊戲完成或使用者停止時顯示
 * 播放結束音樂並提供重新播放或返回設定選項
 */
function GameEndScreen({ groupCount, onReplay, onBackToSetup }) {
  return (
    <div className="glass-card-elevated w-full h-full mx-auto p-8 rounded-2xl">
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 animate-float">
          <span className="text-5xl">🎉</span>
        </div>
        <p className="text-2xl font-bold text-gray-800 mb-2">太棒了！</p>
        <p className="text-sm text-gray-500 mb-6">你完成了 {groupCount} 個回合的挑戰</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onReplay}
            className="flex-1 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            }}
          >
            🔄 再玩一次
          </button>
          <button
            onClick={onBackToSetup}
            className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-300 hover:-translate-y-0.5"
          >
            ⚙️ 返回設定
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameEndScreen
