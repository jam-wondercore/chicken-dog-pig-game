/**
 * Fisher-Yates 打亂演算法
 * 正確且高效的陣列隨機打亂方法
 * @param {Array} array - 要打亂的陣列
 * @returns {Array} 打亂後的新陣列（不修改原陣列）
 */
export const fisherYatesShuffle = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 從陣列中隨機選取指定數量的元素
 * @param {Array} array - 來源陣列
 * @param {number} count - 要選取的數量
 * @returns {Array} 選取的元素陣列
 */
export const randomPick = (array, count) => {
  const shuffled = fisherYatesShuffle(array)
  return shuffled.slice(0, count)
}

/**
 * 從陣列中隨機選取元素，如果不足則重複選取
 * @param {Array} array - 來源陣列
 * @param {number} count - 需要的數量
 * @returns {Array} 選取的元素陣列（長度為 count）
 */
export const randomPickWithRepeat = (array, count) => {
  if (array.length === 0) return []

  const shuffled = fisherYatesShuffle(array)
  const result = []

  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length])
  }

  return result
}
