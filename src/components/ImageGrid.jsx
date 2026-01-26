import { GRID_MODES } from '../constants'

/**
 * ImageGrid 組件
 * @param {Array} images - 圖片陣列
 * @param {Function} onImageClick - 點擊圖片的回調
 * @param {number} activeIndex - 當前高亮的圖片索引（跳動階段）
 * @param {number} revealIndex - 已揭示到的圖片索引（揭示階段，-1 表示全部隱藏，>= images.length 表示全部顯示）
 * @param {string} mode - 顯示模式 (SETUP | GAME)
 */
function ImageGrid({ images, onImageClick, activeIndex = -1, revealIndex = images.length, mode = GRID_MODES.SETUP }) {
  return (
    <div className="glass-card-elevated grid grid-cols-4 gap-1.5 sm:gap-5 w-full max-w-256 mx-auto p-1.5 sm:p-4 rounded-xl sm:rounded-2xl">
      {images.map((image, index) => {
        const isActive = activeIndex === index
        const isRevealed = index <= revealIndex
        const isJustRevealed = index === revealIndex

        return (
          <div
            key={index}
            onClick={() => mode === GRID_MODES.SETUP && onImageClick && onImageClick(index)}
            className={`
              relative aspect-square rounded-xl overflow-hidden group
              ${mode === GRID_MODES.SETUP ? 'cursor-pointer' : ''}
              ${isActive ? 'z-10 image-active' : ''}
              ${!isActive ? 'border-2 border-gray-200/60' : ''}
              ${mode === GRID_MODES.SETUP && !isActive ? 'hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1' : ''}
              ${mode === GRID_MODES.GAME && !isRevealed ? 'opacity-0 scale-75' : ''}
              ${mode === GRID_MODES.GAME && isRevealed ? 'opacity-100 scale-100' : ''}
              ${mode === GRID_MODES.GAME && isJustRevealed ? 'animate-reveal' : ''}
              transition-all duration-300 ease-out
            `}
          >
            {/* Active Glow Ring */}
            {isActive && (
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 rounded-xl blur opacity-75 animate-glow" />
            )}

            <div className={`relative w-full h-full ${isActive ? 'rounded-lg overflow-hidden' : ''}`}>
              {image ? (
                <img
                  src={image}
                  alt={`圖片 ${index + 1}`}
                  className={`w-full h-full object-cover transition-transform duration-300 ease-out ${
                    mode === GRID_MODES.SETUP ? 'group-hover:scale-110' : ''
                  } ${isActive ? 'scale-100' : ''}`}
                />
              ) : (
                <div
                  className={`w-full h-full flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
                    mode === GRID_MODES.SETUP
                      ? 'bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-indigo-50 group-hover:to-purple-50'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100'
                  }`}
                >
                  <span
                    className={`text-2xl transition-all duration-300 ${
                      mode === GRID_MODES.SETUP ? 'group-hover:scale-125 group-hover:rotate-12' : ''
                    }`}
                  >
                    📷
                  </span>
                  <span
                    className={`text-[10px] font-bold transition-colors duration-300 ${
                      mode === GRID_MODES.SETUP ? 'text-gray-300 group-hover:text-indigo-500' : 'text-gray-300'
                    }`}
                  >
                    {index + 1}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ImageGrid
