// 圖片儲存管理模組
// 所有圖片統一存在 localStorage，使用 imageId 作為 key

import { IMAGE_SETTINGS } from '../constants'

const IMAGE_STORAGE_KEY = 'chicken-dog-pig-images'

// 驗證檔案格式和大小
export const validateImageFile = (file) => {
  if (!IMAGE_SETTINGS.ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `不支援的圖片格式：${file.type}` }
  }
  if (file.size > IMAGE_SETTINGS.MAX_FILE_SIZE) {
    const maxMB = IMAGE_SETTINGS.MAX_FILE_SIZE / (1024 * 1024)
    return { valid: false, error: `圖片大小超過 ${maxMB}MB 限制` }
  }
  return { valid: true }
}

// 壓縮圖片
export const compressImage = (dataUrl, quality = 0.5, maxWidth = 500) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

// 生成圖片 ID
export const generateImageId = () => `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// 讀取所有圖片資料
export const loadAllImages = () => {
  try {
    const data = localStorage.getItem(IMAGE_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('讀取圖片庫失敗:', e)
  }
  return {}
}

// 查找已存在的相同圖片
const findExistingImage = (images, dataUrl) => {
  for (const [id, data] of Object.entries(images)) {
    if (data === dataUrl) return id
  }
  return null
}

// 儲存所有圖片資料
const saveAllImages = (images) => {
  try {
    localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images))
    return true
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.error('localStorage 空間不足')
      alert('儲存空間不足，請刪除一些圖片後重試。')
    }
    return false
  }
}

// 儲存單張圖片（先壓縮，若已存在則返回現有 ID）
export const saveImage = async (dataUrl, quality = 0.5, maxWidth = 500) => {
  const compressed = await compressImage(dataUrl, quality, maxWidth)
  const images = loadAllImages()

  // 檢查是否已存在相同圖片
  const existingId = findExistingImage(images, compressed)
  if (existingId) return existingId

  const imageId = generateImageId()
  images[imageId] = compressed

  if (saveAllImages(images)) {
    return imageId
  }
  return null
}

// 批次儲存圖片（若已存在則返回現有 ID）
export const saveImages = async (files, quality = 0.5, maxWidth = 500) => {
  const imageIds = []
  const images = loadAllImages()

  for (const file of Array.from(files)) {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      console.warn(`跳過檔案 ${file.name}：${validation.error}`)
      continue
    }

    const dataUrl = await readFileAsDataUrl(file)
    const compressed = await compressImage(dataUrl, quality, maxWidth)

    // 檢查是否已存在相同圖片
    const existingId = findExistingImage(images, compressed)
    if (existingId) {
      imageIds.push(existingId)
      continue
    }

    const imageId = generateImageId()
    images[imageId] = compressed
    imageIds.push(imageId)
  }

  if (saveAllImages(images)) {
    return imageIds
  }
  return []
}

// 讀取檔案為 DataURL
const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 取得圖片 base64
export const getImage = (imageId) => {
  if (!imageId) return null
  const images = loadAllImages()
  return images[imageId] || null
}

// 批次取得圖片
export const getImages = (imageIds) => {
  const images = loadAllImages()
  return imageIds.map(id => id ? (images[id] || null) : null)
}

// 刪除圖片
export const deleteImage = (imageId) => {
  if (!imageId) return
  const images = loadAllImages()
  delete images[imageId]
  saveAllImages(images)
}

// 批次刪除圖片
export const deleteImages = (imageIds) => {
  const images = loadAllImages()
  imageIds.forEach(id => {
    if (id) delete images[id]
  })
  saveAllImages(images)
}

// 清除所有圖片
export const clearAllImages = () => {
  localStorage.removeItem(IMAGE_STORAGE_KEY)
}

// 清理未使用的圖片（垃圾回收）
export const cleanupUnusedImages = (usedImageIds) => {
  const images = loadAllImages()
  const usedSet = new Set(usedImageIds.filter(Boolean))

  let cleaned = false
  Object.keys(images).forEach(id => {
    if (!usedSet.has(id)) {
      delete images[id]
      cleaned = true
    }
  })

  if (cleaned) {
    saveAllImages(images)
  }
}
