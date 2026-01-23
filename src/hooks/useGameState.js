import { useState, useEffect, useCallback } from 'react'
import { saveImage, saveImages, getImages, cleanupUnusedImages, validateImageFile } from '../utils/imageStore'
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
import { TABS, GAME_PHASES, DEFAULT_GROUP_SIZE, MAX_GROUPS } from '../constants'

// 從 URL 讀取 tab 參數
const getTabFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  const tab = params.get('tab')
  // 驗證 tab 值是否有效
  if (tab && Object.values(TABS).includes(tab)) {
    return tab
  }
  return TABS.GROUP
}

// 更新 URL 的 tab 參數
const updateUrlTab = (tab) => {
  const url = new URL(window.location.href)
  url.searchParams.set('tab', tab)
  window.history.replaceState({}, '', url)
}

function useGameState() {
  // ========== 基礎狀態 ==========
  const [currentTab, setCurrentTabState] = useState(() => getTabFromUrl())

  // 包裝 setCurrentTab，同時更新 state 和 URL
  const setCurrentTab = useCallback((tab) => {
    setCurrentTabState(tab)
    updateUrlTab(tab)
  }, [])

  // 監聽瀏覽器上一頁/下一頁事件
  useEffect(() => {
    const handlePopState = () => {
      setCurrentTabState(getTabFromUrl())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const [groups, setGroups] = useState(() => loadGroupsFromStorage() || getDefaultGroups())
  const [currentGroupId, setCurrentGroupId] = useState(() => {
    const saved = loadGroupsFromStorage()
    return saved && saved.length > 0 ? saved[0].id : 'group-1'
  })

  // ========== 遊戲狀態 ==========
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.STOPPED)
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0)
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0)
  // 重置觸發器 - 每次遞增都會觸發完整重置
  const [resetTrigger, setResetTrigger] = useState(0)

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

    const deletedIndex = groups.findIndex(g => g.id === groupId)
    const filtered = groups.filter(g => g.id !== groupId)
    setGroups(filtered)

    if (currentGroupId === groupId) {
      // 選擇同一個 index，如果刪除的是最後一組則選前一組
      const nextIndex = Math.min(deletedIndex, filtered.length - 1)
      setCurrentGroupId(filtered[nextIndex].id)
    }
  }, [groups, currentGroupId])

  const updateGroupImage = useCallback(async (groupId, imageIndex, fileOrImageId) => {
    let imageId = fileOrImageId

    if (fileOrImageId instanceof File) {
      const validation = validateImageFile(fileOrImageId)
      if (!validation.valid) {
        console.warn(`跳過檔案：${validation.error}`)
        return
      }

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
  // 核心重置函數 - 所有重置操作都使用這個
  const resetGame = useCallback(() => {
    console.log('[useGameState] resetGame 被呼叫')
    setGamePhase(GAME_PHASES.STOPPED)
    setCurrentGroupIndex(0)
    setCurrentBeatIndex(-1)
    setResetTrigger(prev => prev + 1)
  }, [])

  const startGame = useCallback(() => {
    console.log('[useGameState] startGame 被呼叫')

    // 即時從 localStorage 讀取最新的 groups 資料
    const latestGroups = loadGroupsFromStorage()
    if (latestGroups && latestGroups.length > 0) {
      setGroups(latestGroups)
    }

    setCurrentGroupIndex(0)
    setCurrentBeatIndex(-1)
    setResetTrigger(prev => prev + 1)
    setGamePhase(GAME_PHASES.READY)
    setCurrentTab(TABS.GAME)
  }, [])

  // 進入遊戲進行階段（前奏結束後呼叫）
  const enterPlayingPhase = useCallback(() => {
    console.log('[useGameState] enterPlayingPhase 被呼叫')
    setGamePhase(GAME_PHASES.PLAYING)
  }, [])

  // 進入結束階段
  const enterEndedPhase = useCallback(() => {
    console.log('[useGameState] enterEndedPhase 被呼叫')
    setGamePhase(GAME_PHASES.ENDED)
  }, [])

  // resumeGame 完整重置並從頭開始
  // 即時從 localStorage 讀取最新資料，確保遊戲使用最新的設定
  const resumeGame = useCallback(() => {
    console.log('[useGameState] resumeGame 被呼叫')

    // 即時從 localStorage 讀取最新的 groups 資料
    const latestGroups = loadGroupsFromStorage()
    if (latestGroups && latestGroups.length > 0) {
      setGroups(latestGroups)
    }

    setCurrentGroupIndex(0)
    setCurrentBeatIndex(-1)
    setResetTrigger(prev => prev + 1)
    setGamePhase(GAME_PHASES.READY)
  }, [])

  const backToGroup = useCallback(() => {
    console.log('[useGameState] backToGroup 被呼叫')
    setGamePhase(GAME_PHASES.STOPPED)
    setCurrentTab(TABS.GROUP)
    setCurrentBeatIndex(-1)
    setCurrentGroupIndex(0)
    setResetTrigger(prev => prev + 1)
  }, [])

  // ========== 資料管理 ==========
  const clearAllData = useCallback(() => {
    if (confirm('確定要清除所有組別與圖片資料嗎？')) {
      setGroups(getDefaultGroups())
      setCurrentGroupId('group-1')
      setGamePhase(GAME_PHASES.STOPPED)
      setCurrentTab(TABS.GROUP)
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
    gamePhase,
    currentBeatIndex,
    setCurrentBeatIndex,
    currentGroupIndex,
    setCurrentGroupIndex,
    resetTrigger,
    resetGame,
    startGame,
    resumeGame,
    backToGroup,
    enterPlayingPhase,
    enterEndedPhase,

    // 資料管理
    clearAllData,
    runGarbageCollection,
  }
}

export default useGameState
