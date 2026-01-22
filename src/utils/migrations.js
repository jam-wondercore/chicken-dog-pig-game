import { saveImage } from './imageStore'

/**
 * 遷移舊的 topics 資料（從 images base64 陣列轉換為 imageIds）
 * @param {Array} topics - 主題陣列
 * @returns {Promise<{topics: Array, migrated: boolean}>}
 */
export const migrateOldTopics = async (topics) => {
  let needsMigration = false

  const migratedTopics = await Promise.all(
    topics.map(async (topic) => {
      // 檢查是否是舊格式（有 images 但沒有 imageIds）
      if (topic.images && !topic.imageIds) {
        needsMigration = true
        const imageIds = []
        for (const base64 of topic.images) {
          if (base64 && typeof base64 === 'string' && base64.startsWith('data:')) {
            const imageId = await saveImage(base64)
            if (imageId) imageIds.push(imageId)
          }
        }
        // 返回新格式，移除舊的 images 欄位
        const { images, ...rest } = topic
        return { ...rest, imageIds }
      }
      return topic
    })
  )

  return { topics: migratedTopics, migrated: needsMigration }
}

/**
 * 遷移舊的 groups 資料（從 base64 轉換為 imageIds）
 * @param {Array} groups - 群組陣列
 * @returns {Promise<{groups: Array, migrated: boolean}>}
 */
export const migrateOldGroups = async (groups) => {
  let needsMigration = false

  const migratedGroups = await Promise.all(
    groups.map(async (group) => {
      // 檢查是否有 base64 格式的圖片
      const hasBase64 = group.images.some(img => img && typeof img === 'string' && img.startsWith('data:'))
      if (hasBase64) {
        needsMigration = true
        const newImages = await Promise.all(
          group.images.map(async (img) => {
            if (img && typeof img === 'string' && img.startsWith('data:')) {
              return await saveImage(img)
            }
            return img // null 或已經是 imageId
          })
        )
        return { ...group, images: newImages }
      }
      return group
    })
  )

  return { groups: migratedGroups, migrated: needsMigration }
}

/**
 * 檢查 topics 是否需要遷移
 * @param {Array} topics - 主題陣列
 * @returns {boolean}
 */
export const needsTopicsMigration = (topics) => {
  return topics.some(t => t.images && !t.imageIds)
}

/**
 * 檢查 groups 是否需要遷移
 * @param {Array} groups - 群組陣列
 * @returns {boolean}
 */
export const needsGroupsMigration = (groups) => {
  return groups.some(g =>
    g.images.some(img => img && typeof img === 'string' && img.startsWith('data:'))
  )
}
