# 實作指南

## 核心功能實作細節

### 1. 圖片上傳處理

#### 批次上傳
```javascript
function handleBatchUpload(files) {
  const fileArray = Array.from(files)
  const emptySlots = images.filter(img => img === null)

  fileArray.slice(0, emptySlots.length).forEach((file, index) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      updateImage(getFirstEmptyIndex(), e.target.result)
    }
    reader.readAsDataURL(file)
  })
}
```

#### 單一替換
```javascript
function handleSingleUpload(index, file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    updateImage(index, e.target.result)
  }
  reader.readAsDataURL(file)
}
```

### 2. 音樂播放控制

```javascript
// useAudioPlayer.js
const useAudioPlayer = (gameState) => {
  const audioRef = useRef(new Audio('/game.mp3'))

  useEffect(() => {
    const audio = audioRef.current
    audio.loop = true

    if (gameState === 'playing') {
      audio.play()
    } else {
      audio.pause()
    }

    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [gameState])

  return audioRef
}
```

### 3. 遊戲邏輯 - 節奏系統

```javascript
// 節奏控制：外框自動移動
const BEAT_INTERVAL = 800 // 每個格子持續 0.8 秒

useEffect(() => {
  if (gameState !== 'playing') return

  const timer = setInterval(() => {
    setCurrentBeatIndex(prev => {
      if (prev >= 7) {
        // 當前組完成，切換到下一組
        handleGroupComplete()
        return 0
      }
      return prev + 1
    })
  }, BEAT_INTERVAL)

  return () => clearInterval(timer)
}, [gameState])

// 玩家點擊處理
function handleGridClick(clickedIndex) {
  // 檢查是否點擊當前節奏點
  if (clickedIndex !== currentBeatIndex) {
    // 點錯了
    playErrorFeedback()
    showErrorAnimation(clickedIndex)
    return
  }

  // 點對了
  playCorrectFeedback()
  markAsCompleted(clickedIndex)

  // 檢查是否完成當前組
  if (clickedIndex === 7) {
    handleGroupComplete()
  }
}

function handleGroupComplete() {
  if (hasNextGroup()) {
    setTimeout(() => {
      moveToNextGroup()
      setCurrentBeatIndex(0)
    }, 500)
  } else {
    // 所有組完成
    showGameComplete()
    setGameState('idle')
  }
}
```

詳細的節奏系統設計請參考 [07-rhythm-system.md](07-rhythm-system.md)

### 4. 組別管理

```javascript
// 新增組別
function addGroup() {
  const newGroup = {
    id: `group-${Date.now()}`,
    name: `第 ${groups.length + 1} 組`,
    images: Array(8).fill(null)
  }
  setGroups([...groups, newGroup])
}

// 刪除組別
function deleteGroup(groupId) {
  const filtered = groups.filter(g => g.id !== groupId)
  setGroups(filtered)

  // 如果刪除的是當前組，切換到第一組
  if (currentGroupId === groupId && filtered.length > 0) {
    setCurrentGroupId(filtered[0].id)
  }
}

// 切換組別
function switchGroup(groupId) {
  setCurrentGroupId(groupId)
}
```

## 狀態管理實作

### useGameState Hook
```javascript
const useGameState = () => {
  const [currentTab, setCurrentTab] = useState('setup')
  const [groups, setGroups] = useState([{
    id: 'group-1',
    name: '第 1 組',
    images: Array(8).fill(null)
  }])
  const [currentGroupId, setCurrentGroupId] = useState('group-1')
  const [gameState, setGameState] = useState('idle')
  const [currentClickIndex, setCurrentClickIndex] = useState(0)

  return {
    currentTab,
    setCurrentTab,
    groups,
    setGroups,
    currentGroupId,
    setCurrentGroupId,
    gameState,
    setGameState,
    currentClickIndex,
    setCurrentClickIndex,
    // ... helper functions
  }
}
```

## 開發階段規劃

### Phase 1: 專案初始化 ✓
- 建立 Vite + React 專案
- 安裝 Tailwind CSS
- 建立基礎資料夾結構
- 準備 game.mp3 音樂檔案

### Phase 2: 基礎組件
- TabBar 組件
- 基礎佈局組件
- ImageGrid 組件（可複用）

### Phase 3: 設定頁面
- GroupManager 組件
- ImageUploader 組件
- 批次上傳功能
- 單一替換功能
- 組別 CRUD 操作

### Phase 4: 遊戲頁面
- 遊戲資訊顯示
- 遊戲邏輯實作
- 點擊互動處理
- 視覺反饋效果

### Phase 5: 音樂整合
- useAudioPlayer Hook
- 音樂循環播放
- 狀態同步控制

### Phase 6: 樣式與優化
- Tailwind 樣式完善
- 互動動畫
- 效能優化
- 錯誤處理

## 注意事項

### 圖片處理
- 使用 `FileReader.readAsDataURL()` 轉換圖片
- 不儲存到 LocalStorage（避免超出容量限制）
- 重整頁面後資料會清空

### 音樂檔案
- 確保 `game.mp3` 放在 `public/` 資料夾
- 使用絕對路徑 `/game.mp3` 引用

### 效能考量
- 避免不必要的重新渲染
- 使用 `React.memo` 優化組件
- 大圖片考慮壓縮處理

### 錯誤處理
- 檔案類型驗證（只接受圖片）
- 空組別狀態處理
- 音樂載入失敗處理
