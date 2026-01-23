import { useEffect, useRef } from 'react'
import ImageGrid from './ImageGrid'
import GameReadyScreen from './game/GameReadyScreen'
import GameIntroScreen from './game/GameIntroScreen'
import GameEndScreen from './game/GameEndScreen'
import useAudioPlayer from '../hooks/useAudioPlayer'
import { RHYTHM_SETTINGS, GAME_PHASES, BEAT_PHASES, GRID_MODES } from '../constants'

function GamePage({ gameState }) {
  const {
    groups,
    gamePhase,
    currentBeatIndex,
    setCurrentBeatIndex,
    currentGroupIndex,
    setCurrentGroupIndex,
    resetTrigger,
    resumeGame,
    backToSetup,
    enterPlayingPhase,
    enterEndedPhase,
    getGroupImages,
  } = gameState

  // 音樂播放 - 根據遊戲階段自動播放對應音樂
  const { stopAllAudio } = useAudioPlayer(gamePhase, currentGroupIndex, resetTrigger)

  // 節奏控制 refs
  const timerRef = useRef(null)
  const beatIndexRef = useRef(-1)
  const currentPhaseRef = useRef(BEAT_PHASES.WAITING)
  const lastResetTriggerRef = useRef(resetTrigger)

  // 監聽 resetTrigger 變化來重置本地狀態
  useEffect(() => {
    if (resetTrigger !== lastResetTriggerRef.current) {
      console.log('[GamePage] resetTrigger 變化，重置本地狀態')
      lastResetTriggerRef.current = resetTrigger

      // 清除計時器
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      // 重置所有本地狀態
      beatIndexRef.current = -1
      currentPhaseRef.current = BEAT_PHASES.WAITING
    }
  }, [resetTrigger])

  // 準備階段（前奏）計時器 - 前奏結束後進入遊戲進行階段
  useEffect(() => {
    if (gamePhase !== GAME_PHASES.READY) return

    console.log('[GamePage] 準備階段開始，等待前奏結束')

    const introTimer = setTimeout(() => {
      console.log('[GamePage] 前奏結束，進入遊戲進行階段')
      enterPlayingPhase()
    }, RHYTHM_SETTINGS.FIRST_DELAY)

    return () => clearTimeout(introTimer)
  }, [gamePhase, enterPlayingPhase])

  // 核心節拍控制器 - 遊戲進行中的節奏控制
  useEffect(() => {
    if (gamePhase !== GAME_PHASES.PLAYING) {
      // 清除所有計時器
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // 清除舊的計時器
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // 單次節拍函數
    const executeBeat = () => {
      const currentBeat = beatIndexRef.current
      console.log('[executeBeat] 當前拍:', currentBeat)

      if (currentBeat < RHYTHM_SETTINGS.TOTAL_BEATS - 1) {
        // 還有下一拍
        currentPhaseRef.current = BEAT_PHASES.BEATING
        beatIndexRef.current = currentBeat + 1
        setCurrentBeatIndex(beatIndexRef.current)

        timerRef.current = setTimeout(() => {
          executeBeat()
        }, RHYTHM_SETTINGS.BEAT_INTERVAL)
      } else {
        // 當前組完成
        console.log('[executeBeat] 當前組完成')
        finishCurrentGroup()
      }
    }

    // 等待階段
    const startWaiting = () => {
      currentPhaseRef.current = BEAT_PHASES.WAITING
      beatIndexRef.current = -1
      setCurrentBeatIndex(-1)
      console.log('[startWaiting] 開始等待', RHYTHM_SETTINGS.WAIT_TIME, 'ms')

      timerRef.current = setTimeout(() => {
        console.log('[startWaiting] 等待結束，開始跳動')
        startBeating()
      }, RHYTHM_SETTINGS.WAIT_TIME)
    }

    // 開始新一組的跳動
    const startBeating = () => {
      currentPhaseRef.current = BEAT_PHASES.BEATING
      beatIndexRef.current = 0
      setCurrentBeatIndex(0)

      timerRef.current = setTimeout(() => {
        executeBeat()
      }, RHYTHM_SETTINGS.BEAT_INTERVAL)
    }

    // 完成當前組
    const finishCurrentGroup = () => {
      console.log('[finishCurrentGroup] 當前組:', currentGroupIndex, '總組數:', groups.length)
      if (currentGroupIndex < groups.length - 1) {
        // 切換到下一組
        console.log('[finishCurrentGroup] 切換到下一組')
        setCurrentGroupIndex(prev => prev + 1)
      } else {
        // 所有組播放完畢
        console.log('[finishCurrentGroup] 所有組播放完畢')
        enterEndedPhase()
      }
    }

    // 開始等待階段
    startWaiting()

    // 清理函數
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [gamePhase, currentGroupIndex, groups.length, setCurrentBeatIndex, setCurrentGroupIndex, enterEndedPhase])

  // 處理重新播放
  const handleReplay = () => {
    resumeGame()
  }

  // 處理返回設定
  const handleBackToSetup = () => {
    stopAllAudio()
    backToSetup()
  }

  // 處理結束遊戲按鈕
  const handleStopGame = () => {
    enterEndedPhase()
  }

  const currentGroup = groups[currentGroupIndex]
  const currentGroupImages = getGroupImages(currentGroup?.id)

  // 根據遊戲階段渲染對應的 UI
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
            activeIndex={currentBeatIndex}
            mode={GRID_MODES.GAME}
          />
        )

      case GAME_PHASES.ENDED:
        return (
          <GameEndScreen
            groupCount={groups.length}
            onReplay={handleReplay}
            onBackToSetup={handleBackToSetup}
          />
        )

      default:
        return <GameReadyScreen onStart={resumeGame} />
    }
  }

  // 判斷是否顯示控制按鈕
  const showPlayButton = gamePhase === GAME_PHASES.STOPPED
  const showStopButton = gamePhase === GAME_PHASES.READY || gamePhase === GAME_PHASES.PLAYING

  return (
    <div className="max-w-135 mx-auto px-4">
      {/* 遊戲畫面 - 根據階段顯示對應內容 */}
      <div className="mb-6">
        {renderGameContent()}
      </div>

      {/* 操作按鈕 */}
      <div className="flex flex-col gap-4">
        {showStopButton && (
          <button
            onClick={handleStopGame}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 text-white"
            style={{
              background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
              boxShadow: '0 4px 20px rgba(244, 63, 94, 0.4)',
            }}
          >
            <span className="text-xl">⏹</span>
            結束遊戲
          </button>
        )}

        {showPlayButton && (
          <button
            onClick={resumeGame}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 text-white"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            }}
          >
            <span className="text-xl">▶️</span>
            開始遊戲
          </button>
        )}

        {/* Game Status Card */}
        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                gamePhase === GAME_PHASES.PLAYING
                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                  : gamePhase === GAME_PHASES.READY
                  ? 'bg-gradient-to-br from-indigo-400 to-purple-500'
                  : 'bg-gradient-to-br from-gray-300 to-gray-400'
              }`}
            >
              <span className={`text-lg ${gamePhase === GAME_PHASES.PLAYING || gamePhase === GAME_PHASES.READY ? 'animate-pulse-soft' : ''}`}>
                🎵
              </span>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">
                {gamePhase === GAME_PHASES.PLAYING
                  ? '播放中'
                  : gamePhase === GAME_PHASES.READY
                  ? '準備中'
                  : gamePhase === GAME_PHASES.ENDED
                  ? '已結束'
                  : '已暫停'}
              </div>
              <div className="text-sm font-bold text-gray-700">
                第 {currentGroupIndex + 1} / {groups.length} 組
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
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
        </div>
      </div>
    </div>
  )
}

export default GamePage
