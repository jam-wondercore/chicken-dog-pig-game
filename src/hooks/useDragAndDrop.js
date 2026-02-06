import { useState, useCallback } from 'react'

/**
 * 拖放排序 hook
 * @param {Object} options - 選項
 * @param {function} options.onReorder - 重排回調 (fromIndex, toIndex) => void
 */
function useDragAndDrop({ onReorder } = {}) {
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dropPosition, setDropPosition] = useState(null)

  /**
   * 拖曳開始
   */
  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  /**
   * 拖曳結束
   */
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDropPosition(null)
  }, [])

  /**
   * 檢查是否為有效的放置位置
   * @param {number} position - 目標位置
   * @returns {boolean}
   */
  const isValidDropPosition = useCallback((position) => {
    if (draggedIndex === null) return false
    // 不允許放在自己的前後（等於不移動）
    return position !== draggedIndex && position !== draggedIndex + 1
  }, [draggedIndex])

  /**
   * 處理拖曳經過
   */
  const handleDragOver = useCallback((e, position) => {
    e.preventDefault()
    if (isValidDropPosition(position)) {
      setDropPosition(position)
    }
  }, [isValidDropPosition])

  /**
   * 處理拖曳離開
   */
  const handleDragLeave = useCallback(() => {
    setDropPosition(null)
  }, [])

  /**
   * 處理放下
   */
  const handleDrop = useCallback((e, position) => {
    e.preventDefault()
    if (draggedIndex !== null && isValidDropPosition(position)) {
      // 計算實際的目標位置
      const targetIndex = position > draggedIndex ? position - 1 : position
      onReorder?.(draggedIndex, targetIndex)
    }
    setDraggedIndex(null)
    setDropPosition(null)
  }, [draggedIndex, isValidDropPosition, onReorder])

  /**
   * 根據滑鼠位置決定放置位置（左側/右側）
   * @param {MouseEvent} e - 滑鼠事件
   * @param {number} index - 當前項目索引
   * @param {number} leftThreshold - 左側觸發閾值 (0-1)
   * @param {number} rightThreshold - 右側觸發閾值 (0-1)
   */
  const handleItemDragOver = useCallback((e, index, leftThreshold = 0.4, rightThreshold = 0.6) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const relativeX = (e.clientX - rect.left) / rect.width

    let pos = null
    if (relativeX < leftThreshold) {
      pos = index
    } else if (relativeX > rightThreshold) {
      pos = index + 1
    }

    if (pos !== null && isValidDropPosition(pos)) {
      setDropPosition(pos)
    } else {
      setDropPosition(null)
    }
  }, [isValidDropPosition])

  /**
   * 根據滑鼠位置決定放置位置（上方/下方，用於垂直排列）
   */
  const handleItemDragOverVertical = useCallback((e, index) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const relativeY = (e.clientY - rect.top) / rect.height
    const pos = relativeY < 0.5 ? index : index + 1

    if (isValidDropPosition(pos)) {
      setDropPosition(pos)
    } else {
      setDropPosition(null)
    }
  }, [isValidDropPosition])

  /**
   * 取得項目的拖曳屬性（水平排列用）
   * @param {number} index - 項目索引
   */
  const getDragItemProps = useCallback((index) => ({
    draggable: true,
    onDragStart: (e) => handleDragStart(e, index),
    onDragEnd: handleDragEnd,
    onDragOver: (e) => handleItemDragOver(e, index),
    onDragLeave: handleDragLeave,
    onDrop: (e) => {
      e.preventDefault()
      if (dropPosition !== null && draggedIndex !== null) {
        const targetIndex = dropPosition > draggedIndex ? dropPosition - 1 : dropPosition
        onReorder?.(draggedIndex, targetIndex)
      }
      setDraggedIndex(null)
      setDropPosition(null)
    },
  }), [handleDragStart, handleDragEnd, handleItemDragOver, handleDragLeave, dropPosition, draggedIndex, onReorder])

  /**
   * 取得項目的拖曳屬性（垂直排列用）
   * @param {number} index - 項目索引
   */
  const getDragItemPropsVertical = useCallback((index) => ({
    draggable: true,
    onDragStart: (e) => handleDragStart(e, index),
    onDragEnd: handleDragEnd,
    onDragOver: (e) => handleItemDragOverVertical(e, index),
    onDragLeave: handleDragLeave,
    onDrop: (e) => {
      e.preventDefault()
      if (dropPosition !== null && draggedIndex !== null) {
        const targetIndex = dropPosition > draggedIndex ? dropPosition - 1 : dropPosition
        onReorder?.(draggedIndex, targetIndex)
      }
      setDraggedIndex(null)
      setDropPosition(null)
    },
  }), [handleDragStart, handleDragEnd, handleItemDragOverVertical, handleDragLeave, dropPosition, draggedIndex, onReorder])

  return {
    draggedIndex,
    dropPosition,
    isDragging: draggedIndex !== null,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleItemDragOver,
    handleItemDragOverVertical,
    isValidDropPosition,
    getDragItemProps,
    getDragItemPropsVertical,
    // 判斷是否應該顯示放置指示器
    shouldShowDropIndicator: (position) => draggedIndex !== null && dropPosition === position,
  }
}

export default useDragAndDrop
