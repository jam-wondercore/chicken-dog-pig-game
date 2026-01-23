/**
 * 格式化檔案大小
 * @param {number} bytes - 位元組數
 * @returns {string} 格式化後的大小字串
 */
export const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * 格式化日期為 ISO 格式 (YYYY-MM-DD)
 * @param {Date} date - 日期物件
 * @returns {string} 格式化後的日期字串
 */
export const formatDateISO = (date = new Date()) => {
  return date.toISOString().slice(0, 10)
}

/**
 * 格式化日期時間
 * @param {Date} date - 日期物件
 * @returns {string} 格式化後的日期時間字串
 */
export const formatDateTime = (date = new Date()) => {
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
