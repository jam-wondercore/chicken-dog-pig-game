import { useState, useEffect, useCallback } from 'react'
import { saveImage, saveImages, getImage, getImages, deleteImage, deleteImages, cleanupUnusedImages } from '../utils/imageStore'

const TOPICS_STORAGE_KEY = 'chicken-dog-pig-topics'
const GROUPS_STORAGE_KEY = 'chicken-dog-pig-groups'

// 遷移舊的 topics 資料（從 images base64 陣列 轉換為 imageIds）
const migrateOldTopics = async (topics) => {
  let needsMigration = false

  const migratedTopics = await Promise.all(
    topics.map(async (topic) => {
      // 檢查是否是舊格式（有 images 但沒有 imageIds）
      if (topic.images && !topic.imageIds) {
        needsMigration = true
        const imageIds = []
        for (const base64 of topic.images) {
          if (base64 && typeof base64 === 'string' && base64.startsWith('data:')) {
            const imageId = await saveImage(base64)
            if (imageId) imageIds.push(imageId)
          }
        }
        // 返回新格式，移除舊的 images 欄位
        const { images, ...rest } = topic
        return { ...rest, imageIds }
      }
      return topic
    })
  )

  return { topics: migratedTopics, migrated: needsMigration }
}

// 遷移舊的 groups 資料（從 base64 轉換為 imageIds）
const migrateOldGroups = async (groups) => {
  let needsMigration = false

  const migratedGroups = await Promise.all(
    groups.map(async (group) => {
      // 檢查是否有 base64 格式的圖片
      const hasBase64 = group.images.some(img => img && typeof img === 'string' && img.startsWith('data:'))
      if (hasBase64) {
        needsMigration = true
        const newImages = await Promise.all(
          group.images.map(async (img) => {
            if (img && typeof img === 'string' && img.startsWith('data:')) {
              return await saveImage(img)
            }
            return img // null 或已經是 imageId
          })
        )
        return { ...group, images: newImages }
      }
      return group
    })
  )

  return { groups: migratedGroups, migrated: needsMigration }
}

// 從 localStorage 讀取 Topics
const loadTopicsFromStorage = () => {
  try {
    const data = localStorage.getItem(TOPICS_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('讀取 topics 失敗:', e)
  }
  return []
}

// 儲存 Topics 到 localStorage
const saveTopicsToStorage = (topics) => {
  try {
    if (topics.length > 0) {
      localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics))
    } else {
      localStorage.removeItem(TOPICS_STORAGE_KEY)
    }
    return true
  } catch (e) {
    console.error('儲存 topics 失敗:', e)
    return false
  }
}

// 從 localStorage 讀取 Groups
const loadGroupsFromStorage = () => {
  try {
    const data = localStorage.getItem(GROUPS_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('讀取 groups 失敗:', e)
  }
  return null
}

// 儲存 Groups 到 localStorage
const saveGroupsToStorage = (groups) => {
  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups))
    return true
  } catch (e) {
    console.error('儲存 groups 失敗:', e)
    return false
  }
}

// 預設組別
const getDefaultGroups = () => [{
  id: 'group-1',
  name: '第 1 組',
  images: Array(8).fill(null) // 存放 imageId，null 表示空
}]

