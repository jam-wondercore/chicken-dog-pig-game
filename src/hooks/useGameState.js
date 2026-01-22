import { useState, useEffect, useCallback } from 'react'
import { saveImage, saveImages, getImages, cleanupUnusedImages } from '../utils/imageStore'
import {
  loadTopicsFromStorage,
  saveTopicsToStorage,
  loadGroupsFromStorage,
  saveGroupsToStorage,
  getDefaultGroups,
} from '../utils/storage'
import {
  migrateOldTopics,
  migrateOldGroups,
  needsTopicsMigration,
  needsGroupsMigration,
} from '../utils/migrations'
import { fisherYatesShuffle, randomPickWithRepeat } from '../utils/shuffle'
import { TABS, GAME_STATES, DEFAULT_GROUP_SIZE, MAX_GROUPS } from '../constants'

function useGameState() {
  // ========== 基礎狀態 ==========
  const [currentTab, setCurrentTab] = useState(TABS.SETUP)
  const [groups, setGroups] = useState(() => loadGroupsFromStorage() || getDefaultGroups())
  const [currentGroupId, setCurrentGroupId] = useState(() => {
    const saved = loadGroupsFromStorage()
    return saved && saved.length > 0 ? saved[0].id : 'group-1'
  })

  // ========== 遊戲狀態 ==========
  const [gameState, setGameState] = useState(GAME_STATES.IDLE)
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0)
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0)

  // ========== Topics 主題庫狀態 ==========
  const [topics, setTopics] = useState(() => loadTopicsFromStorage())
  const [currentTopicId, setCurrentTopicId] = useState(null)
  const [isMigrating, setIsMigrating] = useState(false)

  // ========== 資料遷移 ==========
  useEffect(() => {
    const checkAndMigrateTopics = async () => {
      const loadedTopics = loadTopicsFromStorage()
      if (needsTopicsMigration(loadedTopics)) {
        setIsMigrating(true)
        console.log('偵測到舊格式 topics 資料，開始遷移...')
        const { topics: migratedTopics, migrated } = await migrateOldTopics(loadedTopics)
        if (migrated) {
          setTopics(migratedTopics)
          console.log('Topics 資料遷移完成')
        }
        setIsMigrating(false)
      }
    }
    checkAndMigrateTopics()
  }, [])

  useEffect(() => {
    const checkAndMigrateGroups = async () => {
      const loadedGroups = loadGroupsFromStorage()
      if (!loadedGroups) return

      if (needsGroupsMigration(loadedGroups)) {
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

  // ========== 自動儲存 ==========
  useEffect(() => {
    if (!isMigrating) {
      saveTopicsToStorage(topics)
    }
  }, [topics, isMigrating])

  useEffect(() => {
    if (!isMigrating) {
      saveGroupsToStorage(groups)
    }
  }, [groups, isMigrating])

  // ========== 垃圾回收 ==========
  const runGarbageCollection = useCallback(() => {
    const usedImageIds = []

    groups.forEach(g => {
      g.images.forEach(id => {
        if (id) usedImageIds.push(id)
      })
    })

    topics.forEach(t => {
      (t.imageIds || []).forEach(id => {
        if (id) usedImageIds.push(id)
      })
    })

    cleanupUnusedImages(usedImageIds)
  }, [groups, topics])

  // ========== Groups 相關方法 ==========
  const getCurrentGroup = useCallback(() => {
    return groups.find(g => g.id === currentGroupId) || groups[0]
  }, [groups, currentGroupId])

  const getGroupImages = useCallback((groupId) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return Array(DEFAULT_GROUP_SIZE).fill(null)
    return getImages(group.images)
  }, [groups])

  const addGroup = useCallback(() => {
    if (groups.length >= MAX_GROUPS) return

    const newGroup = {
      id: `group-${Date.now()}`,
      name: `第 ${groups.length + 1} 組`,
      images: Array(DEFAULT_GROUP_SIZE).fill(null)
    }
    setGroups(prev => [...prev, newGroup])
    setCurrentGroupId(newGroup.id)
  }, [groups.length])

  const deleteGroup = useCallback((groupId) => {
    if (groups.length === 1) {
      alert('至少需要保留一組')
      return
    }

    const filtered = groups.filter(g => g.id !== groupId)
    setGroups(filtered)

    if (currentGroupId === groupId) {
      setCurrentGroupId(filtered[0].id)
    }
  }, [groups, currentGroupId])

  const updateGroupImage = useCallback(async (groupId, imageIndex, fileOrImageId) => {
    let imageId = fileOrImageId

    if (fileOrImageId instanceof File) {
      const reader = new FileReader()
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsDataURL(fileOrImageId)
      })
      imageId = await saveImage(dataUrl)
    } else if (typeof fileOrImageId === 'string' && fileOrImageId.startsWith('data:')) {
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
  }, [])

  const batchUploadImages = useCallback(async (groupId, files) => {
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
  }, [groups])

  const deleteGroupImage = useCallback((groupId, imageIndex) => {
    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const newImages = [...group.images]
        newImages[imageIndex] = null
        return { ...group, images: newImages }
      }
      return group
    }))

    setTimeout(() => runGarbageCollection(), 100)
  }, [runGarbageCollection])

  const reorderGroups = useCallback((fromIndex, toIndex) => {
    setGroups(prev => {
      const newGroups = [...prev]
      const [removed] = newGroups.splice(fromIndex, 1)
      newGroups.splice(toIndex, 0, removed)
      return newGroups
    })
  }, [])

  // ========== 打亂功能（使用 Fisher-Yates）==========
  const shuffleGroup = useCallback((groupId) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, images: fisherYatesShuffle(g.images) }
      }
      return g
    }))
  }, [])

  const shuffleAllGroups = useCallback(() => {
    setGroups(prev => prev.map(g => ({
      ...g,
      images: fisherYatesShuffle(g.images)
    })))
  }, [])

  // ========== Topics 相關方法 ==========
  const getCurrentTopic = useCallback(() => {
    return topics.find(t => t.id === currentTopicId) || null
  }, [topics, currentTopicId])

  const getTopicImages = useCallback((topicId) => {
    const topic = topics.find(t => t.id === topicId)
    if (!topic) return []
    return getImages(topic.imageIds || [])
  }, [topics])

  const addTopic = useCallback((name) => {
    const newTopic = {
      id: `topic-${Date.now()}`,
      name: name || `主題 ${topics.length + 1}`,
      imageIds: []
    }
    setTopics(prev => [...prev, newTopic])
    setCurrentTopicId(newTopic.id)
    return newTopic
  }, [topics.length])

  const deleteTopic = useCallback((topicId) => {
    const filtered = topics.filter(t => t.id !== topicId)
    setTopics(filtered)

    if (currentTopicId === topicId) {
      setCurrentTopicId(filtered.length > 0 ? filtered[0].id : null)
    }

    setTimeout(() => runGarbageCollection(), 100)
  }, [topics, currentTopicId, runGarbageCollection])

  const renameTopic = useCallback((topicId, newName) => {
    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        return { ...topic, name: newName }
      }
      return topic
    }))
  }, [])

  const addImageToTopic = useCallback(async (topicId, fileOrDataUrl) => {
    let imageId

    if (fileOrDataUrl instanceof File) {
      const reader = new FileReader()
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsDataURL(fileOrDataUrl)
      })
      imageId = await saveImage(dataUrl)
    } else if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      imageId = await saveImage(fileOrDataUrl)
    } else {
      imageId = fileOrDataUrl
    }

    if (!imageId) return

    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        return { ...topic, imageIds: [...(topic.imageIds || []), imageId] }
      }
      return topic
    }))
  }, [])

  const batchAddImagesToTopic = useCallback(async (topicId, files) => {
    const imageIds = await saveImages(Array.from(files))

    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        return { ...topic, imageIds: [...(topic.imageIds || []), ...imageIds] }
      }
      return topic
    }))
  }, [])

  const deleteImageFromTopic = useCallback((topicId, imageIndex) => {
    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        const newImageIds = (topic.imageIds || []).filter((_, idx) => idx !== imageIndex)
        return { ...topic, imageIds: newImageIds }
      }
      return topic
    }))

    setTimeout(() => runGarbageCollection(), 100)
  }, [runGarbageCollection])

  const importFromTopic = useCallback((groupId, topicId) => {
    const topic = topics.find(t => t.id === topicId)
    if (!topic || !topic.imageIds || topic.imageIds.length === 0) {
      alert('此主題沒有圖片可匯入')
      return
    }

    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const needed = group.images.length
    const finalImageIds = randomPickWithRepeat(topic.imageIds, needed)

    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, images: finalImageIds }
      }
      return g
    }))
  }, [topics, groups])

  // ========== 遊戲控制 ==========
  const startGame = useCallback(() => {
    setCurrentGroupIndex(0)
    setCurrentBeatIndex(0)
    setGameState(GAME_STATES.PLAYING)
    setCurrentTab(TABS.GAME)
  }, [])

  const pauseGame = useCallback(() => {
    setGameState(GAME_STATES.PAUSED)
  }, [])

  const resumeGame = useCallback(() => {
    setCurrentGroupIndex(0)
    setCurrentBeatIndex(0)
    setGameState(GAME_STATES.PLAYING)
  }, [])

  const backToSetup = useCallback(() => {
    setGameState(GAME_STATES.IDLE)
    setCurrentTab(TABS.SETUP)
    setCurrentBeatIndex(0)
    setCurrentGroupIndex(0)
  }, [])

  // ========== 資料管理 ==========
  const clearAllData = useCallback(() => {
    if (confirm('確定要清除所有組別與圖片資料嗎？')) {
      setGroups(getDefaultGroups())
      setCurrentGroupId('group-1')
      setGameState(GAME_STATES.IDLE)
      setCurrentTab(TABS.SETUP)
      setTimeout(() => runGarbageCollection(), 100)
    }
  }, [runGarbageCollection])

  return {
    // Tab 控制
    currentTab,
    setCurrentTab,

    // Groups 相關
    groups,
    currentGroupId,
    setCurrentGroupId,
    getCurrentGroup,
    getGroupImages,
    addGroup,
    deleteGroup,
    deleteGroupImage,
    updateGroupImage,
    batchUploadImages,
    reorderGroups,
    shuffleGroup,
    shuffleAllGroups,

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

    // 遊戲控制
    gameState,
    currentBeatIndex,
    setCurrentBeatIndex,
    currentGroupIndex,
    setCurrentGroupIndex,
    startGame,
    pauseGame,
    resumeGame,
    backToSetup,

    // 資料管理
    clearAllData,
    runGarbageCollection,
  }
}

export default useGameState
