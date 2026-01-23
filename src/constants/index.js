// 儲存鍵
export const STORAGE_KEYS = {
  TOPICS: 'chicken-dog-pig-topics',
  GROUPS: 'chicken-dog-pig-groups',
  IMAGES: 'chicken-dog-pig-images',
}

// 節奏設定
export const RHYTHM_SETTINGS = {
  FIRST_DELAY: 3100,      // 前奏延遲 (音樂開始後的前奏時間)
  BEAT_INTERVAL: 315,     // 每拍間隔 (快節奏跳動)
  WAIT_TIME: 2820,        // 每組等待時間 (ms)
  TOTAL_BEATS: 8,         // 每組跳動 n 拍
}

// 音訊設定
export const AUDIO_FILES = {
  START: '/start.mp3',    // 開始前奏
  ROUND: '/test_round.mp3',    // 每組循環播放
  END: '/end.mp3',        // 遊戲結束
}

// 圖片壓縮設定
export const IMAGE_SETTINGS = {
  QUALITY: 0.5,           // 壓縮品質
  MAX_WIDTH: 500,         // 最大寬度
  MAX_FILE_SIZE: 10 * 1024 * 1024,  // 單張最大 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}

// 儲存空間設定
export const STORAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024,  // 5MB
}

// 遊戲階段
export const GAME_PHASES = {
  STOPPED: 'stopped',   // 停止階段：顯示準備開始畫面
  READY: 'ready',       // 準備階段：播放 start.mp3 前奏音樂
  PLAYING: 'playing',   // 遊戲進行中：播放 round.mp3
  ENDED: 'ended',       // 結束階段：播放 end.mp3
}

// 節拍階段（每組內的狀態）
export const BEAT_PHASES = {
  WAITING: 'waiting',   // 等待階段：等待開始跳動
  BEATING: 'beating',   // 跳動階段：正在跳動
}

// 圖片網格模式
export const GRID_MODES = {
  SETUP: 'setup',       // 設定模式：可點擊編輯
  GAME: 'game',         // 遊戲模式：僅顯示
}

// 標籤頁
export const TABS = {
  DATA: 'data',
  SETUP: 'setup',
  TOPICS: 'topics',
  GAME: 'game',
}

// 預設群組數量
export const DEFAULT_GROUP_SIZE = 8

// 最大群組數量
export const MAX_GROUPS = 96
