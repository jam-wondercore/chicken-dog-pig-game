# 開發指南

## 環境需求

- Node.js 18+
- npm 或 yarn
- 現代瀏覽器（Chrome, Firefox, Safari, Edge）

## 專案初始化

### 1. 建立 Vite + React 專案
```bash
npm create vite@latest . -- --template react
npm install
```

### 2. 安裝 Tailwind CSS
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. 配置 Tailwind
編輯 `tailwind.config.js`：
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

編輯 `src/index.css`：
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. 建立資料夾結構
```bash
mkdir -p src/components
mkdir -p src/hooks
mkdir -p src/utils
```

### 5. 準備音樂檔案
將 `game.mp3` 放置到 `public/` 資料夾

## 開發指令

### 啟動開發伺服器
```bash
npm run dev
```
預設開啟：http://localhost:5173

### 建置生產版本
```bash
npm run build
```
輸出到 `dist/` 資料夾

### 預覽生產版本
```bash
npm run preview
```

## 開發流程

### 第一步：建立基礎組件
1. 建立 `TabBar.jsx` - Tab 切換
2. 建立 `ImageGrid.jsx` - 可複用的 4x4 網格

### 第二步：實作設定頁
1. 建立 `SetupPage.jsx` - 設定頁面容器
2. 建立 `GroupManager.jsx` - 組別管理
3. 建立 `ImageUploader.jsx` - 圖片上傳

### 第三步：實作遊戲頁
1. 建立 `GamePage.jsx` - 遊戲頁面容器
2. 整合 ImageGrid 顯示遊戲內容
3. 實作遊戲邏輯

### 第四步：整合狀態管理
1. 建立 `useGameState.js` - 全域狀態
2. 建立 `useImageUpload.js` - 圖片上傳邏輯
3. 建立 `useAudioPlayer.js` - 音樂播放

### 第五步：樣式與優化
1. 套用 Tailwind 樣式
2. 加入互動動畫
3. 測試與 Bug 修復

## 測試重點

### 功能測試
- [ ] 新增組別功能正常
- [ ] 刪除組別功能正常
- [ ] 批次上傳圖片正常
- [ ] 單一替換圖片正常
- [ ] Tab 切換正常
- [ ] 遊戲開始功能正常
- [ ] 節奏連拍邏輯正確
- [ ] 音樂循環播放正常
- [ ] 清除資料功能正常

### 邊界情況
- [ ] 沒有組別時的處理
- [ ] 沒有圖片時的處理
- [ ] 只有部分圖片時的處理
- [ ] 連續快速點擊的處理
- [ ] 音樂載入失敗的處理

## 常見問題

### Q: 音樂無法播放？
A: 確認 `game.mp3` 是否放在 `public/` 資料夾，並使用 `/game.mp3` 路徑引用。

### Q: 圖片上傳後刷新就不見了？
A: 這是預期行為，專案設計為不持久化資料。

### Q: 如何調整網格大小？
A: 修改 `ImageGrid.jsx` 中的 `grid-cols-4` 和 `grid-rows-2` 類別（目前為 2行 x 4列）。

### Q: 如何更換預設音樂？
A: 替換 `public/game.mp3` 檔案即可。
