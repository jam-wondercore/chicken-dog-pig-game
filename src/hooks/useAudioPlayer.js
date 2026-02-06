import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { AUDIO_FILES, GAME_PHASES, RHYTHM_SETTINGS } from '../constants'

// 重疊時間（提前啟動下一首的毫秒數）
const OVERLAP_MS = 0

/**
 * 音樂播放器 Hook - 預排程音樂播放，與渲染邏輯分離
 * 使用實際音樂時長來排程，並透過重疊播放實現無縫銜接
 *
 * @param {string} gamePhase - 當前遊戲階段 (GAME_PHASES)
 * @param {number} currentGroupIndex - 當前播放的組別索引（僅用於狀態追蹤）
 * @param {number} resetTrigger - 重置觸發器
 * @param {number} totalGroups - 總回合數
 */
function useAudioPlayer(gamePhase, currentGroupIndex = 0, resetTrigger = 0, totalGroups = 1) {
  const startAudioRef = useRef(null)
  const endAudioRef = useRef(null)
  // 多個 round 音軌，用於無縫播放
  const roundAudiosRef = useRef([])
  // 排程的 timer IDs
  const scheduledTimersRef = useRef([])

  // 音樂時長狀態
  const [startDuration, setStartDuration] = useState(null)
  const [roundDuration, setRoundDuration] = useState(null)

  const lastResetTriggerRef = useRef(resetTrigger)
  const lastPhaseRef = useRef(null)

  // 取得實際使用的音樂時長
  const actualStartDuration = startDuration
  const actualRoundDuration = roundDuration

  // 初始化並預載入音樂，同時讀取時長
  useEffect(() => {
    // 載入 start.mp3
    if (!startAudioRef.current) {
      startAudioRef.current = new Audio(AUDIO_FILES.START)
      startAudioRef.current.loop = false
      startAudioRef.current.preload = 'auto'

      startAudioRef.current.addEventListener('loadedmetadata', () => {
        const durationMs = Math.round(startAudioRef.current.duration * 1000)
        setStartDuration(durationMs)
        console.log('[useAudioPlayer] start.mp3 時長:', durationMs, 'ms')
      })
    }

    // 載入 end.mp3
    if (!endAudioRef.current) {
      endAudioRef.current = new Audio(AUDIO_FILES.END)
      endAudioRef.current.loop = false
      endAudioRef.current.preload = 'auto'
    }

    // 載入一個 round 音樂來讀取時長
    const roundAudioForDuration = new Audio(AUDIO_FILES.ROUND)
    roundAudioForDuration.preload = 'auto'
    roundAudioForDuration.addEventListener('loadedmetadata', () => {
      const durationMs = Math.round(roundAudioForDuration.duration * 1000)
      setRoundDuration(durationMs)
      console.log('[useAudioPlayer] round 音樂時長:', durationMs, 'ms')
    })
    roundAudioForDuration.load()
  }, [])

  // 清除所有排程的 timers
  const clearAllScheduledTimers = useCallback(() => {
    scheduledTimersRef.current.forEach(timerId => clearTimeout(timerId))
    scheduledTimersRef.current = []
  }, [])

  // 停止所有 round 音樂
  const stopAllRoundAudios = useCallback(() => {
    roundAudiosRef.current.forEach(audio => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    })
  }, [])

  // 停止所有音樂並清除排程
  const stopAllAudio = useCallback(() => {
    console.log('[useAudioPlayer] 停止所有音樂')
    clearAllScheduledTimers()

    if (startAudioRef.current) {
      startAudioRef.current.pause()
      startAudioRef.current.currentTime = 0
    }
    stopAllRoundAudios()
    if (endAudioRef.current) {
      endAudioRef.current.pause()
      endAudioRef.current.currentTime = 0
    }
  }, [clearAllScheduledTimers, stopAllRoundAudios])

  // 播放結束音樂
  const playEndMusic = useCallback(() => {
    console.log('[useAudioPlayer] 播放 end 音樂')
    // 先停止所有音樂和排程
    clearAllScheduledTimers()
    if (startAudioRef.current) {
      startAudioRef.current.pause()
      startAudioRef.current.currentTime = 0
    }
    stopAllRoundAudios()

    // 播放結束音樂
    if (endAudioRef.current) {
      endAudioRef.current.currentTime = 0
      endAudioRef.current.play().catch(err => {
        console.error('[useAudioPlayer] End 音樂播放失敗:', err)
      })
    }
  }, [clearAllScheduledTimers, stopAllRoundAudios])

  // 排程整個遊戲的音樂序列
  const scheduleGameAudio = useCallback((groupCount) => {
    console.log('[useAudioPlayer] 排程遊戲音樂，回合數:', groupCount)
    console.log('[useAudioPlayer] start 時長:', actualStartDuration, 'ms, round 時長:', actualRoundDuration, 'ms')

    // 清除之前的排程
    clearAllScheduledTimers()
    stopAllRoundAudios()

    // 為每個 round 創建獨立的 Audio 實例
    roundAudiosRef.current = Array.from({ length: groupCount }, () => {
      const audio = new Audio(AUDIO_FILES.ROUND)
      audio.loop = false
      audio.preload = 'auto'
      return audio
    })

    // 立即播放 start 音樂
    if (startAudioRef.current) {
      startAudioRef.current.currentTime = 0
      startAudioRef.current.play().catch(err => {
        console.error('[useAudioPlayer] Start 音樂播放失敗:', err)
      })
    }

    // 計算第一個 round 的播放時間（start 結束前 OVERLAP_MS 毫秒）
    const firstRoundTime = actualStartDuration - OVERLAP_MS

    // 排程每個 round 的播放時間
    for (let i = 0; i < groupCount; i++) {
      // 第一個 round 在 start 結束前 OVERLAP_MS 啟動
      // 之後每個 round 間隔 actualRoundDuration
      const playTime = firstRoundTime + (i * actualRoundDuration)

      const timerId = setTimeout(() => {
        const audio = roundAudiosRef.current[i]
        if (audio) {
          console.log(`[useAudioPlayer] 播放 round ${i + 1} 音樂，時間點: ${playTime}ms`)
          audio.currentTime = 0
          audio.play().catch(err => {
            console.error(`[useAudioPlayer] Round ${i + 1} 音樂播放失敗:`, err)
          })
        }
      }, playTime)

      scheduledTimersRef.current.push(timerId)
    }
  }, [clearAllScheduledTimers, stopAllRoundAudios, actualStartDuration, actualRoundDuration])

  // 重置音訊狀態
  const resetAudioState = useCallback(() => {
    console.log('[useAudioPlayer] 重置音訊狀態')
    stopAllAudio()
    lastPhaseRef.current = null
  }, [stopAllAudio])

  // 監聽 resetTrigger 變化來重置音訊狀態
  useEffect(() => {
    if (resetTrigger !== lastResetTriggerRef.current) {
      console.log('[useAudioPlayer] resetTrigger 變化，重置音訊狀態')
      lastResetTriggerRef.current = resetTrigger
      resetAudioState()
    }
  }, [resetTrigger, resetAudioState])

  // 根據遊戲階段控制音樂
  useEffect(() => {
    // 階段切換時的音樂控制
    if (gamePhase !== lastPhaseRef.current) {
      const prevPhase = lastPhaseRef.current
      lastPhaseRef.current = gamePhase

      console.log('[useAudioPlayer] 階段變化:', prevPhase, '->', gamePhase)

      switch (gamePhase) {
        case GAME_PHASES.READY:
          // 準備階段：排程整個遊戲的音樂序列
          scheduleGameAudio(totalGroups)
          break

        case GAME_PHASES.PLAYING:
          // 遊戲進行中：音樂已經在 READY 階段排程好了，不需要額外處理
          break

        case GAME_PHASES.ENDED:
          // 結束階段：停止所有音樂並播放結束音樂
          playEndMusic()
          break

        case GAME_PHASES.STOPPED:
          // 停止階段：停止所有音樂
          stopAllAudio()
          break

        default:
          break
      }
    }
  }, [gamePhase, totalGroups, scheduleGameAudio, playEndMusic, stopAllAudio])

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      clearAllScheduledTimers()
      stopAllRoundAudios()
    }
  }, [clearAllScheduledTimers, stopAllRoundAudios])

  // revealDelay = round 音樂時長 - (揭示拍 + 跳動拍)
  const { BEAT_INTERVAL, TOTAL_BEATS } = RHYTHM_SETTINGS
  const revealDelay = Math.max(0, actualRoundDuration - TOTAL_BEATS * 2 * BEAT_INTERVAL)

  const getExpectedTime = useCallback((roundIndex, phase, beatIndex = 0) => {
    const roundStartTime = actualStartDuration + (roundIndex * actualRoundDuration)
    switch (phase) {
      case 'round_start': return roundStartTime
      case 'reveal':      return roundStartTime + revealDelay + (beatIndex * BEAT_INTERVAL)
      case 'beat':        return roundStartTime + revealDelay + (TOTAL_BEATS * BEAT_INTERVAL) + (beatIndex * BEAT_INTERVAL)
      case 'round_end':   return roundStartTime + actualRoundDuration
      default:            return 0
    }
  }, [actualStartDuration, actualRoundDuration, revealDelay, BEAT_INTERVAL, TOTAL_BEATS])

  const timing = useMemo(() => ({
    startDuration: actualStartDuration,
    roundDuration: actualRoundDuration,
    revealDelay,
    beatInterval: BEAT_INTERVAL,
    totalBeats: TOTAL_BEATS,
    getExpectedTime,
  }), [actualStartDuration, actualRoundDuration, revealDelay, BEAT_INTERVAL, TOTAL_BEATS, getExpectedTime])

  return {
    stopAllAudio,
    resetAudioState,
    timing,
  }
}

export default useAudioPlayer
