/**
 * 通用 Modal 元件
 * @param {boolean} isOpen - 是否顯示
 * @param {function} onClose - 關閉回調
 * @param {string} title - 標題
 * @param {React.ReactNode} children - 內容
 * @param {string} maxWidth - 最大寬度 class (預設 max-w-sm)
 */
function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-sm' }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`glass-card-elevated rounded-2xl p-6 w-full ${maxWidth} max-h-[80vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold gradient-text">{title}</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export default Modal
