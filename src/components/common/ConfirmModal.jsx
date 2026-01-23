import Modal from './Modal'

/**
 * 確認對話框元件
 * @param {boolean} isOpen - 是否顯示
 * @param {function} onClose - 關閉回調
 * @param {function} onConfirm - 確認回調
 * @param {string} title - 標題
 * @param {string} message - 訊息內容
 * @param {string} icon - 圖示 (預設 ⚠️)
 * @param {string} confirmText - 確認按鈕文字 (預設 確定)
 * @param {string} cancelText - 取消按鈕文字 (預設 取消)
 * @param {string} confirmVariant - 確認按鈕樣式 (danger | primary)
 */
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  icon = '⚠️',
  confirmText = '確定',
  cancelText = '取消',
  confirmVariant = 'danger',
}) {
  if (!isOpen) return null

  const confirmButtonClass = confirmVariant === 'danger'
    ? 'bg-rose-500 hover:bg-rose-600 text-white'
    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg'

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center mb-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
          <span className="text-3xl">{icon}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${confirmButtonClass}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmModal
