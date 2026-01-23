# 節奏連拍大挑戰 (Chicken Dog Pig Game)

一款基於節奏的互動遊戲應用程式，讓使用者上傳圖片並組成群組，圖片會隨著背景音樂的節拍依序閃爍亮起，創造出視覺與聽覺同步的遊戲體驗。

## 功能特色

### 設定頁面
- 建立與管理圖片群組（最多 96 組）
- 每組包含 8 張圖片
- 支援拖放重新排序群組
- 隨機打亂單一群組或全部群組
- 從主題庫隨機匯入圖片

### 遊戲頁面
- 圖片隨節拍依序亮起
- 多回合遊戲（每組為一回合）
- 進度指示器顯示完成狀態
- 支援停止與重新開始

### 主題庫
- 建立可重複使用的圖片集合
- 批次上傳圖片至主題
- 可展開/收合的主題列表
- 支援重新命名與刪除主題

### 資料管理
- 儲存空間使用量視覺化
- 匯出備份為 JSON 檔案
- 從 JSON 檔案匯入備份
- 垃圾回收（移除未使用的圖片）
- 清除所有資料

## 技術架構

- **React 19** - UI 框架
- **Vite** - 建置工具與開發伺服器
- **Tailwind CSS** - 樣式框架
- **localStorage** - 本地資料儲存

## 安裝與執行

### 前置需求
- Node.js 18+
- npm 或 yarn

### 安裝步驟

```bash
# 複製專案
git clone <repository-url>
cd chicken-dog-pig-game

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

開發伺服器啟動後，在瀏覽器開啟 `http://localhost:5173`。

### 建置生產版本

```bash
npm run build
```

建置完成的檔案會輸出至 `dist` 目錄。

### 預覽生產版本

```bash
npm run preview
```

## 專案結構

```
src/
├── components/          # UI 元件
│   ├── SetupPage.jsx   # 設定頁面
│   ├── GamePage.jsx    # 遊戲頁面
│   ├── TopicsPage.jsx  # 主題庫頁面
│   ├── DataPage.jsx    # 資料管理頁面
│   ├── ImageGrid.jsx   # 圖片格線元件
│   ├── TabBar.jsx      # 分頁導覽列
│   ├── game/           # 遊戲相關畫面
│   └── common/         # 共用 UI 元件
├── hooks/              # 自訂 React Hooks
│   ├── useGameState.js # 遊戲狀態管理
│   ├── useAudioPlayer.js # 音效播放控制
│   ├── useDragAndDrop.js # 拖放功能
│   └── useFileUpload.js  # 檔案上傳處理
├── utils/              # 工具函式
│   ├── imageStore.js   # 圖片儲存與壓縮
│   ├── storage.js      # localStorage 管理
│   ├── shuffle.js      # 隨機演算法
│   └── migrations.js   # 資料遷移工具
├── constants/          # 常數定義
├── App.jsx             # 根元件
├── main.jsx            # 應用程式進入點
└── index.css           # 全域樣式
```

## 遊戲節奏參數

可在 `src/constants/index.js` 中調整遊戲節奏：

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `FIRST_DELAY` | 3100ms | 開場音樂後的延遲時間 |
| `BEAT_INTERVAL` | 315ms | 每個節拍之間的間隔 |
| `WAIT_TIME` | 2820ms | 群組之間的等待時間 |
| `TOTAL_BEATS` | 8 | 每組的節拍數（對應 8 張圖片） |

## 音效檔案

遊戲使用三個音效檔案，放置於 `public/` 目錄：

- `start.mp3` - 開場音樂
- `round.mp3` - 每回合遊戲音樂
- `end.mp3` - 結束音樂

## 限制說明

- **儲存空間**：使用瀏覽器 localStorage，上限約 5MB
- **圖片壓縮**：上傳的圖片會自動壓縮至 50% 品質
- **支援格式**：JPEG、PNG、GIF、WebP
- **檔案大小**：單張圖片最大 10MB
- **群組數量**：最多 96 組（共 768 張圖片）

## 授權

MIT License