function useGameState() {
  const [currentTab, setCurrentTab] = useState('setup')
  const [groups, setGroups] = useState(() => loadGroupsFromStorage() || getDefaultGroups())
  const [currentGroupId, setCurrentGroupId] = useState(() => {
    const saved = loadGroupsFromStorage()
    return saved && saved.length > 0 ? saved[0].id : 'group-1'
  })
  const [gameState, setGameState] = useState('idle')
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0)
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0)

  // Topics 主題庫（存放 imageIds）
  const [topics, setTopics] = useState(() => loadTopicsFromStorage())
  const [currentTopicId, setCurrentTopicId] = useState(null)
  const [isMigrating, setIsMigrating] = useState(false)

  // 啟動時檢查並遷移舊資料
  useEffect(() => {
    const checkAndMigrate = async () => {
      const loadedTopics = loadTopicsFromStorage()
      // 檢查是否有舊格式的資料
      const hasOldFormat = loadedTopics.some(t => t.images && !t.imageIds)
      if (hasOldFormat) {
        setIsMigrating(true)
        console.log('偵測到舊格式資料，開始遷移...')
        const { topics: migratedTopics, migrated } = await migrateOldTopics(loadedTopics)
        if (migrated) {
          setTopics(migratedTopics)
          console.log('資料遷移完成')
        }
        setIsMigrating(false)
      }
    }
    checkAndMigrate()
  }, [])

  // 當 topics 改變時，儲存到 localStorage
  useEffect(() => {
    if (!isMigrating) {
      saveTopicsToStorage(topics)
    }
  }, [topics, isMigrating])

  // 當 groups 改變時，儲存到 localStorage
  useEffect(() => {
    if (!isMigrating) {
      saveGroupsToStorage(groups)
    }
  }, [groups, isMigrating])

  // 啟動時檢查並遷移舊的 groups 資料
  useEffect(() => {
    const checkAndMigrateGroups = async () => {
      const loadedGroups = loadGroupsFromStorage()
      if (!loadedGroups) return

      // 檢查是否有舊格式的資料（base64）
      const hasOldFormat = loadedGroups.some(g =>
        g.images.some(img => img && typeof img === 'string' && img.startsWith('data:'))
      )
      if (hasOldFormat) {
        setIsMigrating(true)
        console.log('偵測到舊格式 groups 資料，開始遷移...')
        const { groups: migratedGroups, migrated } = await migrateOldGroups(loadedGroups)
        if (migrated) {
          setGroups(migratedGroups)
          console.log('Groups 資料遷移完成')
        }
        setIsMigrating(false)
      }
    }
    checkAndMigrateGroups()
  }, [])

  // 獲取當前組別
  const getCurrentGroup = () => {
    return groups.find(g => g.id === currentGroupId) || groups[0]
  }

  // 獲取組別圖片的 base64（用於顯示）
  const getGroupImages = useCallback((groupId) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return Array(8).fill(null)
    return getImages(group.images)
  }, [groups])

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

    const group = groups.find(g => g.id === groupId)
    if (group) {
      // 刪除組別中的圖片（如果沒有被其他地方使用）
      // 這裡先不刪除圖片，等垃圾回收時處理
    }

    const filtered = groups.filter(g => g.id !== groupId)
    setGroups(filtered)

    if (currentGroupId === groupId) {
      setCurrentGroupId(filtered[0].id)
    }
  }

  // 更新組別圖片（傳入 file 或 imageId）
  const updateGroupImage = async (groupId, imageIndex, fileOrImageId) => {
    let imageId = fileOrImageId

    // 如果是 File 對象，先上傳壓縮
    if (fileOrImageId instanceof File) {
      const reader = new FileReader()
      const dataUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(fileOrImageId)
      })
      imageId = await saveImage(dataUrl)
    }
    // 如果是 base64 字串（data:image 開頭），先儲存
    else if (typeof fileOrImageId === 'string' && fileOrImageId.startsWith('data:')) {
      imageId = await saveImage(fileOrImageId)
    }

    if (!imageId) return

    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const newImages = [...group.images]
        newImages[imageIndex] = imageId
        return { ...group, images: newImages }
      }
      return group
    }))
  }

  // 批次上傳圖片到組別
  const batchUploadImages = async (groupId, files) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const emptyIndices = group.images
      .map((img, idx) => (img === null ? idx : -1))
      .filter(idx => idx !== -1)

    const filesToUpload = Array.from(files).slice(0, emptyIndices.length)
    const imageIds = await saveImages(filesToUpload)

    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const newImages = [...g.images]
        imageIds.forEach((imageId, i) => {
          newImages[emptyIndices[i]] = imageId
        })
        return { ...g, images: newImages }
      }
      return g
    }))
  }

  // 清除所有資料
  const clearAllData = () => {
    if (confirm('確定要清除所有組別與圖片資料嗎？')) {
      setGroups(getDefaultGroups())
      setCurrentGroupId('group-1')
      setGameState('idle')
      setCurrentTab('setup')
      // 觸發垃圾回收
      setTimeout(() => runGarbageCollection(), 100)
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

  // 獲取 Topic 圖片的 base64（用於顯示）
  const getTopicImages = useCallback((topicId) => {
    const topic = topics.find(t => t.id === topicId)
    if (!topic) return []
    return getImages(topic.imageIds || [])
  }, [topics])

  // 新增 Topic
  const addTopic = (name) => {
    const newTopic = {
      id: `topic-${Date.now()}`,
      name: name || `主題 ${topics.length + 1}`,
      imageIds: []
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

    // 觸發垃圾回收
    setTimeout(() => runGarbageCollection(), 100)
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
  const addImageToTopic = async (topicId, fileOrDataUrl) => {
    let imageId

    if (fileOrDataUrl instanceof File) {
      const reader = new FileReader()
      const dataUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(fileOrDataUrl)
      })
      imageId = await saveImage(dataUrl)
    } else if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      imageId = await saveImage(fileOrDataUrl)
    } else {
      // 已經是 imageId
      imageId = fileOrDataUrl
    }

    if (!imageId) return

    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        return { ...topic, imageIds: [...(topic.imageIds || []), imageId] }
      }
      return topic
    }))
  }

  // 批次新增圖片到 Topic
  const batchAddImagesToTopic = async (topicId, files) => {
    const imageIds = await saveImages(Array.from(files))

    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        return { ...topic, imageIds: [...(topic.imageIds || []), ...imageIds] }
      }
      return topic
    }))
  }

  // 從 Topic 刪除圖片
  const deleteImageFromTopic = (topicId, imageIndex) => {
    setTopics(prev => {
      const newTopics = prev.map(topic => {
        if (topic.id === topicId) {
          const newImageIds = (topic.imageIds || []).filter((_, idx) => idx !== imageIndex)
          return { ...topic, imageIds: newImageIds }
        }
        return topic
      })
      return newTopics
    })

    // 觸發垃圾回收
    setTimeout(() => runGarbageCollection(), 100)
  }

  // 調換組別順序
  const reorderGroups = (fromIndex, toIndex) => {
    setGroups(prev => {
      const newGroups = [...prev]
      const [removed] = newGroups.splice(fromIndex, 1)
      newGroups.splice(toIndex, 0, removed)
      return newGroups
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
    if (!topic || !topic.imageIds || topic.imageIds.length === 0) {
      alert('此主題沒有圖片可匯入')
      return
    }

    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const needed = group.images.length

    // 從 topic 隨機選擇 imageIds
    const shuffled = [...topic.imageIds].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, needed)

    // 如果 topic 圖片不足，重複選擇直到填滿
    const finalImageIds = []
    for (let i = 0; i < needed; i++) {
      finalImageIds.push(selected[i % selected.length])
    }

    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, images: finalImageIds }
      }
      return g
    }))
  }

  // 垃圾回收：清理未使用的圖片
  const runGarbageCollection = useCallback(() => {
    const usedImageIds = []

    // 收集 groups 使用的 imageIds
    groups.forEach(g => {
      g.images.forEach(id => {
        if (id) usedImageIds.push(id)
      })
    })

    // 收集 topics 使用的 imageIds
    topics.forEach(t => {
      (t.imageIds || []).forEach(id => {
        if (id) usedImageIds.push(id)
      })
    })

    cleanupUnusedImages(usedImageIds)
  }, [groups, topics])

  // 刪除組別中的單張圖片
  const deleteGroupImage = (groupId, imageIndex) => {
    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const newImages = [...group.images]
        newImages[imageIndex] = null
        return { ...group, images: newImages }
      }
      return group
    }))

    // 觸發垃圾回收
    setTimeout(() => runGarbageCollection(), 100)
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
    getGroupImages,
    addGroup,
    deleteGroup,
    deleteGroupImage,
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
    getTopicImages,
    addTopic,
    deleteTopic,
    renameTopic,
    addImageToTopic,
    batchAddImagesToTopic,
    deleteImageFromTopic,
    importFromTopic,
    shuffleGroup,
    shuffleAllGroups,
    reorderGroups,
    runGarbageCollection,
  }
}

export default useGameState
