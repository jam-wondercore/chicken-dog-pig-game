// 儲存鍵
export const STORAGE_KEYS = {
  TOPICS: 'chicken-dog-pig-topics',
  GROUPS: 'chicken-dog-pig-groups',
  IMAGES: 'chicken-dog-pig-images',
}

// 節奏設定
export const RHYTHM_SETTINGS = {
  FIRST_DELAY: 3100,      // 前奏延遲 (音樂開始後的前奏時間)
  BEAT_INTERVAL: 300,     // 每拍間隔 (快節奏跳動)
  WAIT_TIME: 2800,        // 每組等待時間 (ms)
  TOTAL_BEATS: 8,         // 每組跳動 n 拍
}

// 音訊設定
export const AUDIO_FILES = {
  START: '/start.mp3',    // 開始前奏
  ROUND: '/round.mp3',    // 每組循環播放
  END: '/end.mp3',        // 遊戲結束
}

// 音訊播放設定
export const AUDIO_SETTINGS = {
  CROSSFADE_TIME: 0.05,   // 提前切換時間（秒）
}

// 圖片壓縮設定
export const IMAGE_SETTINGS = {
  QUALITY: 0.5,           // 壓縮品質
  MAX_WIDTH: 500,         // 最大寬度
}

// 儲存空間設定
export const STORAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024,  // 5MB
}

// 遊戲狀態
export const GAME_STATES = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
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
export const MAX_GROUPS = 10
