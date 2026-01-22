import { useRef, useState } from 'react'
import ImageGrid from './ImageGrid'

function SetupPage({ gameState }) {
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
  } = gameState

  const [showTopicPicker, setShowTopicPicker] = useState(false)

  const singleInputRef = useRef(null)
  const currentEditIndex = useRef(null)

  const currentGroup = groups.find(g => g.id === currentGroupId) || groups[0]

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
        {/* 從主題匯入 */}
        <button
          onClick={() => setShowTopicPicker(true)}
          disabled={topics.length === 0}
          className={`w-full py-4 text-base flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 ${
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
            className="flex-1 py-3 text-sm flex items-center justify-center gap-2 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <span>🔀</span>
            隨機打亂
          </button>
          <button
            onClick={shuffleAllGroups}
            className="flex-1 py-3 text-sm flex items-center justify-center gap-2 rounded-xl font-semibold bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
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
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      importFromTopic(currentGroupId, topic.id)
                      setShowTopicPicker(false)
                    }}
                    disabled={topic.images.length === 0}
                    className={`p-4 rounded-xl text-left transition-all duration-300 ${
                      topic.images.length === 0
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'bg-white hover:bg-indigo-50 hover:shadow-md border border-gray-100 hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{topic.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        topic.images.length === 0
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        {topic.images.length} 張
                      </span>
                    </div>
                  </button>
                ))}
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
