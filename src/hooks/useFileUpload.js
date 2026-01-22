import { useRef, useCallback } from 'react'

/**
 * 檔案上傳 hook
 * @param {Object} options - 選項
 * @param {function} options.onFileSelect - 檔案選擇回調 (file) => void
 * @param {function} options.onFilesSelect - 多檔選擇回調 (files) => void
 * @param {string} options.accept - 接受的檔案類型 (預設 image/*)
 * @param {boolean} options.multiple - 是否允許多選 (預設 false)
 */
function useFileUpload({
  onFileSelect,
  onFilesSelect,
  accept = 'image/*',
  multiple = false,
} = {}) {
  const inputRef = useRef(null)
  const contextRef = useRef(null) // 用於存儲上傳上下文（如 index, id 等）

  /**
   * 觸發檔案選擇
   * @param {any} context - 可選的上下文資料
   */
  const triggerUpload = useCallback((context = null) => {
    contextRef.current = context
    inputRef.current?.click()
  }, [])

  /**
   * 處理檔案變更
   */
  const handleChange = useCallback((e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (multiple && onFilesSelect) {
      onFilesSelect(files, contextRef.current)
    } else if (onFileSelect) {
      onFileSelect(files[0], contextRef.current)
    }

    // 清除 input 值，允許重複選擇相同檔案
    e.target.value = ''
    contextRef.current = null
  }, [multiple, onFileSelect, onFilesSelect])

  /**
   * 取得 context
   */
  const getContext = useCallback(() => contextRef.current, [])

  /**
   * 渲染隱藏的 input 元素
   */
  const renderInput = useCallback(() => (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      multiple={multiple}
      onChange={handleChange}
      className="hidden"
    />
  ), [accept, multiple, handleChange])

  return {
    inputRef,
    triggerUpload,
    handleChange,
    getContext,
    renderInput,
    // 提供 props 讓使用者自己渲染 input
    inputProps: {
      ref: inputRef,
      type: 'file',
      accept,
      multiple,
      onChange: handleChange,
      className: 'hidden',
    },
  }
}

export default useFileUpload
