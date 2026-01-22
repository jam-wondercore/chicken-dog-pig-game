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
    <div className="max-w-[500px] mx-auto px-6">
      {/* 組別標籤 */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {groups.map((group, index) => (
          <button
            key={group.id}
            onClick={() => setCurrentGroupId(group.id)}
            className={`py-2.5 px-2 rounded-lg font-bold text-xs transition-all duration-200 ${
              currentGroupId === group.id
                ? 'text-white shadow-lg transform -translate-y-1 scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:scale-102'
            }`}
            style={currentGroupId === group.id ? { backgroundColor: 'var(--secondary-color)' } : {}}
          >
            第{index + 1}組
          </button>
        ))}
        {groups.length < 10 && (
          <button
            onClick={addGroup}
            className="py-2.5 px-2 rounded-lg font-bold text-xs bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            + 新增
          </button>
        )}
      </div>

      {/* 圖片網格 */}
      <div className="mb-8">
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
      <div className="flex flex-col gap-4">
        <button
          onClick={() => batchInputRef.current?.click()}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
        >
          <span className="text-xl">📤</span>
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

        {groups.length > 1 && (
          <button
            onClick={() => deleteGroup(currentGroupId)}
            className="w-full py-3 rounded-xl bg-white hover:bg-red-50 text-red-600 font-medium text-sm border-2 border-red-200 hover:border-red-300 transition-all duration-200 flex items-center justify-center gap-2 mt-6"
          >
            <span>🗑</span>
            刪除此組
          </button>
        )}

        <button
          onClick={clearAllData}
          className="w-full py-3 rounded-xl bg-white hover:bg-red-50 text-red-500 font-medium text-sm border-2 border-red-200 hover:border-red-300 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span>🗑</span>
          清除所有組別照片
        </button>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 py-3 px-5 rounded-r-xl text-gray-800 font-medium text-sm mt-2 flex items-center gap-2">
          <span className="text-blue-600 text-lg">✏️</span>
          <span>
            正在編輯第 <span className="font-bold text-blue-600 text-base">{groups.findIndex(g => g.id === currentGroupId) + 1}</span> 組
          </span>
        </div>
      </div>
    </div>
  )
}

export default SetupPage
