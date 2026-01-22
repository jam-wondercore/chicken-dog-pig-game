# 節奏系統設計

## 核心機制

### 自動播放模式
遊戲採用**純觀看模式**，外框會跟隨音樂節奏自動依序移動到每個格子，**不需要玩家點擊任何東西**。

```
遊戲流程：
開始 → 外框自動移動到第1格 → 移動到第2格 → ... → 移動到第8格
     → 切換到下一組 → 重複播放 → 所有組完成
```

## 節奏控制實作

### 固定時間間隔（推薦方案）

```javascript
const BEAT_INTERVAL = 800 // 每個格子持續 0.8 秒

useEffect(() => {
  if (gameState !== 'playing') return

  const timer = setInterval(() => {
    setCurrentBeatIndex(prev => {
      // 當前組播放完成
      if (prev >= 7) {
        handleGroupComplete()
        return 0
      }
      // 移動到下一格
      return prev + 1
    })
  }, BEAT_INTERVAL)

  return () => clearInterval(timer)
}, [gameState])

function handleGroupComplete() {
  if (hasNextGroup()) {
    // 切換到下一組
    setTimeout(() => {
      moveToNextGroup()
      setCurrentBeatIndex(0)
    }, 500) // 短暫停頓 0.5 秒
  } else {
    // 所有組播放完畢
    showGameComplete()
    setGameState('idle')
  }
}
```

### 基於音樂時間軸（進階方案）

如果希望外框與音樂完美同步：

```javascript
// 預先定義每個格子對應的音樂時間點（秒）
const BEAT_TIMESTAMPS = [
  0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8, 5.6
]

useEffect(() => {
  if (gameState !== 'playing') return

  const checkBeat = () => {
    const currentTime = audioRef.current.currentTime

    // 找出當前應該在哪一格
    const beatIndex = BEAT_TIMESTAMPS.findIndex((time, i) => {
      const nextTime = BEAT_TIMESTAMPS[i + 1] || Infinity
      return currentTime >= time && currentTime < nextTime
    })

    if (beatIndex !== -1 && beatIndex !== currentBeatIndex) {
      setCurrentBeatIndex(beatIndex)
    }
  }

  const interval = setInterval(checkBeat, 50) // 每 50ms 檢查一次
  return () => clearInterval(interval)
}, [gameState, currentBeatIndex])
```

## 視覺效果

### 外框高亮動畫

當前格子會有明顯的外框高亮效果：

```css
/* 當前播放格子 */
.grid-item.active {
  border: 6px solid #FBBF24; /* 粗黃色外框 */
  box-shadow: 0 0 30px rgba(251, 191, 36, 0.8);
  animation: pulse 0.8s ease-in-out infinite;
  z-index: 10;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 30px rgba(251, 191, 36, 0.8);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 40px rgba(251, 191, 36, 1);
  }
}
```

### 已播放過的格子（可選）

可以讓已經播放過的格子變暗，讓使用者知道進度：

```css
.grid-item.played {
  opacity: 0.6;
  filter: grayscale(30%);
}
```

### 組別切換動畫

```css
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.grid-container.switching {
  animation: fadeIn 0.5s ease-out;
}
```

## 狀態管理

### 遊戲狀態結構

```javascript
{
  gameState: 'idle' | 'playing' | 'paused',
  currentGroupIndex: 0,
  currentBeatIndex: 0,  // 0-7，當前外框所在的格子
  completedGroups: [],  // 已完成的組別 ID 列表
}
```

### 播放控制

```javascript
// 開始播放
function startGame() {
  setGameState('playing')
  setCurrentGroupIndex(0)
  setCurrentBeatIndex(0)
  audioRef.current.play()
}

// 暫停
function pauseGame() {
  setGameState('paused')
  audioRef.current.pause()
}

// 繼續
function resumeGame() {
  setGameState('playing')
  audioRef.current.play()
}

// 回到設定頁
function backToSetup() {
  setGameState('idle')
  audioRef.current.pause()
  audioRef.current.currentTime = 0
  setCurrentTab('setup')
}
```

## 音樂循環播放

音樂播放完後自動重頭開始：

```javascript
useEffect(() => {
  const audio = audioRef.current
  audio.loop = true // 設定循環播放

  return () => {
    audio.pause()
    audio.currentTime = 0
  }
}, [])
```

## 節奏調整建議

### 根據音樂 BPM 計算

如果知道音樂的 BPM（每分鐘節拍數）：

```javascript
const BPM = 120 // 音樂的 BPM
const beatsPerGrid = 2 // 每個格子佔幾拍

// 計算每格持續時間（毫秒）
const BEAT_INTERVAL = (60 / BPM) * beatsPerGrid * 1000

// 例如：BPM 120，每格2拍
// = (60 / 120) * 2 * 1000 = 1000ms
```

### 手動調整

播放音樂，用碼表測量：
1. 播放音樂
2. 手動在每個想要的節奏點按碼表
3. 計算平均間隔時間
4. 調整 `BEAT_INTERVAL` 數值

## 進度顯示

```javascript
// 遊戲頁面顯示
<div className="game-info">
  <p>當前組別：第 {currentGroupIndex + 1} / {groups.length} 組</p>
  <p>播放進度：{currentBeatIndex + 1} / 8</p>
</div>

// 進度條（可選）
<div className="progress-bar">
  <div
    className="progress-fill"
    style={{ width: `${((currentBeatIndex + 1) / 8) * 100}%` }}
  />
</div>
```

## 完成提示

所有組播放完畢後顯示完成畫面：

```javascript
function showGameComplete() {
  // 顯示完成訊息
  alert('所有組別播放完成！')

  // 或使用 Modal
  setShowCompleteModal(true)
}

// Modal 內容
<Modal show={showCompleteModal}>
  <h2>🎉 播放完成！</h2>
  <p>已播放 {groups.length} 組圖片</p>
  <button onClick={restartGame}>重新播放</button>
  <button onClick={backToSetup}>回到設定</button>
</Modal>
```

## 實作重點提醒

### 1. 沒有點擊事件
- ❌ 不需要實作 `handleGridClick`
- ❌ 不需要判斷點擊正確/錯誤
- ✅ 只需要外框自動移動的計時器

### 2. 暫停/繼續功能
- 暫停時停止計時器
- 暫停時停止音樂
- 繼續時從當前位置恢復

### 3. 組別切換
- 每組播放完後自動切換
- 可以加入 0.5 秒的過場時間
- 切換時重置 `currentBeatIndex` 為 0

### 4. 音樂同步（可選）
- 第一版可以先用固定間隔
- 之後再優化音樂同步
- 考慮加入手動校正時間偏移的功能
