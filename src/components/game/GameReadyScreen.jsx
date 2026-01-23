/**
 * 停止階段 UI - 顯示準備開始畫面
 * 使用者點擊開始按鈕後進入準備階段
 */
function GameReadyScreen({ onStart }) {
  return (
    <div className="glass-card-elevated w-full max-w-[480px] mx-auto p-8 rounded-2xl">
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mb-6">
          <span className="text-4xl">🎮</span>
        </div>
        <p className="text-lg font-bold text-gray-700 mb-2">準備好了嗎？</p>
        <p className="text-sm text-gray-400">點擊「開始遊戲」開始挑戰</p>
      </div>
    </div>
  )
}

export default GameReadyScreen
