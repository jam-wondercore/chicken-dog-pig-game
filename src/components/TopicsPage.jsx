import { useRef, useState } from 'react'

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
  } = gameState

  const fileInputRef = useRef(null)
  const uploadTopicIdRef = useRef(null)
  const [isAddingTopic, setIsAddingTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [editingTopicId, setEditingTopicId] = useState(null)
  const [editingName, setEditingName] = useState('')

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
    <div className="max-w-[600px] mx-auto px-4">
      {/* 標題列 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold gradient-text">主題庫</h2>
        {!isAddingTopic && (
          <button
            onClick={() => setIsAddingTopic(true)}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 hover:-translate-y-0.5"
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
        <div className="glass-card-elevated p-5 rounded-2xl mb-5">
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            placeholder="輸入主題名稱"
            className="input-modern mb-4"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
          />
          <div className="flex gap-3">
            <button
              onClick={handleAddTopic}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300"
            >
              確認
            </button>
            <button
              onClick={() => { setIsAddingTopic(false); setNewTopicName('') }}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-300"
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
        <div className="glass-card-elevated p-10 rounded-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <span className="text-3xl">📁</span>
          </div>
          <p className="text-gray-600 font-medium mb-1">尚未建立任何主題</p>
          <p className="text-sm text-gray-400">點擊「+ 新增主題」開始建立主題庫</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map((topic) => {
            const isExpanded = currentTopicId === topic.id
            const isEditing = editingTopicId === topic.id

            return (
              <div
                key={topic.id}
                className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                  isExpanded
                    ? 'glass-card-elevated ring-2 ring-indigo-400/50'
                    : 'glass-card hover:shadow-lg'
                }`}
              >
                {/* Topic Header */}
                <div
                  onClick={() => !isEditing && handleToggleTopic(topic.id)}
                  className={`p-4 cursor-pointer flex items-center justify-between transition-all duration-300 ${
                    isExpanded
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white'
                      : 'hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* 展開/收合圖示 */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        isExpanded ? 'bg-white/20 rotate-90' : 'bg-gray-100'
                      }`}
                    >
                      <span className={`text-xs ${isExpanded ? 'text-white' : 'text-gray-500'}`}>▶</span>
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
                        <div className="font-semibold truncate">{topic.name}</div>
                        <div
                          className={`text-xs px-2 py-0.5 rounded-full ${
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleUploadClick(e, topic.id)}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
                          isExpanded
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
                        }`}
                      >
                        上傳
                      </button>
                      <button
                        onClick={(e) => handleStartRename(e, topic)}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
                          isExpanded
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        編輯
                      </button>
                      <button
                        onClick={(e) => handleDeleteTopic(e, topic.id)}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
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
                  <div className="p-4 bg-white/50">
                    {(topic.imageIds || []).length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                          <span className="text-2xl">🖼️</span>
                        </div>
                        <p className="text-sm text-gray-400">此主題尚未有圖片</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {getTopicImages(topic.id).map((image, index) => (
                          <div
                            key={`${topic.id}-${index}`}
                            className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer border-2 border-gray-100 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                          >
                            {image ? (
                              <img
                                src={image}
                                alt={`圖片 ${index + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
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
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TopicsPage
