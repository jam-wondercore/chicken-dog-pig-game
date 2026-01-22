import { useEffect, useRef } from 'react'

function useAudioPlayer(gameState) {
  const audioRef = useRef(null)

  useEffect(() => {
    // 初始化音樂
    if (!audioRef.current) {
      audioRef.current = new Audio('/game.mp3')
      audioRef.current.loop = true
    }

    const audio = audioRef.current

    if (gameState === 'playing') {
      audio.play().catch(err => {
        console.error('音樂播放失敗:', err)
      })
    } else {
      audio.pause()
    }

    return () => {
      if (gameState === 'idle') {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [gameState])

  return audioRef
}

export default useAudioPlayer
