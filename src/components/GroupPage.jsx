import { useRef, useState } from 'react'
import ImageGrid from './ImageGrid'
import { GRID_MODES, MAX_GROUPS } from '../constants'

function GroupPage({ gameState }) {
  const {
    groups,
    currentGroupId,
    setCurrentGroupId,
    addGroup,
    deleteGroup,
    updateGroupImage,
    clearAllData,
    topics,
    importFromTopic,
    shuffleGroup,
    shuffleAllGroups,
    reorderGroups,
    getGroupImages,
  } = gameState

  const [showTopicPicker, setShowTopicPicker] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dropPosition, setDropPosition] = useState(null) // 插入位置 (0 到 groups.length)

  const singleInputRef = useRef(null)
  const currentEditIndex = useRef(null)

  const currentGroup = groups.find(g => g.id === currentGroupId) || groups[0]

  // 拖曳開始
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  // 拖曳結束
  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDropPosition(null)
  }

  const handleSingleUpload = (index) => {
    currentEditIndex.current = index
    singleInputRef.current?.click()
  }

  const handleSingleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && currentEditIndex.current !== null) {
      // 直接傳 File 對象，讓 useGameState 統一處理壓縮和儲存
      updateGroupImage(currentGroupId, currentEditIndex.current, file)
    }
    e.target.value = ''
  }

  // 取得當前組別的圖片 base64（用於顯示）
  const currentGroupImages = getGroupImages(currentGroupId)

  return (
    <div className="max-w-135 mx-auto px-4">
      {/* 組別標籤 */}
      <div className="glass-card p-3 rounded-2xl mb-6">
        <div className="flex flex-wrap justify-center items-center gap-y-2">
          {groups.map((group, index) => {
            const isActive = currentGroupId === group.id
            const isDragging = draggedIndex === index
            const showDropBefore = dropPosition === index
            const showDropAfter = dropPosition === index + 1
            return (
              <div key={group.id} className="relative">
                {/* 左側插入指示線 */}
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-8 rounded-full z-10 transition-opacity duration-150 ${
                    draggedIndex !== null && showDropBefore ? 'bg-indigo-500 opacity-100' : 'opacity-0'
                  }`}
                />
                <button
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => {
                    e.preventDefault()
                    const rect = e.currentTarget.getBoundingClientRect()
                    const relativeX = (e.clientX - rect.left) / rect.width
                    // 左側 40% 觸發前方插入，右側 40% 觸發後方插入
                    let pos = null
                    if (relativeX < 0.4) {
                      pos = index
                    } else if (relativeX > 0.6) {
                      pos = index + 1
                    }
                    if (pos !== null && draggedIndex !== null && pos !== draggedIndex && pos !== draggedIndex + 1) {
                      setDropPosition(pos)
                    } else {
                      setDropPosition(null)
                    }
                  }}
                  onDragLeave={() => setDropPosition(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (dropPosition !== null && draggedIndex !== null) {
                      const targetIndex = dropPosition > draggedIndex ? dropPosition - 1 : dropPosition
                      reorderGroups(draggedIndex, targetIndex)
                    }
                    setDraggedIndex(null)
                    setDropPosition(null)
                  }}
                  onClick={() => setCurrentGroupId(group.id)}
                  className={`relative px-2 py-1.5 sm:px-4 sm:py-2 mx-0.5 sm:mx-1.5 rounded-lg sm:rounded-xl font-semibold text-[10px] sm:text-xs transition-all duration-300 cursor-grab active:cursor-grabbing ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-500 hover:text-indigo-600 bg-white/50 hover:bg-white border border-gray-200/50 hover:border-indigo-200'
                  } ${isDragging ? 'opacity-50 scale-95' : ''}`}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg" />
                  )}
                  <span className="relative">第{index + 1}組</span>
                </button>
                {/* 右側插入指示線 */}
                <div
                  className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-1 h-8 rounded-full z-10 transition-opacity duration-150 ${
                    draggedIndex !== null && showDropAfter ? 'bg-indigo-500 opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            )
          })}
          {groups.length < MAX_GROUPS && (
            <button
              onClick={addGroup}
              className="px-2 py-1.5 sm:px-4 sm:py-2 ml-0.5 sm:ml-1 rounded-lg sm:rounded-xl font-semibold text-[10px] sm:text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              + 新增
            </button>
          )}
        </div>
      </div>

      {/* 圖片網格 */}
      <div className="mb-6">
        <ImageGrid
          images={currentGroupImages}
          onImageClick={handleSingleUpload}
          mode={GRID_MODES.SETUP}
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
        {/* 從主題匯入 */}
        <button
          onClick={() => setShowTopicPicker(true)}
          disabled={topics.length === 0}
          className={`w-full py-3 sm:py-4 text-sm sm:text-base flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 ${
            topics.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
          }`}
        >
          <span className="text-lg">📥</span>
          從主題匯入
        </button>

        {/* 打亂按鈕 */}
        <div className="flex gap-3">
          <button
            onClick={() => shuffleGroup(currentGroupId)}
            className="flex-1 py-2.5 sm:py-3 text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <span>🔀</span>
            隨機打亂
          </button>
          <button
            onClick={shuffleAllGroups}
            className="flex-1 py-2.5 sm:py-3 text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-semibold bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <span>🔀</span>
            打亂全部
          </button>
        </div>

        {/* 主題選擇器 Modal */}
        {showTopicPicker && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card-elevated rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold gradient-text">選擇主題</h3>
                <button
                  onClick={() => setShowTopicPicker(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                將從選擇的主題中隨機匯入 8 張圖片到目前的組別
              </p>
              <div className="flex flex-col gap-2">
                {topics.map((topic) => {
                  const imageCount = (topic.imageIds || []).length
                  return (
                    <button
                      key={topic.id}
                      onClick={() => {
                        importFromTopic(currentGroupId, topic.id)
                        setShowTopicPicker(false)
                      }}
                      disabled={imageCount === 0}
                      className={`p-4 rounded-xl text-left transition-all duration-300 ${
                        imageCount === 0
                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'bg-white hover:bg-indigo-50 hover:shadow-md border border-gray-100 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{topic.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          imageCount === 0
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-indigo-100 text-indigo-600'
                        }`}>
                          {imageCount} 張
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
              {topics.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>尚未建立任何主題</p>
                  <p className="text-sm mt-1">請先到主題庫新增主題</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          {groups.length > 1 && (
            <button
              onClick={() => deleteGroup(currentGroupId)}
              className="btn-danger flex-1 py-2.5 sm:py-3 text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <span>🗑️</span>
              刪除此組
            </button>
          )}

          <button
            onClick={clearAllData}
            className="btn-danger flex-1 py-2.5 sm:py-3 text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2"
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

export default GroupPage
