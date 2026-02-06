import { useEffect, useRef, useState, useCallback } from 'react'
import ImageGrid from './ImageGrid'
import GameReadyScreen from './game/GameReadyScreen'
import GameIntroScreen from './game/GameIntroScreen'
import GameEndScreen from './game/GameEndScreen'
import useAudioPlayer from '../hooks/useAudioPlayer'
import { GAME_PHASES, BEAT_PHASES, GRID_MODES } from '../constants'

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
    backToGroup,
    enterPlayingPhase,
    enterEndedPhase,
    getGroupImages,
  } = gameState

  // 音樂播放 - 預排程音樂播放，與渲染邏輯分離
  const { stopAllAudio, timing } = useAudioPlayer(gamePhase, currentGroupIndex, resetTrigger, groups.length)

  // 揭示階段的索引（前 8 拍圖片依次出現）
  const [revealIndex, setRevealIndex] = useState(-1)

  // 節奏控制 refs
  const timerRef = useRef(null)
  const beatIndexRef = useRef(-1)
  const revealIndexRef = useRef(-1)
  const currentPhaseRef = useRef(BEAT_PHASES.REVEALING)
  const lastResetTriggerRef = useRef(resetTrigger)
  // 記錄遊戲開始時間（用於 log）
  const gameStartTimeRef = useRef(null)

  // 計算預期時間的輔助函數
  const getExpectedTime = useCallback((roundIndex, phase, beatIndex = 0) => {
    // 音樂的預期時間計算（與 useAudioPlayer 同步）
    // Round N 開始時間 = startDuration + (roundIndex * roundDuration)
    const roundStartTime = timing.startDuration + (roundIndex * timing.roundDuration)

    switch (phase) {
      case 'round_start':
        return roundStartTime
      case 'reveal':
        // Reveal N 時間 = roundStartTime + revealDelay + (beatIndex * beatInterval)
        return roundStartTime + timing.revealDelay + (beatIndex * timing.beatInterval)
      case 'beat':
        // Beat N 時間 = roundStartTime + revealDelay + (8 * beatInterval) + (beatIndex * beatInterval)
        return roundStartTime + timing.revealDelay + (timing.totalBeats * timing.beatInterval) + (beatIndex * timing.beatInterval)
      case 'round_end':
        // Round 結束 = 下一個 round 開始時間
        return roundStartTime + timing.roundDuration
      default:
        return 0
    }
  }, [timing.startDuration, timing.roundDuration, timing.revealDelay, timing.beatInterval, timing.totalBeats])

  // log 輔助函數：顯示預期時間、實際時間、誤差
  const logTiming = useCallback((label, expectedTime) => {
    const actual = performance.now() - gameStartTimeRef.current
    const diff = actual - expectedTime
    const diffSign = diff >= 0 ? '+' : ''
    console.log(`[Animation] ${label} | 預期: ${expectedTime.toFixed(0)}ms, 實際: ${actual.toFixed(0)}ms, 誤差: ${diffSign}${diff.toFixed(1)}ms`)
  }, [])

  // 計算下一個事件應該延遲多少時間（使用絕對時間校正）
  const getDelayUntil = useCallback((expectedTime) => {
    const elapsed = performance.now() - gameStartTimeRef.current
    return Math.max(0, expectedTime - elapsed)
  }, [])

  // 監聽 resetTrigger 變化來重置本地狀態
  useEffect(() => {
    if (resetTrigger !== lastResetTriggerRef.current) {
      lastResetTriggerRef.current = resetTrigger

      // 清除計時器
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      // 重置所有本地狀態
      beatIndexRef.current = -1
      revealIndexRef.current = -1
      setRevealIndex(-1)
      currentPhaseRef.current = BEAT_PHASES.REVEALING
    }
  }, [resetTrigger])

  // 準備階段（前奏）計時器 - 前奏結束後進入遊戲進行階段
  useEffect(() => {
    if (gamePhase !== GAME_PHASES.READY) return

    // 記錄遊戲開始時間
    gameStartTimeRef.current = performance.now()
    console.log(`[Animation] READY 階段開始，startDuration: ${timing.startDuration}ms, roundDuration: ${timing.roundDuration}ms`)

    const introTimer = setTimeout(() => {
      logTiming('READY -> PLAYING', timing.startDuration)
      enterPlayingPhase()
    }, timing.startDuration)

    return () => clearTimeout(introTimer)
  }, [gamePhase, enterPlayingPhase, timing.startDuration, timing.roundDuration, logTiming])

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

    // 單次節拍函數（跳動階段）
    const executeBeat = () => {
      const currentBeat = beatIndexRef.current

      if (currentBeat < timing.totalBeats - 1) {
        // 還有下一拍
        beatIndexRef.current = currentBeat + 1
        setCurrentBeatIndex(beatIndexRef.current)
        const expectedTime = getExpectedTime(currentGroupIndex, 'beat', beatIndexRef.current)
        logTiming(`Round ${currentGroupIndex + 1} - Beat ${beatIndexRef.current}`, expectedTime)

        // 使用絕對時間計算下一拍的延遲
        const nextExpectedTime = getExpectedTime(currentGroupIndex, 'beat', beatIndexRef.current + 1)
        timerRef.current = setTimeout(() => {
          executeBeat()
        }, getDelayUntil(nextExpectedTime))
      } else {
        // 當前組完成
        finishCurrentGroup()
      }
    }

    // 單次揭示函數（揭示階段）
    const executeReveal = () => {
      const currentReveal = revealIndexRef.current

      if (currentReveal < timing.totalBeats - 1) {
        // 還有下一張要揭示
        revealIndexRef.current = currentReveal + 1
        setRevealIndex(revealIndexRef.current)
        const expectedTime = getExpectedTime(currentGroupIndex, 'reveal', revealIndexRef.current)
        logTiming(`Round ${currentGroupIndex + 1} - Reveal ${revealIndexRef.current}`, expectedTime)

        // 使用絕對時間計算下一張的延遲
        const nextExpectedTime = getExpectedTime(currentGroupIndex, 'reveal', revealIndexRef.current + 1)
        timerRef.current = setTimeout(() => {
          executeReveal()
        }, getDelayUntil(nextExpectedTime))
      } else {
        // 揭示完成，進入跳動階段
        startBeating()
      }
    }

    // 揭示階段 - 圖片依次出現
    const startRevealing = () => {
      currentPhaseRef.current = BEAT_PHASES.REVEALING
      revealIndexRef.current = -1
      setRevealIndex(-1)
      beatIndexRef.current = -1
      setCurrentBeatIndex(-1)

      logTiming(`Round ${currentGroupIndex + 1} - 開始`, getExpectedTime(currentGroupIndex, 'round_start'))

      // 使用絕對時間計算第一張揭示的延遲
      const reveal0ExpectedTime = getExpectedTime(currentGroupIndex, 'reveal', 0)
      timerRef.current = setTimeout(() => {
        revealIndexRef.current = 0
        setRevealIndex(0)
        logTiming(`Round ${currentGroupIndex + 1} - Reveal 0`, reveal0ExpectedTime)

        // 使用絕對時間計算下一張的延遲
        const reveal1ExpectedTime = getExpectedTime(currentGroupIndex, 'reveal', 1)
        timerRef.current = setTimeout(() => {
          executeReveal()
        }, getDelayUntil(reveal1ExpectedTime))
      }, getDelayUntil(reveal0ExpectedTime))
    }

    // 開始跳動階段
    const startBeating = () => {
      currentPhaseRef.current = BEAT_PHASES.BEATING
      beatIndexRef.current = 0
      setCurrentBeatIndex(0)
      const beat0ExpectedTime = getExpectedTime(currentGroupIndex, 'beat', 0)
      logTiming(`Round ${currentGroupIndex + 1} - Beat 0`, beat0ExpectedTime)

      // 使用絕對時間計算下一拍的延遲
      const beat1ExpectedTime = getExpectedTime(currentGroupIndex, 'beat', 1)
      timerRef.current = setTimeout(() => {
        executeBeat()
      }, getDelayUntil(beat1ExpectedTime))
    }

    // 完成當前組
    const finishCurrentGroup = () => {
      logTiming(`Round ${currentGroupIndex + 1} - 結束`, getExpectedTime(currentGroupIndex, 'round_end'))
      if (currentGroupIndex < groups.length - 1) {
        // 切換到下一組，重置揭示狀態
        revealIndexRef.current = -1
        setRevealIndex(-1)
        setCurrentGroupIndex(prev => prev + 1)
      } else {
        // 所有組完成
        enterEndedPhase()
      }
    }

    // 開始揭示階段
    startRevealing()

    // 清理函數
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [gamePhase, currentGroupIndex, groups.length, setCurrentBeatIndex, setCurrentGroupIndex, enterEndedPhase, timing.totalBeats, timing.beatInterval, timing.revealDelay, logTiming, getExpectedTime, getDelayUntil])

  // 處理重新播放
  const handleReplay = () => {
    resumeGame()
  }

  // 處理返回群組
  const handleBackToGroup = () => {
    stopAllAudio()
    backToGroup()
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
            revealIndex={revealIndex}
            mode={GRID_MODES.GAME}
          />
        )

      case GAME_PHASES.ENDED:
        return (
          <GameEndScreen
            groupCount={groups.length}
            onReplay={handleReplay}
            onBackToGroup={handleBackToGroup}
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
    <div className="max-w-256 mx-auto px-1 sm:px-4">
      {/* Game Status Card - 置中顯示在 board 上方 */}
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

          {/* Control Buttons */}
          {showStopButton && (
            <button
              onClick={handleStopGame}
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

      {/* 遊戲畫面 - 根據階段顯示對應內容 */}
      <div>
        {renderGameContent()}
      </div>
    </div>
  )
}

export default GamePage
