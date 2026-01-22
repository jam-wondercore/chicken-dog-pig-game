import { useEffect, useRef, useState } from 'react'
import ImageGrid from './ImageGrid'
import useAudioPlayer from '../hooks/useAudioPlayer'

// 節奏配置 - 參考三層式定時循環邏輯
const RHYTHM_SETTINGS = {
  FIRST_DELAY: 5500,      // 前奏延遲 5.5 秒 (音樂開始後的前奏時間)
  BEAT_INTERVAL: 300,     // 每拍間隔 0.3 秒 (快節奏跳動)
  PAUSE_BETWEEN: 2800,    // 組間停頓 2.8 秒 (長停頓)
  TOTAL_BEATS: 8,         // 每組 8 拍
}

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
  } = gameState

  // 音樂播放
  useAudioPlayer(playState)

  // 節奏控制 refs
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const currentPhaseRef = useRef('intro') // 'intro' | 'beating' | 'pausing'
  const isFirstRunRef = useRef(true)

  // 記錄剩餘時間 (用於暫停/恢復時的時間補償)
  const [remainingTime, setRemainingTime] = useState(0)

  // 核心節拍控制器 - 使用 setTimeout 實現精確控制
  useEffect(() => {
    if (playState !== 'playing') {
      // 暫停時清除計時器並計算剩餘時間
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null

        // 計算當前階段的剩餘時間 (時間補償機制)
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current
          const phase = currentPhaseRef.current
          let expectedDuration = 0

          if (phase === 'intro') {
            expectedDuration = RHYTHM_SETTINGS.FIRST_DELAY
          } else if (phase === 'beating') {
            expectedDuration = RHYTHM_SETTINGS.BEAT_INTERVAL
          } else if (phase === 'pausing') {
            expectedDuration = RHYTHM_SETTINGS.PAUSE_BETWEEN
          }

          setRemainingTime(Math.max(0, expectedDuration - elapsed))
        }
      }
      return
    }

    // 清除舊的計時器
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // 單次節拍函數
    const executeBeat = () => {
      if (currentBeatIndex < RHYTHM_SETTINGS.TOTAL_BEATS - 1) {
        // 還有下一拍
        currentPhaseRef.current = 'beating'
        startTimeRef.current = Date.now()

        setCurrentBeatIndex(prev => prev + 1)

        timerRef.current = setTimeout(() => {
          executeBeat()
        }, RHYTHM_SETTINGS.BEAT_INTERVAL)
      } else {
        // 當前組完成,進入組間停頓
        finishCurrentGroup()
      }
    }

    // 開始新一組的跳動
    const startBeating = () => {
      currentPhaseRef.current = 'beating'
      startTimeRef.current = Date.now()

      timerRef.current = setTimeout(() => {
        executeBeat()
      }, RHYTHM_SETTINGS.BEAT_INTERVAL)
    }

    // 完成當前組
    const finishCurrentGroup = () => {
      if (currentGroupIndex < groups.length - 1) {
        // 進入組間停頓階段
        currentPhaseRef.current = 'pausing'
        startTimeRef.current = Date.now()

        timerRef.current = setTimeout(() => {
          // 切換到下一組
          setCurrentGroupIndex(prev => prev + 1)
          setCurrentBeatIndex(0)
        }, RHYTHM_SETTINGS.PAUSE_BETWEEN)
      } else {
        // 所有組播放完畢
        showGameComplete()
      }
    }

    // 啟動節奏系統
    const startRhythm = () => {
      // 判斷是第一次開始還是從暫停恢復
      if (isFirstRunRef.current && currentBeatIndex === 0 && currentGroupIndex === 0) {
        // 第一次開始 - 播放前奏
        isFirstRunRef.current = false
        currentPhaseRef.current = 'intro'
        startTimeRef.current = Date.now()

        timerRef.current = setTimeout(() => {
          setCurrentBeatIndex(0)
          startBeating()
        }, RHYTHM_SETTINGS.FIRST_DELAY)
      } else if (remainingTime > 0) {
        // 從暫停恢復 - 使用剩餘時間 (時間補償)
        startTimeRef.current = Date.now()
        const delay = remainingTime

        if (currentPhaseRef.current === 'intro') {
          timerRef.current = setTimeout(() => {
            setCurrentBeatIndex(0)
            startBeating()
          }, delay)
        } else if (currentPhaseRef.current === 'pausing') {
          timerRef.current = setTimeout(() => {
            setCurrentGroupIndex(prev => prev + 1)
            setCurrentBeatIndex(0)
          }, delay)
        } else {
          timerRef.current = setTimeout(() => {
            executeBeat()
          }, delay)
        }

        setRemainingTime(0)
      } else {
        // 組切換完成後繼續
        startBeating()
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
  const showGameComplete = () => {
    setTimeout(() => {
      if (confirm(`🎉 播放完成！\n已播放 ${groups.length} 組圖片\n\n要重新播放嗎？`)) {
        restartGame()
      } else {
        backToSetup()
      }
    }, 800)
  }

  // 重新開始遊戲
  const restartGame = () => {
    setCurrentGroupIndex(0)
    setCurrentBeatIndex(0)
    setRemainingTime(0)
    isFirstRunRef.current = true
    currentPhaseRef.current = 'intro'
    resumeGame()
  }

  const currentGroup = groups[currentGroupIndex]

  return (
    <div className="max-w-[500px] mx-auto px-4">
      {/* 遊戲網格 */}
      <div className="mb-5">
        <ImageGrid
          images={currentGroup.images}
          activeIndex={currentBeatIndex}
          mode="game"
        />
      </div>

      {/* 操作按鈕 */}
      <div className="flex flex-col gap-3">
        <button
          onClick={playState === 'playing' ? pauseGame : resumeGame}
          className={`w-full py-4 rounded-xl text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${
            playState === 'playing'
              ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600'
              : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
          }`}
        >
          <span className="text-xl">{playState === 'playing' ? '⏸' : '▶'}</span>
          {playState === 'playing' ? '暫停遊戲' : '繼續遊戲'}
        </button>

        <button
          onClick={backToSetup}
          className="w-full py-3 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span>🔄</span>
          回到設定
        </button>

        <div className={`border-l-4 py-3 px-5 rounded-r-xl font-medium text-sm mt-2 flex items-center gap-2 ${
          playState === 'playing'
            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-500 text-purple-800'
            : 'bg-gradient-to-r from-gray-50 to-blue-50 border-gray-500 text-gray-800'
        }`}>
          <span className="text-lg animate-pulse">{playState === 'playing' ? '🎵' : '⏸'}</span>
          <span>
            {playState === 'playing' ? '音樂播放中' : '已暫停'} - 第 <span className="font-bold text-base">{currentGroupIndex + 1}</span>/<span className="font-bold">{groups.length}</span> 組
          </span>
        </div>
      </div>
    </div>
  )
}

export default GamePage
