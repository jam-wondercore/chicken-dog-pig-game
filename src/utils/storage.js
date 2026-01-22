import { STORAGE_KEYS, STORAGE_CONFIG, DEFAULT_GROUP_SIZE } from '../constants'

/**
 * 估算 localStorage 使用量
 * @returns {number} 位元組數
 */
export const getStorageUsage = () => {
  let total = 0
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2 // UTF-16 每字元 2 bytes
    }
  }
  return total
}

/**
 * 取得儲存空間百分比
 * @returns {number} 0-100
 */
export const getStoragePercent = () => {
  const used = getStorageUsage()
  return Math.min((used / STORAGE_CONFIG.MAX_SIZE) * 100, 100)
}

/**
 * 檢查是否有足夠空間
 * @param {number} requiredBytes - 需要的位元組數
 * @returns {boolean}
 */
export const hasEnoughSpace = (requiredBytes) => {
  const available = STORAGE_CONFIG.MAX_SIZE - getStorageUsage()
  return requiredBytes <= available * 1.5 // 留一些餘量
}

// ========== Topics 儲存 ==========

/**
 * 從 localStorage 讀取 Topics
 * @returns {Array}
 */
export const loadTopicsFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TOPICS)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('讀取 topics 失敗:', e)
  }
  return []
}

/**
 * 儲存 Topics 到 localStorage
 * @param {Array} topics
 * @returns {boolean}
 */
export const saveTopicsToStorage = (topics) => {
  try {
    if (topics.length > 0) {
      localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics))
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOPICS)
    }
    return true
  } catch (e) {
    console.error('儲存 topics 失敗:', e)
    return false
  }
}

// ========== Groups 儲存 ==========

/**
 * 從 localStorage 讀取 Groups
 * @returns {Array|null}
 */
export const loadGroupsFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GROUPS)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('讀取 groups 失敗:', e)
  }
  return null
}

/**
 * 儲存 Groups 到 localStorage
 * @param {Array} groups
 * @returns {boolean}
 */
export const saveGroupsToStorage = (groups) => {
  try {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups))
    return true
  } catch (e) {
    console.error('儲存 groups 失敗:', e)
    return false
  }
}

/**
 * 取得預設群組
 * @returns {Array}
 */
export const getDefaultGroups = () => [{
  id: 'group-1',
  name: '第 1 組',
  images: Array(DEFAULT_GROUP_SIZE).fill(null)
}]

// ========== 清除資料 ==========

/**
 * 清除所有資料
 */
export const clearAllStorage = () => {
  localStorage.removeItem(STORAGE_KEYS.GROUPS)
  localStorage.removeItem(STORAGE_KEYS.TOPICS)
  localStorage.removeItem(STORAGE_KEYS.IMAGES)
}
