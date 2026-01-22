import { useState } from 'react'

function useGameState() {
  const [currentTab, setCurrentTab] = useState('setup')
  const [groups, setGroups] = useState([
    {
      id: 'group-1',
      name: '第 1 組',
      images: Array(8).fill(null)
    }
  ])
  const [currentGroupId, setCurrentGroupId] = useState('group-1')
  const [gameState, setGameState] = useState('idle')
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0)
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0)

  // 獲取當前組別
  const getCurrentGroup = () => {
    return groups.find(g => g.id === currentGroupId) || groups[0]
  }

  // 新增組別
  const addGroup = () => {
    const newGroup = {
      id: `group-${Date.now()}`,
      name: `第 ${groups.length + 1} 組`,
      images: Array(8).fill(null)
    }
    setGroups([...groups, newGroup])
  }

  // 刪除組別
  const deleteGroup = (groupId) => {
    if (groups.length === 1) {
      alert('至少需要保留一組')
      return
    }

    const filtered = groups.filter(g => g.id !== groupId)
    setGroups(filtered)

    if (currentGroupId === groupId) {
      setCurrentGroupId(filtered[0].id)
    }
  }

  // 更新組別圖片
  const updateGroupImage = (groupId, imageIndex, imageData) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        const newImages = [...group.images]
        newImages[imageIndex] = imageData
        return { ...group, images: newImages }
      }
      return group
    }))
  }

  // 批次上傳圖片
  const batchUploadImages = (groupId, files) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const emptyIndices = group.images
      .map((img, idx) => (img === null ? idx : -1))
      .filter(idx => idx !== -1)

    Array.from(files).slice(0, emptyIndices.length).forEach((file, i) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        updateGroupImage(groupId, emptyIndices[i], e.target.result)
      }
      reader.readAsDataURL(file)
    })
  }

  // 清除所有資料
  const clearAllData = () => {
    if (confirm('確定要清除所有組別與圖片資料嗎？')) {
      setGroups([
        {
          id: 'group-1',
          name: '第 1 組',
          images: Array(8).fill(null)
        }
      ])
      setCurrentGroupId('group-1')
      setGameState('idle')
      setCurrentTab('setup')
    }
  }

  // 開始遊戲
  const startGame = () => {
    setCurrentGroupIndex(0)
    setCurrentBeatIndex(0)
    setGameState('playing')
    setCurrentTab('game')
  }

  // 暫停遊戲
  const pauseGame = () => {
    setGameState('paused')
  }

  // 繼續遊戲
  const resumeGame = () => {
    setGameState('playing')
  }

  // 回到設定頁
  const backToSetup = () => {
    setGameState('idle')
    setCurrentTab('setup')
    setCurrentBeatIndex(0)
    setCurrentGroupIndex(0)
  }

  return {
    currentTab,
    setCurrentTab,
    groups,
    currentGroupId,
    setCurrentGroupId,
    gameState,
    currentBeatIndex,
    setCurrentBeatIndex,
    currentGroupIndex,
    setCurrentGroupIndex,
    getCurrentGroup,
    addGroup,
    deleteGroup,
    updateGroupImage,
    batchUploadImages,
    clearAllData,
    startGame,
    pauseGame,
    resumeGame,
    backToSetup,
  }
}

export default useGameState
