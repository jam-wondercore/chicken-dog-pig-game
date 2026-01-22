# 技術架構

## 專案結構

```
chicken-dog-pig-game/
├── docs/                      # 文檔資料夾
│   ├── 01-overview.md
│   ├── 02-requirements.md
│   ├── 03-architecture.md
│   ├── 04-ui-design.md
│   └── 05-implementation.md
├── public/                    # 靜態資源
│   └── game.mp3              # 遊戲音樂檔案
├── src/
│   ├── components/           # React 組件
│   │   ├── TabBar.jsx       # Tab 切換欄
│   │   ├── SetupPage.jsx    # 設定頁面
│   │   ├── GamePage.jsx     # 遊戲頁面
│   │   ├── GroupManager.jsx # 組別管理
│   │   ├── ImageGrid.jsx    # 2x4 圖片網格
│   │   └── ImageUploader.jsx # 圖片上傳
│   ├── hooks/               # 自訂 Hooks
│   │   ├── useGameState.js  # 遊戲狀態管理
│   │   ├── useImageUpload.js # 圖片上傳邏輯
│   │   └── useAudioPlayer.js # 音樂播放邏輯
│   ├── utils/               # 工具函數
│   │   └── constants.js     # 常數定義
│   ├── App.jsx              # 主應用組件
│   ├── main.jsx             # 應用入口
│   └── index.css            # 全域樣式
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 組件架構

```
App
├── TabBar
└── [當前 Tab]
    ├── SetupPage
    │   ├── GroupManager
    │   ├── ImageUploader
    │   └── ImageGrid
    └── GamePage
        ├── GameInfo
        ├── ImageGrid
        └── GameControls
```

## 狀態管理

### 全域狀態結構
```javascript
{
  // Tab 狀態
  currentTab: 'setup' | 'game',

  // 組別資料
  groups: [
    {
      id: 'group-1',
      name: '第 1 組',
      images: Array(8).fill(null) // 8 個圖片 URL 或 null
    }
  ],

  // 當前編輯/遊玩的組別
  currentGroupId: 'group-1',

  // 遊戲狀態
  gameState: 'idle' | 'playing' | 'paused',
  currentClickIndex: 0, // 當前應該點擊的格子 index
}
```

## 核心 Hooks

### useGameState
管理整個應用的狀態
- 組別 CRUD 操作
- Tab 切換
- 遊戲狀態控制

### useImageUpload
處理圖片上傳邏輯
- 批次上傳
- 單一替換
- 圖片轉換為 Data URL

### useAudioPlayer
控制音樂播放
- 循環播放
- 跟隨遊戲狀態播放/暫停
