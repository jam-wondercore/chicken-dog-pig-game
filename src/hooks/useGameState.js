import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'chicken-dog-pig-topics'

// 壓縮圖片的函數
const compressImage = (dataUrl, quality = 0.5, maxWidth = 500) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // 如果圖片太大，縮小尺寸
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // 使用 JPEG 格式壓縮
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

// 嘗試儲存到 localStorage，如果空間不足則壓縮圖片
const saveToLocalStorage = async (topics) => {
  const data = JSON.stringify(topics)

  try {
    localStorage.setItem(STORAGE_KEY, data)
    return true
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn('localStorage 空間不足，嘗試壓縮圖片...')

      // 壓縮所有圖片
      const compressedTopics = await Promise.all(
        topics.map(async (topic) => ({
          ...topic,
          images: await Promise.all(
            topic.images.map((img) => compressImage(img, 0.3, 400))
          ),
        }))
      )

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compressedTopics))
        console.log('壓縮後儲存成功')
        return true
      } catch (e2) {
        console.error('即使壓縮後仍無法儲存:', e2)
        alert('儲存空間不足，部分圖片可能無法保存。請刪除一些圖片後重試。')
        return false
      }
    }
    console.error('儲存失敗:', e)
    return false
  }
}

// 從 localStorage 讀取資料
const loadFromLocalStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('讀取 localStorage 失敗:', e)
  }
  return []
}

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

  // Topics 主題庫
  const [topics, setTopics] = useState(() => loadFromLocalStorage())
  const [currentTopicId, setCurrentTopicId] = useState(null)

  // 當 topics 改變時，儲存到 localStorage
  useEffect(() => {
    if (topics.length > 0) {
      saveToLocalStorage(topics)
    } else {
      // 如果 topics 為空，清除 localStorage
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [topics])

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
    setCurrentGroupId(newGroup.id)
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

  // ========== Topics 主題庫相關方法 ==========

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

  // 批次新增圖片到 Topic（上傳時壓縮）
  const batchAddImagesToTopic = async (topicId, files) => {
    for (const file of Array.from(files)) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        // 上傳時先壓縮圖片以節省空間
        const compressed = await compressImage(e.target.result, 0.5, 500)
        addImageToTopic(topicId, compressed)
      }
      reader.readAsDataURL(file)
    }
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

  // 打亂單一組別的圖片順序
  const shuffleGroup = (groupId) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const shuffled = [...g.images].sort(() => Math.random() - 0.5)
        return { ...g, images: shuffled }
      }
      return g
    }))
  }

  // 打亂所有組別的圖片順序
  const shuffleAllGroups = () => {
    setGroups(prev => prev.map(g => ({
      ...g,
      images: [...g.images].sort(() => Math.random() - 0.5)
    })))
  }

  // 從 Topic 匯入隨機圖片到 Group
  const importFromTopic = (groupId, topicId) => {
    const topic = topics.find(t => t.id === topicId)
    if (!topic || topic.images.length === 0) {
      alert('此主題沒有圖片可匯入')
      return
    }

    const group = groups.find(g => g.id === groupId)
    if (!group) return

    // 需要的圖片數量（group 的 images 長度，通常是 8）
    const needed = group.images.length

    // 從 topic 隨機選擇 n 張圖片
    const shuffled = [...topic.images].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, needed)

    // 如果 topic 圖片不足，重複選擇直到填滿
    const finalImages = []
    for (let i = 0; i < needed; i++) {
      finalImages.push(selected[i % selected.length])
    }

    // 更新 group 的圖片
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, images: finalImages }
      }
      return g
    }))
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
    importFromTopic,
    shuffleGroup,
    shuffleAllGroups,
  }
}

export default useGameState
