import { useEffect, useRef, useCallback } from 'react'
import { AUDIO_FILES, AUDIO_SETTINGS, GAME_STATES } from '../constants'

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

function useAudioPlayer(gameState, currentGroupIndex = 0, isGameComplete = false) {
  const startAudioRef = useRef(null)
  const endAudioRef = useRef(null)
  const hasPlayedStartRef = useRef(false)
  const lastGroupIndexRef = useRef(-1)
  const gameStateRef = useRef(gameState)

  // 雙緩衝 round 音樂，實現無縫循環
  const roundAudioARef = useRef(null)
  const roundAudioBRef = useRef(null)
  const currentRoundRef = useRef('A')

  // 更新 gameState ref
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  // 初始化並預載入所有音樂
  useEffect(() => {
    if (!startAudioRef.current) {
      startAudioRef.current = new Audio(AUDIO_FILES.START)
      startAudioRef.current.loop = false
      startAudioRef.current.preload = 'auto'
    }
    if (!roundAudioARef.current) {
      roundAudioARef.current = new Audio(AUDIO_FILES.ROUND)
      roundAudioARef.current.loop = false
      roundAudioARef.current.preload = 'auto'
    }
    if (!roundAudioBRef.current) {
      roundAudioBRef.current = new Audio(AUDIO_FILES.ROUND)
      roundAudioBRef.current.loop = false
      roundAudioBRef.current.preload = 'auto'
    }
    if (!endAudioRef.current) {
      endAudioRef.current = new Audio(AUDIO_FILES.END)
      endAudioRef.current.loop = false
      endAudioRef.current.preload = 'auto'
    }

    // 預載入所有音樂
    Promise.all([
      preloadAudio(startAudioRef.current),
      preloadAudio(roundAudioARef.current),
      preloadAudio(roundAudioBRef.current),
      preloadAudio(endAudioRef.current),
    ]).then(() => {
      console.log('所有音樂預載入完成')
    })

    // 用於追蹤是否已經觸發切換，避免重複觸發
    let hasTriggeredSwitchA = false
    let hasTriggeredSwitchB = false

    // 無縫循環：在 A 快結束時提前播放 B
    const handleRoundATimeUpdate = () => {
      const audio = roundAudioARef.current
      if (!audio || hasTriggeredSwitchA) return

      const remaining = audio.duration - audio.currentTime
      if (remaining <= AUDIO_SETTINGS.CROSSFADE_TIME && remaining > 0) {
        hasTriggeredSwitchA = true
        hasTriggeredSwitchB = false
        if (gameStateRef.current === GAME_STATES.PLAYING && roundAudioBRef.current) {
          roundAudioBRef.current.currentTime = 0
          roundAudioBRef.current.play().catch(err => {
            console.error('Round B 音樂播放失敗:', err)
          })
          currentRoundRef.current = 'B'
        }
      }
    }

    // 無縫循環：在 B 快結束時提前播放 A
    const handleRoundBTimeUpdate = () => {
      const audio = roundAudioBRef.current
      if (!audio || hasTriggeredSwitchB) return

      const remaining = audio.duration - audio.currentTime
      if (remaining <= AUDIO_SETTINGS.CROSSFADE_TIME && remaining > 0) {
        hasTriggeredSwitchB = true
        hasTriggeredSwitchA = false
        if (gameStateRef.current === GAME_STATES.PLAYING && roundAudioARef.current) {
          roundAudioARef.current.currentTime = 0
          roundAudioARef.current.play().catch(err => {
            console.error('Round A 音樂播放失敗:', err)
          })
          currentRoundRef.current = 'A'
        }
      }
    }

    // ended 事件僅作為備用
    const handleRoundAEnded = () => {}
    const handleRoundBEnded = () => {}

    // 當 start 音樂結束時，開始播放 round A
    const handleStartEnded = () => {
      if (roundAudioARef.current && gameStateRef.current === GAME_STATES.PLAYING) {
        hasTriggeredSwitchA = false
        hasTriggeredSwitchB = false
        roundAudioARef.current.currentTime = 0
        roundAudioARef.current.play().catch(err => {
          console.error('Round A 音樂播放失敗:', err)
        })
        currentRoundRef.current = 'A'
      }
    }

    startAudioRef.current.addEventListener('ended', handleStartEnded)
    roundAudioARef.current.addEventListener('timeupdate', handleRoundATimeUpdate)
    roundAudioBRef.current.addEventListener('timeupdate', handleRoundBTimeUpdate)
    roundAudioARef.current.addEventListener('ended', handleRoundAEnded)
    roundAudioBRef.current.addEventListener('ended', handleRoundBEnded)

    return () => {
      if (startAudioRef.current) {
        startAudioRef.current.removeEventListener('ended', handleStartEnded)
      }
      if (roundAudioARef.current) {
        roundAudioARef.current.removeEventListener('timeupdate', handleRoundATimeUpdate)
        roundAudioARef.current.removeEventListener('ended', handleRoundAEnded)
      }
      if (roundAudioBRef.current) {
        roundAudioBRef.current.removeEventListener('timeupdate', handleRoundBTimeUpdate)
        roundAudioBRef.current.removeEventListener('ended', handleRoundBEnded)
      }
    }
  }, [])

  // 停止遊戲音樂（不包含結束音樂）
  const stopGameAudio = useCallback(() => {
    if (startAudioRef.current) {
      startAudioRef.current.pause()
      startAudioRef.current.currentTime = 0
    }
    if (roundAudioARef.current) {
      roundAudioARef.current.pause()
      roundAudioARef.current.currentTime = 0
    }
    if (roundAudioBRef.current) {
      roundAudioBRef.current.pause()
      roundAudioBRef.current.currentTime = 0
    }
  }, [])

  // 停止所有音樂（包含結束音樂）
  const stopAllAudio = useCallback(() => {
    stopGameAudio()
    if (endAudioRef.current) {
      endAudioRef.current.pause()
      endAudioRef.current.currentTime = 0
    }
  }, [stopGameAudio])

  // 播放結束音樂
  const playEndMusic = useCallback(() => {
    stopGameAudio()
    if (endAudioRef.current) {
      endAudioRef.current.currentTime = 0
      endAudioRef.current.play().catch(err => {
        console.error('End 音樂播放失敗:', err)
      })
    }
  }, [stopGameAudio])

  // 處理遊戲狀態變化
  useEffect(() => {
    if (gameState === GAME_STATES.PLAYING) {
      if (!hasPlayedStartRef.current && currentGroupIndex === 0) {
        hasPlayedStartRef.current = true
        lastGroupIndexRef.current = 0
        stopAllAudio()

        if (startAudioRef.current) {
          startAudioRef.current.currentTime = 0
          startAudioRef.current.play().catch(err => {
            console.error('Start 音樂播放失敗:', err)
          })
        }
      } else if (currentGroupIndex > 0 && lastGroupIndexRef.current !== currentGroupIndex) {
        lastGroupIndexRef.current = currentGroupIndex

        const roundA = roundAudioARef.current
        const roundB = roundAudioBRef.current
        const isAPlaying = roundA && !roundA.paused && roundA.currentTime > 0
        const isBPlaying = roundB && !roundB.paused && roundB.currentTime > 0

        if (!isAPlaying && !isBPlaying) {
          console.log('[useAudioPlayer] 下一組開始，重新播放 round 音樂')
          if (roundA) {
            roundA.currentTime = 0
            roundA.play().catch(err => {
              console.error('Round A 音樂播放失敗:', err)
            })
            currentRoundRef.current = 'A'
          }
        }
      }
    } else if (gameState === GAME_STATES.PAUSED) {
      stopGameAudio()
    } else if (gameState === GAME_STATES.IDLE) {
      stopAllAudio()
      hasPlayedStartRef.current = false
      lastGroupIndexRef.current = -1
    }
  }, [gameState, currentGroupIndex, stopAllAudio, stopGameAudio])

  // 處理遊戲結束
  useEffect(() => {
    if (isGameComplete) {
      playEndMusic()
    }
  }, [isGameComplete, playEndMusic])

  return {
    playEndMusic,
    stopAllAudio,
  }
}

export default useAudioPlayer
