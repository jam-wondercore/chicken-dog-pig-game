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

  // Topics 圖片庫
  const [topics, setTopics] = useState([])
  const [currentTopicId, setCurrentTopicId] = useState(null)

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

  // 開始/重新開始遊戲
  const resumeGame = () => {
    setCurrentGroupIndex(0)
    setCurrentBeatIndex(0)
    setGameState('playing')
  }

  // 回到設定頁
  const backToSetup = () => {
    setGameState('idle')
    setCurrentTab('setup')
    setCurrentBeatIndex(0)
    setCurrentGroupIndex(0)
  }

  // ========== Topics 圖片庫相關方法 ==========

  // 獲取當前 Topic
  const getCurrentTopic = () => {
    return topics.find(t => t.id === currentTopicId) || null
  }

  // 新增 Topic
  const addTopic = (name) => {
    const newTopic = {
      id: `topic-${Date.now()}`,
      name: name || `主題 ${topics.length + 1}`,
      images: []
    }
    setTopics([...topics, newTopic])
    setCurrentTopicId(newTopic.id)
    return newTopic
  }

  // 刪除 Topic
  const deleteTopic = (topicId) => {
    const filtered = topics.filter(t => t.id !== topicId)
    setTopics(filtered)

    if (currentTopicId === topicId) {
      setCurrentTopicId(filtered.length > 0 ? filtered[0].id : null)
    }
  }

  // 重新命名 Topic
  const renameTopic = (topicId, newName) => {
    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        return { ...topic, name: newName }
      }
      return topic
    }))
  }

  // 新增圖片到 Topic
  const addImageToTopic = (topicId, imageData) => {
    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        return { ...topic, images: [...topic.images, imageData] }
      }
      return topic
    }))
  }

  // 批次新增圖片到 Topic
  const batchAddImagesToTopic = (topicId, files) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        addImageToTopic(topicId, e.target.result)
      }
      reader.readAsDataURL(file)
    })
  }

  // 從 Topic 刪除圖片
  const deleteImageFromTopic = (topicId, imageIndex) => {
    console.log('deleteImageFromTopic called:', { topicId, imageIndex })
    setTopics(prev => {
      console.log('prev topics:', prev)
      const newTopics = prev.map(topic => {
        if (topic.id === topicId) {
          const newImages = topic.images.filter((_, idx) => idx !== imageIndex)
          console.log('Deleting image at index', imageIndex, 'from topic', topicId)
          return { ...topic, images: newImages }
        }
        return topic
      })
      console.log('new topics:', newTopics)
      return newTopics
    })
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
    // Topics 相關
    topics,
    currentTopicId,
    setCurrentTopicId,
    getCurrentTopic,
    addTopic,
    deleteTopic,
    renameTopic,
    addImageToTopic,
    batchAddImagesToTopic,
    deleteImageFromTopic,
  }
}

export default useGameState
