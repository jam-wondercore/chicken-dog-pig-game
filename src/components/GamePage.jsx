import { useEffect, useRef, useState } from 'react'
import ImageGrid from './ImageGrid'
import useAudioPlayer from '../hooks/useAudioPlayer'
import { RHYTHM_SETTINGS } from '../constants'

function GamePage({ gameState }) {
  const {
    groups,
    gameState: playState,
    currentBeatIndex,
    setCurrentBeatIndex,
    currentGroupIndex,
    setCurrentGroupIndex,
    pauseGame,
    resumeGame,
    backToSetup,
    getGroupImages,
  } = gameState

  // 遊戲完成狀態
  const [isGameComplete, setIsGameComplete] = useState(false)
  // 是否顯示圖片矩陣（前奏結束後才顯示）
  const [showGrid, setShowGrid] = useState(false)

  // 音樂播放 - 傳遞 currentGroupIndex 和遊戲完成狀態
  const { stopAllAudio } = useAudioPlayer(playState, currentGroupIndex, isGameComplete)

  // 節奏控制 refs
  const timerRef = useRef(null)
  const beatIndexRef = useRef(0) // 用 ref 追蹤當前拍數，避免閉包問題
  const currentPhaseRef = useRef('intro') // 'intro' | 'beating' | 'pausing'
  const isFirstRunRef = useRef(true)

  // 當 playState 變成非 playing 時，重置 isFirstRunRef 和隱藏矩陣
  useEffect(() => {
    if (playState !== 'playing') {
      isFirstRunRef.current = true
      setShowGrid(false)
    }
  }, [playState])

  // 核心節拍控制器 - 使用 setTimeout 實現精確控制
  useEffect(() => {
    if (playState !== 'playing') {
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

    // 單次節拍函數 - 使用 ref 來追蹤當前拍數
    const executeBeat = () => {
      const currentBeat = beatIndexRef.current
      console.log('[executeBeat] 當前拍:', currentBeat)

      if (currentBeat < RHYTHM_SETTINGS.TOTAL_BEATS - 1) {
        // 還有下一拍
        currentPhaseRef.current = 'beating'
        beatIndexRef.current = currentBeat + 1
        setCurrentBeatIndex(beatIndexRef.current)

        timerRef.current = setTimeout(() => {
          executeBeat()
        }, RHYTHM_SETTINGS.BEAT_INTERVAL)
      } else {
        // 當前組完成,進入組間停頓
        console.log('[executeBeat] 當前組完成,第', currentBeat, '拍')
        finishCurrentGroup()
      }
    }

    // 等待階段 - 等待 8 拍後開始跳動
    const startWaiting = () => {
      currentPhaseRef.current = 'waiting'
      // 等待階段不顯示紅框，設為 -1
      beatIndexRef.current = -1
      setCurrentBeatIndex(-1)
      console.log('[startWaiting] 開始等待', RHYTHM_SETTINGS.WAIT_TIME, 'ms')

      const waitTime = RHYTHM_SETTINGS.WAIT_TIME
      timerRef.current = setTimeout(() => {
        console.log('[startWaiting] 等待結束,開始跳動')
        startBeating()
      }, waitTime)
    }

    // 開始新一組的跳動
    const startBeating = () => {
      currentPhaseRef.current = 'beating'
      beatIndexRef.current = 0
      setCurrentBeatIndex(0)

      timerRef.current = setTimeout(() => {
        executeBeat()
      }, RHYTHM_SETTINGS.BEAT_INTERVAL)
    }

    // 完成當前組 - 切換到下一組
    const finishCurrentGroup = () => {
      console.log('[finishCurrentGroup] 當前組:', currentGroupIndex, '總組數:', groups.length)
      if (currentGroupIndex < groups.length - 1) {
        // 切換到下一組
        console.log('[finishCurrentGroup] 切換到下一組')
        setCurrentGroupIndex(prev => {
          console.log('[setCurrentGroupIndex] 從', prev, '切換到', prev + 1)
          return prev + 1
        })
      } else {
        // 所有組播放完畢
        console.log('[finishCurrentGroup] 所有組播放完畢')
        handleGameComplete()
      }
    }

    // 啟動節奏系統
    const startRhythm = () => {
      console.log('[startRhythm] 執行', {
        isFirst: isFirstRunRef.current,
        beatIndex: beatIndexRef.current,
        groupIndex: currentGroupIndex,
        phase: currentPhaseRef.current
      })

      // 判斷是第一次開始還是組切換
      if (isFirstRunRef.current && currentGroupIndex === 0) {
        // 第一次開始 - 播放前奏
        console.log('[startRhythm] 第一次開始,播放前奏')
        isFirstRunRef.current = false
        currentPhaseRef.current = 'intro'
        // 前奏階段不顯示紅框，設為 -1
        beatIndexRef.current = -1
        setCurrentBeatIndex(-1)

        timerRef.current = setTimeout(() => {
          console.log('[startRhythm] 前奏結束,顯示矩陣並開始等待')
          setShowGrid(true)
          startWaiting()
        }, RHYTHM_SETTINGS.FIRST_DELAY)
      } else {
        // 組切換完成後 - 先等待再跳動
        console.log('[startRhythm] 組切換後開始等待')
        startWaiting()
      }
    }

    startRhythm()

    // 清理函數
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [playState, currentGroupIndex])

  // 顯示完成訊息
  const handleGameComplete = () => {
    // 標記遊戲完成，觸發結束音樂
    setIsGameComplete(true)
    setShowGrid(false)
    // 暫停遊戲狀態（但不停止結束音樂）
    pauseGame()
  }

  // 處理重新播放
  const handleReplay = () => {
    setIsGameComplete(false)
    restartGame()
  }

  // 處理返回設定
  const handleBackToSetup = () => {
    setIsGameComplete(false)
    stopAllAudio()
    backToSetup()
  }

  // 重新開始遊戲 (從頭開始)
  const restartGame = () => {
    // 清除計時器
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // 重置所有狀態
    setCurrentGroupIndex(0)
    setCurrentBeatIndex(-1)
    isFirstRunRef.current = true
    currentPhaseRef.current = 'intro'

    // 重新開始播放
    resumeGame()
  }

  const currentGroup = groups[currentGroupIndex]
  const currentGroupImages = getGroupImages(currentGroup?.id)

  // 判斷是否處於前奏階段
  const isInIntro = playState === 'playing' && !showGrid

  return (
    <div className="max-w-[520px] mx-auto px-4">
      {/* 遊戲網格 - 根據狀態顯示不同內容 */}
      <div className="mb-6">
        {showGrid ? (
          <ImageGrid
            images={currentGroupImages}
            activeIndex={currentBeatIndex}
            mode="game"
          />
        ) : (
          <div className="glass-card-elevated w-full max-w-[480px] mx-auto p-8 rounded-2xl">
            <div className="flex flex-col items-center justify-center py-8">
              {isGameComplete ? (
                /* 遊戲完成畫面 */
                <>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 animate-float">
                    <span className="text-5xl">🎉</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mb-2">播放完成！</p>
                  <p className="text-sm text-gray-500 mb-6">已播放 {groups.length} 組圖片</p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={handleReplay}
                      className="flex-1 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      🔄 重新播放
                    </button>
                    <button
                      onClick={handleBackToSetup}
                      className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      ⚙️ 返回設定
                    </button>
                  </div>
                </>
              ) : isInIntro ? (
                /* 前奏播放中 */
                <>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 animate-pulse">
                    <span className="text-4xl">🎵</span>
                  </div>
                  <p className="text-lg font-bold text-gray-700 mb-2">前奏播放中...</p>
                  <p className="text-sm text-gray-400">準備開始！</p>
                </>
              ) : (
                /* 準備開始畫面 */
                <>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mb-6">
                    <span className="text-4xl">🎮</span>
                  </div>
                  <p className="text-lg font-bold text-gray-700 mb-2">準備好了嗎？</p>
                  <p className="text-sm text-gray-400">點擊「開始遊戲」開始挑戰</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 操作按鈕 */}
      <div className="flex flex-col gap-4">
        {playState === 'playing' ? (
          <button
            onClick={pauseGame}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 text-white"
            style={{
              background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
              boxShadow: '0 4px 20px rgba(244, 63, 94, 0.4)',
            }}
          >
            <span className="text-xl">⏹</span>
            結束遊戲
          </button>
        ) : (
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
                playState === 'playing'
                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                  : 'bg-gradient-to-br from-gray-300 to-gray-400'
              }`}
            >
              <span className={`text-lg ${playState === 'playing' ? 'animate-pulse-soft' : ''}`}>
                🎵
              </span>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">
                {playState === 'playing' ? '播放中' : '已暫停'}
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
