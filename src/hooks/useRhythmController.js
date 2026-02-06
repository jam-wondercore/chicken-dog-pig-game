import { useEffect, useRef, useState, useCallback } from 'react'
import { GAME_PHASES, BEAT_PHASES } from '../constants'

/**
 * 節拍控制器 Hook — 管理揭示/跳動序列的排程與狀態
 *
 * 每一回合的流程：
 *   revealDelay → reveal 0..7 → beat 0..7 → 下一回合（或結束）
 *
 * 使用絕對時間校正，避免 setTimeout 累積誤差。
 */
function useRhythmController({
  gamePhase,
  currentGroupIndex,
  groupCount,
  resetTrigger,
  timing,
  onGroupFinished,
  onAllFinished,
  onPlayingReady,
}) {
  const [revealIndex, setRevealIndex] = useState(-1)
  const [beatIndex, setBeatIndex] = useState(-1)

  const timerRef = useRef(null)
  const beatIndexRef = useRef(-1)
  const revealIndexRef = useRef(-1)
  const currentPhaseRef = useRef(BEAT_PHASES.REVEALING)
  const lastResetTriggerRef = useRef(resetTrigger)
  const gameStartTimeRef = useRef(null)

  // 絕對時間校正：計算到目標時間還需等多久
  const getDelayUntil = useCallback((expectedTime) => {
    return Math.max(0, expectedTime - (performance.now() - gameStartTimeRef.current))
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // resetTrigger 變化時重置本地狀態
  useEffect(() => {
    if (resetTrigger !== lastResetTriggerRef.current) {
      lastResetTriggerRef.current = resetTrigger
      clearTimer()
      beatIndexRef.current = -1
      revealIndexRef.current = -1
      setRevealIndex(-1)
      setBeatIndex(-1)
      currentPhaseRef.current = BEAT_PHASES.REVEALING
    }
  }, [resetTrigger, clearTimer])

  // READY → PLAYING 過渡（前奏結束後）
  useEffect(() => {
    if (gamePhase !== GAME_PHASES.READY) return
    gameStartTimeRef.current = performance.now()

    const timer = setTimeout(() => {
      onPlayingReady()
    }, timing.startDuration)

    return () => clearTimeout(timer)
  }, [gamePhase, onPlayingReady, timing.startDuration])

  // 核心：PLAYING 階段的節拍排程
  useEffect(() => {
    if (gamePhase !== GAME_PHASES.PLAYING) {
      clearTimer()
      return
    }
    clearTimer()

    const { totalBeats, getExpectedTime } = timing

    // 通用遞迴排程：逐步推進 index，到底後呼叫 onDone
    const runSequence = (phase, indexRef, setter, onDone) => {
      const step = () => {
        const current = indexRef.current
        if (current < totalBeats - 1) {
          indexRef.current = current + 1
          setter(indexRef.current)
          const nextExpected = getExpectedTime(currentGroupIndex, phase, indexRef.current + 1)
          timerRef.current = setTimeout(step, getDelayUntil(nextExpected))
        } else {
          onDone()
        }
      }
      // 啟動第 0 拍
      indexRef.current = 0
      setter(0)
      const beat1Expected = getExpectedTime(currentGroupIndex, phase, 1)
      timerRef.current = setTimeout(step, getDelayUntil(beat1Expected))
    }

    const startBeating = () => {
      currentPhaseRef.current = BEAT_PHASES.BEATING
      beatIndexRef.current = -1
      setBeatIndex(-1)
      runSequence('beat', beatIndexRef, setBeatIndex, finishGroup)
    }

    const finishGroup = () => {
      if (currentGroupIndex < groupCount - 1) {
        revealIndexRef.current = -1
        setRevealIndex(-1)
        onGroupFinished()
      } else {
        onAllFinished()
      }
    }

    // 開始揭示階段
    currentPhaseRef.current = BEAT_PHASES.REVEALING
    revealIndexRef.current = -1
    setRevealIndex(-1)
    beatIndexRef.current = -1
    setBeatIndex(-1)

    const reveal0Expected = getExpectedTime(currentGroupIndex, 'reveal', 0)
    timerRef.current = setTimeout(() => {
      runSequence('reveal', revealIndexRef, setRevealIndex, startBeating)
    }, getDelayUntil(reveal0Expected))

    return clearTimer
  }, [gamePhase, currentGroupIndex, groupCount, timing, onGroupFinished, onAllFinished, getDelayUntil, clearTimer])

  return { revealIndex, beatIndex }
}

export default useRhythmController
