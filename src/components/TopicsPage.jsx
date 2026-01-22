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

  const handleDeleteImage = (e, topicId, imageIndex) => {
    e.stopPropagation()
    deleteImageFromTopic(topicId, imageIndex)
  }

  return (
    <div className="max-w-[600px] mx-auto px-6">
      {/* 標題列 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-700">圖片庫</h2>
        {!isAddingTopic && (
          <button
            onClick={() => setIsAddingTopic(true)}
            className="px-4 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            + 新增主題
          </button>
        )}
      </div>

      {/* 新增主題表單 */}
      {isAddingTopic && (
        <div className="bg-white p-4 rounded-xl shadow-md mb-4">
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            placeholder="輸入主題名稱"
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg mb-3 focus:border-blue-400 focus:outline-none"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddTopic}
              className="px-4 py-2 rounded-lg font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all"
            >
              確認
            </button>
            <button
              onClick={() => { setIsAddingTopic(false); setNewTopicName('') }}
              className="px-4 py-2 rounded-lg font-medium text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
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
        <div className="bg-white p-8 rounded-xl shadow-md text-center text-gray-500">
          <span className="text-4xl mb-3 block">📁</span>
          <p>尚未建立任何主題</p>
          <p className="text-sm mt-1">點擊「+ 新增主題」開始建立圖片庫</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map((topic) => {
            const isExpanded = currentTopicId === topic.id
            const isEditing = editingTopicId === topic.id

            return (
              <div
                key={topic.id}
                className={`rounded-xl overflow-hidden transition-all duration-300 ${
                  isExpanded
                    ? 'bg-white shadow-lg border-2 border-blue-400'
                    : 'bg-white shadow-md border-2 border-gray-200 hover:border-blue-300'
                }`}
              >
                {/* Topic Header */}
                <div
                  onClick={() => !isEditing && handleToggleTopic(topic.id)}
                  className={`p-4 cursor-pointer flex items-center justify-between transition-all duration-200 ${
                    isExpanded ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* 展開/收合圖示 */}
                    <span className={`text-lg transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>

                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-2 py-1 border rounded text-gray-700 text-sm"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(e)}
                        />
                        <button
                          onClick={handleRename}
                          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          儲存
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingTopicId(null) }}
                          className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-bold truncate">{topic.name}</div>
                        <div className={`text-sm ${isExpanded ? 'text-white/80' : 'text-gray-500'}`}>
                          ({topic.images.length} 張)
                        </div>
                      </>
                    )}
                  </div>

                  {/* 操作按鈕 */}
                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleUploadClick(e, topic.id)}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                          isExpanded
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                        }`}
                      >
                        上傳
                      </button>
                      <button
                        onClick={(e) => handleStartRename(e, topic)}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                          isExpanded
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        編輯
                      </button>
                      <button
                        onClick={(e) => handleDeleteTopic(e, topic.id)}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                          isExpanded
                            ? 'bg-red-400/80 hover:bg-red-400 text-white'
                            : 'bg-red-100 hover:bg-red-200 text-red-600'
                        }`}
                      >
                        刪除
                      </button>
                    </div>
                  )}
                </div>

                {/* Topic Images - 展開時顯示 */}
                {isExpanded && (
                  <div className="p-4 border-t border-gray-100">
                    {topic.images.length === 0 ? (
                      <div className="text-center text-gray-500 py-6">
                        <span className="text-3xl mb-2 block">🖼️</span>
                        <p className="text-sm">此主題尚未有圖片</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {topic.images.map((image, index) => (
                          <div
                            key={`${topic.id}-${index}-${image.substring(0, 50)}`}
                            className="relative aspect-square rounded-lg overflow-hidden shadow-sm group cursor-pointer"
                          >
                            <img
                              src={image}
                              alt={`圖片 ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            {/* 刪除按鈕 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                deleteImageFromTopic(topic.id, index)
                              }}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-sm shadow-md"
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
