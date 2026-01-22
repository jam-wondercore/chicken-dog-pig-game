import { useEffect, useRef, useState } from 'react'
import ImageGrid from './ImageGrid'
import useAudioPlayer from '../hooks/useAudioPlayer'

// 節奏配置 - 參考三層式定時循環邏輯
const RHYTHM_SETTINGS = {
  FIRST_DELAY: 3100,      // 前奏延遲 (音樂開始後的前奏時間)
  BEAT_INTERVAL: 300,     // 每拍間隔 (快節奏跳動)
  WAIT_TIME: 2600,        // 每組等待時間 (ms)
  TOTAL_BEATS: 8,         // 每組跳動 n 拍
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

  // 遊戲完成狀態
  const [isGameComplete, setIsGameComplete] = useState(false)

  // 音樂播放 - 傳遞 currentGroupIndex 和遊戲完成狀態
  const { stopAllAudio } = useAudioPlayer(playState, currentGroupIndex, isGameComplete)

  // 節奏控制 refs
  const timerRef = useRef(null)
  const beatIndexRef = useRef(0) // 用 ref 追蹤當前拍數，避免閉包問題
  const currentPhaseRef = useRef('intro') // 'intro' | 'beating' | 'pausing'
  const isFirstRunRef = useRef(true)

  // 當 playState 變成非 playing 時，重置 isFirstRunRef
  useEffect(() => {
    if (playState !== 'playing') {
      isFirstRunRef.current = true
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
        showGameComplete()
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
        beatIndexRef.current = 0
        setCurrentBeatIndex(0)

        timerRef.current = setTimeout(() => {
          console.log('[startRhythm] 前奏結束,開始等待')
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
  const showGameComplete = () => {
    // 標記遊戲完成，觸發結束音樂
    setIsGameComplete(true)
    // 暫停遊戲狀態（但不停止結束音樂）
    pauseGame()

    setTimeout(() => {
      if (confirm(`🎉 播放完成！\n已播放 ${groups.length} 組圖片\n\n要重新播放嗎？`)) {
        setIsGameComplete(false)
        restartGame()
      } else {
        setIsGameComplete(false)
        stopAllAudio()
        backToSetup()
      }
    }, 800)
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
    setCurrentBeatIndex(0)
    isFirstRunRef.current = true
    currentPhaseRef.current = 'intro'

    // 重新開始播放
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
        {playState === 'playing' ? (
          <button
            onClick={pauseGame}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <span className="text-xl">⏹</span>
            結束遊戲
          </button>
        ) : (
          <button
            onClick={resumeGame}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <span className="text-xl">▶</span>
            開始遊戲
          </button>
        )}

        <div className="border-l-4 py-3 px-5 rounded-r-xl font-medium text-sm mt-2 flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-500 text-purple-800">
          <span className={`text-lg ${playState === 'playing' ? 'animate-pulse' : ''}`}>🎵</span>
          <span>
            {playState === 'playing' ? '音樂播放中' : '已暫停'} - 第 <span className="font-bold text-base">{currentGroupIndex + 1}</span>/<span className="font-bold">{groups.length}</span> 組
          </span>
        </div>
      </div>
    </div>
  )
}

export default GamePage
