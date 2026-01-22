import { useState, useRef } from 'react'
import { loadAllImages, clearAllImages } from '../utils/imageStore'

const TOPICS_STORAGE_KEY = 'chicken-dog-pig-topics'
const GROUPS_STORAGE_KEY = 'chicken-dog-pig-groups'
const IMAGE_STORAGE_KEY = 'chicken-dog-pig-images'

// 估算 localStorage 使用量
const getStorageUsage = () => {
  let total = 0
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2 // UTF-16 每字元 2 bytes
    }
  }
  return total
}

// 格式化檔案大小
const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// 估算 localStorage 最大容量（通常是 5MB）
const MAX_STORAGE = 5 * 1024 * 1024

function DataPage({ gameState }) {
  const { groups, topics, runGarbageCollection } = gameState
  const fileInputRef = useRef(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  // 計算儲存使用量
  const storageUsed = getStorageUsage()
  const storagePercent = Math.min((storageUsed / MAX_STORAGE) * 100, 100)

  // 計算各項資料統計
  const images = loadAllImages()
  const imageCount = Object.keys(images).length
  const groupCount = groups.length
  const topicCount = topics.length
  const topicImageCount = topics.reduce((sum, t) => sum + (t.imageIds || []).length, 0)

  // 導出資料
  const handleExport = () => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      groups: JSON.parse(localStorage.getItem(GROUPS_STORAGE_KEY) || '[]'),
      topics: JSON.parse(localStorage.getItem(TOPICS_STORAGE_KEY) || '[]'),
      images: loadAllImages(),
    }

    const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rhythm-game-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 導入資料
  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // 驗證資料格式
      if (!data.version || !data.images) {
        throw new Error('無效的備份檔案格式')
      }

      // 計算導入資料大小
      const importSize = text.length * 2 // UTF-16
      const currentUsage = getStorageUsage()
      const availableSpace = MAX_STORAGE - currentUsage

      // 檢查容量
      if (importSize > availableSpace * 1.5) {
        // 留一些餘量
        const needSpace = formatSize(importSize)
        const haveSpace = formatSize(availableSpace)
        setImportResult({
          success: false,
          message: `儲存空間不足！需要約 ${needSpace}，目前只剩 ${haveSpace}。請先清理一些資料。`,
        })
        setImporting(false)
        return
      }

      // 確認覆蓋
      const confirmImport = confirm(
        '導入將會覆蓋現有的所有資料（組別、主題、圖片）。\n\n確定要繼續嗎？'
      )

      if (!confirmImport) {
        setImporting(false)
        return
      }

      // 覆蓋模式：先清除現有資料
      localStorage.removeItem(GROUPS_STORAGE_KEY)
      localStorage.removeItem(TOPICS_STORAGE_KEY)
      localStorage.removeItem(IMAGE_STORAGE_KEY)

      // 導入圖片
      const existingImages = {}

      for (const [oldId, base64] of Object.entries(data.images)) {
        existingImages[oldId] = base64
      }

      // 儲存圖片
      try {
        localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(existingImages))
      } catch (err) {
        if (err.name === 'QuotaExceededError' || err.code === 22) {
          setImportResult({
            success: false,
            message: '儲存空間不足！導入失敗。',
          })
          setImporting(false)
          return
        }
        throw err
      }

      // 導入 groups
      const importedGroups = (data.groups || []).map(group => ({
        ...group,
        images: group.images.map(id => id || null),
      }))

      const finalGroups = importedGroups
      if (finalGroups.length === 0) {
        finalGroups.push({
          id: 'group-1',
          name: '第 1 組',
          images: Array(8).fill(null),
        })
      }
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(finalGroups))

      // 導入 topics
      const importedTopics = (data.topics || []).map(topic => ({
        ...topic,
        imageIds: topic.imageIds || [],
      }))

      const finalTopics = importedTopics
      localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(finalTopics))

      setImportResult({
        success: true,
        message: `導入成功！\n` +
          `圖片：${Object.keys(data.images).length} 張\n` +
          `組別：${importedGroups.length} 組\n` +
          `主題：${importedTopics.length} 個\n\n` +
          `請重新整理頁面以載入新資料。`,
      })
    } catch (err) {
      console.error('導入失敗:', err)
      setImportResult({
        success: false,
        message: `導入失敗：${err.message}`,
      })
    }

    setImporting(false)
    e.target.value = ''
  }

  // 清除所有資料
  const handleClearAll = () => {
    localStorage.removeItem(GROUPS_STORAGE_KEY)
    localStorage.removeItem(TOPICS_STORAGE_KEY)
    clearAllImages()
    setShowConfirmClear(false)
    setImportResult({
      success: true,
      message: '已清除所有資料。請重新整理頁面。',
    })
  }

  // 執行垃圾回收
  const handleGarbageCollection = () => {
    runGarbageCollection()
    setImportResult({
      success: true,
      message: '垃圾回收完成！已清理未使用的圖片。',
    })
  }

  return (
    <div className="max-w-[520px] mx-auto px-4">
      {/* 儲存空間使用量 */}
      <div className="glass-card-elevated p-5 rounded-2xl mb-6">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span>📊</span> 儲存空間
        </h3>
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">已使用</span>
            <span className="font-semibold text-gray-700">
              {formatSize(storageUsed)} / {formatSize(MAX_STORAGE)}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                storagePercent > 80
                  ? 'bg-gradient-to-r from-rose-500 to-red-500'
                  : storagePercent > 50
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              }`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white/50 p-3 rounded-xl">
            <div className="text-gray-400 text-xs">圖片數量</div>
            <div className="font-bold text-gray-700">{imageCount} 張</div>
          </div>
          <div className="bg-white/50 p-3 rounded-xl">
            <div className="text-gray-400 text-xs">組別數量</div>
            <div className="font-bold text-gray-700">{groupCount} 組</div>
          </div>
          <div className="bg-white/50 p-3 rounded-xl">
            <div className="text-gray-400 text-xs">主題數量</div>
            <div className="font-bold text-gray-700">{topicCount} 個</div>
          </div>
          <div className="bg-white/50 p-3 rounded-xl">
            <div className="text-gray-400 text-xs">主題內圖片</div>
            <div className="font-bold text-gray-700">{topicImageCount} 張</div>
          </div>
        </div>
      </div>

      {/* 導出/導入按鈕 */}
      <div className="flex flex-col gap-3 mb-6">
        <button
          onClick={handleExport}
          className="w-full py-4 text-base flex items-center justify-center gap-2 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        >
          <span className="text-lg">📤</span>
          導出備份檔案
        </button>

        <button
          onClick={handleImport}
          disabled={importing}
          className={`w-full py-4 text-base flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 ${
            importing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
          }`}
        >
          <span className="text-lg">📥</span>
          {importing ? '導入中...' : '導入備份檔案'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* 導入結果提示 */}
      {importResult && (
        <div
          className={`p-4 rounded-xl mb-6 ${
            importResult.success
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-rose-50 border border-rose-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">{importResult.success ? '✅' : '❌'}</span>
            <p
              className={`text-sm whitespace-pre-line ${
                importResult.success ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {importResult.message}
            </p>
          </div>
          {importResult.success && importResult.message.includes('重新整理') && (
            <button
              onClick={() => window.location.reload()}
              className="mt-3 w-full py-2 rounded-lg bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors"
            >
              重新整理頁面
            </button>
          )}
        </div>
      )}

      {/* 工具區 */}
      <div className="glass-card p-5 rounded-2xl">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span>🛠️</span> 工具
        </h3>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGarbageCollection}
            className="w-full py-3 text-sm flex items-center justify-center gap-2 rounded-xl font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all duration-300"
          >
            <span>🧹</span>
            清理未使用的圖片
          </button>

          <button
            onClick={() => setShowConfirmClear(true)}
            className="w-full py-3 text-sm flex items-center justify-center gap-2 rounded-xl font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all duration-300"
          >
            <span>🗑️</span>
            清除所有資料
          </button>
        </div>
      </div>

      {/* 確認清除對話框 */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card-elevated rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">確定要清除所有資料？</h3>
              <p className="text-sm text-gray-500">
                這將會刪除所有組別、主題和圖片。此操作無法復原！
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-colors"
              >
                確定清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataPage
