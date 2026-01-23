import { useEffect, useRef, useCallback } from 'react'
import { AUDIO_FILES, GAME_PHASES } from '../constants'

// 預載入音樂並等待可播放
const preloadAudio = (audio) => {
  return new Promise((resolve) => {
    if (audio.readyState >= 3) {
      resolve()
    } else {
      audio.addEventListener('canplaythrough', () => resolve(), { once: true })
      audio.load()
    }
  })
}

/**
 * 音樂播放器 Hook - 根據遊戲階段自動播放對應音樂
 *
 * @param {string} gamePhase - 當前遊戲階段 (GAME_PHASES)
 * @param {number} currentGroupIndex - 當前播放的組別索引
 * @param {number} resetTrigger - 重置觸發器
 */
function useAudioPlayer(gamePhase, currentGroupIndex = 0, resetTrigger = 0) {
  const startAudioRef = useRef(null)
  const roundAudioRef = useRef(null)
  const endAudioRef = useRef(null)

  const lastGroupIndexRef = useRef(-1)
  const lastResetTriggerRef = useRef(resetTrigger)
  const lastPhaseRef = useRef(null)

  // 初始化並預載入所有音樂
  useEffect(() => {
    if (!startAudioRef.current) {
      startAudioRef.current = new Audio(AUDIO_FILES.START)
      startAudioRef.current.loop = false
      startAudioRef.current.preload = 'auto'
    }
    if (!roundAudioRef.current) {
      roundAudioRef.current = new Audio(AUDIO_FILES.ROUND)
      roundAudioRef.current.loop = false
      roundAudioRef.current.preload = 'auto'
    }
    if (!endAudioRef.current) {
      endAudioRef.current = new Audio(AUDIO_FILES.END)
      endAudioRef.current.loop = false
      endAudioRef.current.preload = 'auto'
    }

    // 預載入所有音樂
    Promise.all([
      preloadAudio(startAudioRef.current),
      preloadAudio(roundAudioRef.current),
      preloadAudio(endAudioRef.current),
    ]).then(() => {
      console.log('[useAudioPlayer] 所有音樂預載入完成')
    })
  }, [])

  // 播放開始音樂（前奏）
  const playStartMusic = useCallback(() => {
    console.log('[useAudioPlayer] 播放 start 音樂')
    if (startAudioRef.current) {
      startAudioRef.current.currentTime = 0
      startAudioRef.current.play().catch(err => {
        console.error('[useAudioPlayer] Start 音樂播放失敗:', err)
      })
    }
  }, [])

  // 播放 round 音樂
  const playRoundMusic = useCallback(() => {
    console.log('[useAudioPlayer] 播放 round 音樂')
    if (roundAudioRef.current) {
      roundAudioRef.current.currentTime = 0
      roundAudioRef.current.play().catch(err => {
        console.error('[useAudioPlayer] Round 音樂播放失敗:', err)
      })
    }
  }, [])

  // 播放結束音樂
  const playEndMusic = useCallback(() => {
    console.log('[useAudioPlayer] 播放 end 音樂')
    // 先停止其他音樂
    if (startAudioRef.current) {
      startAudioRef.current.pause()
      startAudioRef.current.currentTime = 0
    }
    if (roundAudioRef.current) {
      roundAudioRef.current.pause()
      roundAudioRef.current.currentTime = 0
    }
    // 播放結束音樂
    if (endAudioRef.current) {
      endAudioRef.current.currentTime = 0
      endAudioRef.current.play().catch(err => {
        console.error('[useAudioPlayer] End 音樂播放失敗:', err)
      })
    }
  }, [])

  // 停止所有音樂
  const stopAllAudio = useCallback(() => {
    console.log('[useAudioPlayer] 停止所有音樂')
    if (startAudioRef.current) {
      startAudioRef.current.pause()
      startAudioRef.current.currentTime = 0
    }
    if (roundAudioRef.current) {
      roundAudioRef.current.pause()
      roundAudioRef.current.currentTime = 0
    }
    if (endAudioRef.current) {
      endAudioRef.current.pause()
      endAudioRef.current.currentTime = 0
    }
  }, [])

  // 重置音訊狀態
  const resetAudioState = useCallback(() => {
    console.log('[useAudioPlayer] 重置音訊狀態')
    stopAllAudio()
    lastGroupIndexRef.current = -1
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

  // 根據遊戲階段播放對應音樂
  useEffect(() => {
    console.log('[useAudioPlayer] 階段變化:', {
      gamePhase,
      lastPhase: lastPhaseRef.current,
      currentGroupIndex,
      lastGroupIndex: lastGroupIndexRef.current
    })

    // 階段切換時的音樂控制
    if (gamePhase !== lastPhaseRef.current) {
      lastPhaseRef.current = gamePhase

      switch (gamePhase) {
        case GAME_PHASES.READY:
          // 準備階段：播放前奏音樂
          playStartMusic()
          lastGroupIndexRef.current = -1 // 重置組別索引
          break

        case GAME_PHASES.PLAYING:
          // 遊戲進行中：開始播放第一組的 round 音樂
          if (lastGroupIndexRef.current !== currentGroupIndex) {
            lastGroupIndexRef.current = currentGroupIndex
            playRoundMusic()
          }
          break

        case GAME_PHASES.ENDED:
          // 結束階段：播放結束音樂
          playEndMusic()
          break

        case GAME_PHASES.STOPPED:
          // 停止階段：停止所有音樂
          stopAllAudio()
          lastGroupIndexRef.current = -1
          break

        default:
          break
      }
    }

    // 遊戲進行中組別切換時播放 round 音樂
    if (gamePhase === GAME_PHASES.PLAYING && lastGroupIndexRef.current !== currentGroupIndex) {
      console.log('[useAudioPlayer] 組切換，播放 round 音樂:', lastGroupIndexRef.current, '->', currentGroupIndex)
      lastGroupIndexRef.current = currentGroupIndex
      playRoundMusic()
    }
  }, [gamePhase, currentGroupIndex, playStartMusic, playRoundMusic, playEndMusic, stopAllAudio])

  return {
    playStartMusic,
    playRoundMusic,
    playEndMusic,
    stopAllAudio,
    resetAudioState,
  }
}

export default useAudioPlayer
