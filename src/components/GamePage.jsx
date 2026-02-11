import { useCallback, useEffect } from 'react'
import ImageGrid from './ImageGrid'
import GameReadyScreen from './game/GameReadyScreen'
import GameIntroScreen from './game/GameIntroScreen'
import GameEndScreen from './game/GameEndScreen'
import useAudioPlayer from '../hooks/useAudioPlayer'
import useRhythmController from '../hooks/useRhythmController'
import { GAME_PHASES, GRID_MODES } from '../constants'

function GamePage({ gameState }) {
  const {
    groups,
    gamePhase,
    currentGroupIndex,
    setCurrentGroupIndex,
    resetTrigger,
    resumeGame,
    backToGroup,
    enterPlayingPhase,
    enterEndedPhase,
    getGroupImages,
  } = gameState

  const { stopAllAudio, timing } = useAudioPlayer(gamePhase, currentGroupIndex, resetTrigger, groups.length)

  const handleGroupFinished = useCallback(() => {
    setCurrentGroupIndex(prev => prev + 1)
  }, [setCurrentGroupIndex])

  const { revealIndex, beatIndex } = useRhythmController({
    gamePhase,
    currentGroupIndex,
    groupCount: groups.length,
    resetTrigger,
    timing,
    onGroupFinished: handleGroupFinished,
    onAllFinished: enterEndedPhase,
    onPlayingReady: enterPlayingPhase,
  })

  const handleBackToGroup = useCallback(() => {
    stopAllAudio()
    backToGroup()
  }, [stopAllAudio, backToGroup])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code !== 'Space') return
      e.preventDefault()

      if (gamePhase === GAME_PHASES.STOPPED || gamePhase === GAME_PHASES.ENDED) {
        resumeGame()
      } else if (gamePhase === GAME_PHASES.READY || gamePhase === GAME_PHASES.PLAYING) {
        enterEndedPhase()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gamePhase, resumeGame, enterEndedPhase])

  const currentGroupImages = getGroupImages(groups[currentGroupIndex]?.id)

  const showPlayButton = gamePhase === GAME_PHASES.STOPPED
  const showStopButton = gamePhase === GAME_PHASES.READY || gamePhase === GAME_PHASES.PLAYING

  const renderGameContent = () => {
    switch (gamePhase) {
      case GAME_PHASES.STOPPED:
        return <GameReadyScreen onStart={resumeGame} />
      case GAME_PHASES.READY:
        return <GameIntroScreen />
      case GAME_PHASES.PLAYING:
        return (
          <ImageGrid
            images={currentGroupImages}
            activeIndex={beatIndex}
            revealIndex={revealIndex}
            mode={GRID_MODES.GAME}
          />
        )
      case GAME_PHASES.ENDED:
        return (
          <GameEndScreen
            groupCount={groups.length}
            onReplay={resumeGame}
            onBackToGroup={handleBackToGroup}
          />
        )
      default:
        return <GameReadyScreen onStart={resumeGame} />
    }
  }

  return (
    <div className="max-w-256 mx-auto px-1 sm:px-4">
      {/* Game Status Card */}
      <div className="flex justify-center mb-4">
        <div className="glass-card px-3 py-2 sm:px-5 sm:py-3 rounded-2xl flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${
                gamePhase === GAME_PHASES.PLAYING
                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                  : gamePhase === GAME_PHASES.READY
                  ? 'bg-gradient-to-br from-indigo-400 to-purple-500'
                  : 'bg-gradient-to-br from-gray-300 to-gray-400'
              }`}
            >
              <span className={`text-base sm:text-lg ${gamePhase === GAME_PHASES.PLAYING || gamePhase === GAME_PHASES.READY ? 'animate-pulse-soft' : ''}`}>
                🎵
              </span>
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium">
                {gamePhase === GAME_PHASES.PLAYING
                  ? '遊戲進行中'
                  : gamePhase === GAME_PHASES.READY
                  ? '即將開始'
                  : gamePhase === GAME_PHASES.ENDED
                  ? '遊戲結束'
                  : '等待開始'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-gray-700">
                第 {currentGroupIndex + 1} 回合（共 {groups.length} 回合）
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            {Array.from({ length: groups.length }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i < currentGroupIndex
                    ? 'bg-emerald-400'
                    : i === currentGroupIndex
                    ? 'bg-indigo-500 scale-125'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {showStopButton && (
            <button
              onClick={enterEndedPhase}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 text-white"
              style={{
                background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
                boxShadow: '0 2px 10px rgba(244, 63, 94, 0.4)',
              }}
              title="結束遊戲"
            >
              <span className="text-base sm:text-lg">⏹</span>
            </button>
          )}

          {showPlayButton && (
            <button
              onClick={resumeGame}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 text-white"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)',
              }}
              title="開始遊戲"
            >
              <span className="text-base sm:text-lg">▶️</span>
            </button>
          )}
        </div>
      </div>

      <div>
        {renderGameContent()}
      </div>
    </div>
  )
}

export default GamePage
