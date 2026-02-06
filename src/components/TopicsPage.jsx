import { useRef, useState, useCallback } from 'react'
import useDragAndDrop from '../hooks/useDragAndDrop'

function TopicsPage({ gameState }) {
  const {
    topics,
    currentTopicId,
    setCurrentTopicId,
    addTopic,
    deleteTopic,
    renameTopic,
    batchAddImagesToTopic,
    deleteImageFromTopic,
    getTopicImages,
    reorderTopics,
    reorderTopicImages,
  } = gameState

  const fileInputRef = useRef(null)
  const uploadTopicIdRef = useRef(null)
  const [isAddingTopic, setIsAddingTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [editingTopicId, setEditingTopicId] = useState(null)
  const [editingName, setEditingName] = useState('')

  // 主題拖拽（垂直排列）
  const topicDrag = useDragAndDrop({ onReorder: reorderTopics })

  // 圖片拖拽（水平排列，需要追蹤 topicId）
  const [activeImageTopicId, setActiveImageTopicId] = useState(null)
  const handleImageReorder = useCallback((fromIndex, toIndex) => {
    if (activeImageTopicId) {
      reorderTopicImages(activeImageTopicId, fromIndex, toIndex)
    }
  }, [activeImageTopicId, reorderTopicImages])
  const imageDrag = useDragAndDrop({ onReorder: handleImageReorder })

  const handleAddTopic = () => {
    if (newTopicName.trim()) {
      addTopic(newTopicName.trim())
      setNewTopicName('')
      setIsAddingTopic(false)
    }
  }

  const handleToggleTopic = (topicId) => {
    if (currentTopicId === topicId) {
      setCurrentTopicId(null)
    } else {
      setCurrentTopicId(topicId)
    }
  }

  const handleStartRename = (e, topic) => {
    e.stopPropagation()
    setEditingTopicId(topic.id)
    setEditingName(topic.name)
  }

  const handleRename = (e) => {
    e.stopPropagation()
    if (editingName.trim() && editingTopicId) {
      renameTopic(editingTopicId, editingName.trim())
      setEditingTopicId(null)
      setEditingName('')
    }
  }

  const handleDeleteTopic = (e, topicId) => {
    e.stopPropagation()
    if (confirm('確定要刪除此主題？所有圖片將會被刪除。')) {
      deleteTopic(topicId)
    }
  }

  const handleUploadClick = (e, topicId) => {
    e.stopPropagation()
    uploadTopicIdRef.current = topicId
    fileInputRef.current?.click()
  }

  const handleUploadImages = (e) => {
    const files = e.target.files
    if (files && files.length > 0 && uploadTopicIdRef.current) {
      batchAddImagesToTopic(uploadTopicIdRef.current, files)
    }
    e.target.value = ''
  }

  return (
    <div className="max-w-135 mx-auto px-4">
      {/* 標題列 */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold gradient-text">主題庫</h2>
        {!isAddingTopic && (
          <button
            onClick={() => setIsAddingTopic(true)}
            className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            }}
          >
            + 新增主題
          </button>
        )}
      </div>

      {/* 新增主題表單 */}
      {isAddingTopic && (
        <div className="glass-card-elevated p-4 sm:p-5 rounded-2xl mb-4 sm:mb-5">
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            placeholder="輸入主題名稱"
            className="input-modern mb-3 sm:mb-4"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
          />
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleAddTopic}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300"
            >
              確認
            </button>
            <button
              onClick={() => { setIsAddingTopic(false); setNewTopicName('') }}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-300"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 隱藏的檔案上傳 input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleUploadImages}
        className="hidden"
      />

      {/* 主題列表 - 垂直排列 */}
      {topics.length === 0 ? (
        <div className="glass-card-elevated p-6 sm:p-10 rounded-2xl text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl">📁</span>
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium mb-1">尚未建立任何主題</p>
          <p className="text-xs sm:text-sm text-gray-400">點擊「+ 新增主題」開始建立主題庫</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {topics.map((topic, topicIndex) => {
            const isExpanded = currentTopicId === topic.id
            const isEditing = editingTopicId === topic.id
            const isDragging = topicDrag.draggedIndex === topicIndex

            return (
              <div key={topic.id} className="relative">
                {/* 上方插入指示線 */}
                <div
                  className={`absolute left-4 right-4 top-0 -translate-y-1/2 h-1 rounded-full z-10 transition-opacity duration-150 ${
                    topicDrag.shouldShowDropIndicator(topicIndex) ? 'bg-indigo-500 opacity-100' : 'opacity-0'
                  }`}
                />
                <div
                  {...(isEditing ? {} : topicDrag.getDragItemPropsVertical(topicIndex))}
                  className={`rounded-2xl overflow-hidden transition-all duration-300 my-1 ${
                    isExpanded
                      ? 'glass-card-elevated ring-2 ring-indigo-400/50'
                      : 'glass-card hover:shadow-lg'
                  } ${isDragging ? 'opacity-50 scale-95' : ''}`}
                >
                {/* Topic Header */}
                <div
                  onClick={() => !isEditing && handleToggleTopic(topic.id)}
                  className={`p-3 sm:p-4 cursor-pointer flex items-center justify-between transition-all duration-300 ${
                    isExpanded
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white'
                      : 'hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {/* 拖拽把手 */}
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing ${
                        isExpanded ? 'text-white/60' : 'text-gray-400'
                      }`}
                      title="拖拽排序"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
                      </svg>
                    </div>
                    {/* 展開/收合圖示 */}
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        isExpanded ? 'bg-white/20 rotate-90' : 'bg-gray-100'
                      }`}
                    >
                      <span className={`text-[10px] sm:text-xs ${isExpanded ? 'text-white' : 'text-gray-500'}`}>▶</span>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-3 py-1.5 border-0 rounded-lg text-gray-700 text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(e)}
                        />
                        <button
                          onClick={handleRename}
                          className="px-3 py-1.5 text-xs bg-white/20 text-white rounded-lg hover:bg-white/30 font-medium"
                        >
                          儲存
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingTopicId(null) }}
                          className="px-3 py-1.5 text-xs bg-white/10 text-white/80 rounded-lg hover:bg-white/20 font-medium"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-semibold truncate text-sm sm:text-base">{topic.name}</div>
                        <div
                          className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                            isExpanded ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {(topic.imageIds || []).length} 張
                        </div>
                      </>
                    )}
                  </div>

                  {/* 操作按鈕 */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={(e) => handleUploadClick(e, topic.id)}
                        className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-lg font-medium transition-all duration-200 ${
                          isExpanded
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
                        }`}
                      >
                        上傳
                      </button>
                      <button
                        onClick={(e) => handleStartRename(e, topic)}
                        className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-lg font-medium transition-all duration-200 ${
                          isExpanded
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        編輯
                      </button>
                      <button
                        onClick={(e) => handleDeleteTopic(e, topic.id)}
                        className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-lg font-medium transition-all duration-200 ${
                          isExpanded
                            ? 'bg-rose-400/80 hover:bg-rose-400 text-white'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                        }`}
                      >
                        刪除
                      </button>
                    </div>
                  )}
                </div>

                {/* Topic Images - 展開時顯示 */}
                {isExpanded && (
                  <div className="p-3 sm:p-4 bg-white/50">
                    {(topic.imageIds || []).length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                          <span className="text-xl sm:text-2xl">🖼️</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400">此主題尚未有圖片</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                        {getTopicImages(topic.id).map((image, index) => {
                          const isImageDragging = activeImageTopicId === topic.id && imageDrag.draggedIndex === index
                          const imageProps = imageDrag.getDragItemProps(index)

                          return (
                            <div key={`${topic.id}-${index}`} className="relative p-1">
                              {/* 左側插入指示線 */}
                              <div
                                className={`absolute left-0 top-2 bottom-2 w-1 rounded-full z-10 transition-opacity duration-150 ${
                                  activeImageTopicId === topic.id && imageDrag.shouldShowDropIndicator(index) ? 'bg-indigo-500 opacity-100' : 'opacity-0'
                                }`}
                              />
                              <div
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation()
                                  setActiveImageTopicId(topic.id)
                                  imageProps.onDragStart(e)
                                }}
                                onDragOver={(e) => { e.stopPropagation(); imageProps.onDragOver(e) }}
                                onDragLeave={(e) => { e.stopPropagation(); imageProps.onDragLeave(e) }}
                                onDrop={(e) => { e.stopPropagation(); imageProps.onDrop(e) }}
                                onDragEnd={imageProps.onDragEnd}
                                className={`relative aspect-square rounded-xl overflow-hidden group cursor-grab active:cursor-grabbing border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                                  isImageDragging
                                    ? 'opacity-50 scale-95 border-gray-300'
                                    : 'border-gray-100 hover:border-indigo-300'
                                }`}
                              >
                                {image ? (
                                  <img
                                    src={image}
                                    alt={`圖片 ${index + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    draggable={false}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">載入中</span>
                                  </div>
                                )}
                                {/* 刪除按鈕 */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    deleteImageFromTopic(topic.id, index)
                                  }}
                                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500 transition-all duration-200 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                              {/* 右側插入指示線 */}
                              <div
                                className={`absolute right-0 top-2 bottom-2 w-1 rounded-full z-10 transition-opacity duration-150 ${
                                  activeImageTopicId === topic.id && imageDrag.shouldShowDropIndicator(index + 1) ? 'bg-indigo-500 opacity-100' : 'opacity-0'
                                }`}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
                </div>
                {/* 下方插入指示線 */}
                <div
                  className={`absolute left-4 right-4 bottom-0 translate-y-1/2 h-1 rounded-full z-10 transition-opacity duration-150 ${
                    topicDrag.shouldShowDropIndicator(topicIndex + 1) ? 'bg-indigo-500 opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TopicsPage
