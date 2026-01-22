import TabBar from './components/TabBar'
import SetupPage from './components/SetupPage'
import GamePage from './components/GamePage'
import TopicsPage from './components/TopicsPage'
import useGameState from './hooks/useGameState'

function App() {
  const gameState = useGameState()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto py-10 px-6">
        {/* 標題 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-2">
            🎵 節奏連拍大挑戰！！
          </h1>
        </div>

        {/* Tab 切換 */}
        <div className="flex justify-center mb-8">
          <TabBar
            currentTab={gameState.currentTab}
            onTabChange={gameState.setCurrentTab}
          />
        </div>

        {/* 內容區域 */}
        {gameState.currentTab === 'setup' && <SetupPage gameState={gameState} />}
        {gameState.currentTab === 'game' && <GamePage gameState={gameState} />}
        {gameState.currentTab === 'topics' && <TopicsPage gameState={gameState} />}
      </div>
    </div>
  )
}

export default App
