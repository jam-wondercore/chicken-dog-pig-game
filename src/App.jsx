import TabBar from './components/TabBar'
import SetupPage from './components/SetupPage'
import GamePage from './components/GamePage'
import TopicsPage from './components/TopicsPage'
import useGameState from './hooks/useGameState'

function App() {
  const gameState = useGameState()

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-40 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-indigo-300/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto py-8 px-4 md:py-12 md:px-6">
        {/* 標題 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold gradient-text tracking-tight mb-3">
            節奏連拍大挑戰
          </h1>
          <p className="text-gray-500 text-sm md:text-base font-medium">
            上傳圖片，開始你的節奏遊戲
          </p>
        </div>

        {/* Tab 切換 */}
        <div className="flex justify-center mb-8">
          <TabBar
            currentTab={gameState.currentTab}
            onTabChange={gameState.setCurrentTab}
          />
        </div>

        {/* 內容區域 */}
        <div className="transition-all duration-300 ease-out">
          {gameState.currentTab === 'setup' && <SetupPage gameState={gameState} />}
          {gameState.currentTab === 'game' && <GamePage gameState={gameState} />}
          {gameState.currentTab === 'topics' && <TopicsPage gameState={gameState} />}
        </div>
      </div>
    </div>
  )
}

export default App
