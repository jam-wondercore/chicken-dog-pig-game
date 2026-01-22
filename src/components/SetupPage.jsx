import { useRef } from 'react'
import ImageGrid from './ImageGrid'

function SetupPage({ gameState }) {
  const {
    groups,
    currentGroupId,
    setCurrentGroupId,
    addGroup,
    deleteGroup,
    updateGroupImage,
    batchUploadImages,
    clearAllData,
  } = gameState

  const batchInputRef = useRef(null)
  const singleInputRef = useRef(null)
  const currentEditIndex = useRef(null)

  const currentGroup = groups.find(g => g.id === currentGroupId) || groups[0]

  const handleBatchUpload = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      batchUploadImages(currentGroupId, files)
    }
    e.target.value = ''
  }

  const handleSingleUpload = (index) => {
    currentEditIndex.current = index
    singleInputRef.current?.click()
  }

  const handleSingleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && currentEditIndex.current !== null) {
      const reader = new FileReader()
      reader.onload = (event) => {
        updateGroupImage(currentGroupId, currentEditIndex.current, event.target.result)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  return (
    <div className="max-w-[520px] mx-auto px-4">
      {/* 組別標籤 */}
      <div className="glass-card p-3 rounded-2xl mb-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {groups.map((group, index) => {
            const isActive = currentGroupId === group.id
            return (
              <button
                key={group.id}
                onClick={() => setCurrentGroupId(group.id)}
                className={`relative px-4 py-2 rounded-xl font-semibold text-xs transition-all duration-300 ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-500 hover:text-indigo-600 bg-white/50 hover:bg-white border border-gray-200/50 hover:border-indigo-200'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg" />
                )}
                <span className="relative">第{index + 1}組</span>
              </button>
            )
          })}
          {groups.length < 10 && (
            <button
              onClick={addGroup}
              className="px-4 py-2 rounded-xl font-semibold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              + 新增
            </button>
          )}
        </div>
      </div>

      {/* 圖片網格 */}
      <div className="mb-6">
        <ImageGrid
          images={currentGroup.images}
          onImageClick={handleSingleUpload}
          mode="setup"
        />
        <input
          ref={singleInputRef}
          type="file"
          accept="image/*"
          onChange={handleSingleFileChange}
          className="hidden"
        />
      </div>

      {/* 操作按鈕 */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => batchInputRef.current?.click()}
          className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
        >
          <span className="text-lg">📤</span>
          批次上傳圖片
        </button>
        <input
          ref={batchInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleBatchUpload}
          className="hidden"
        />

        <div className="flex gap-3 mt-4">
          {groups.length > 1 && (
            <button
              onClick={() => deleteGroup(currentGroupId)}
              className="btn-danger flex-1 py-3 text-sm flex items-center justify-center gap-2"
            >
              <span>🗑️</span>
              刪除此組
            </button>
          )}

          <button
            onClick={clearAllData}
            className="btn-danger flex-1 py-3 text-sm flex items-center justify-center gap-2"
          >
            <span>🗑️</span>
            清除全部
          </button>
        </div>

        {/* Status Badge */}
        <div className="status-badge justify-center mt-4 border border-indigo-100">
          <span className="text-indigo-500">✏️</span>
          <span className="text-gray-600">
            正在編輯
            <span className="font-bold text-indigo-600 mx-1">
              第 {groups.findIndex(g => g.id === currentGroupId) + 1} 組
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default SetupPage
