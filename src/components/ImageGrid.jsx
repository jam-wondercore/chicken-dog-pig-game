function ImageGrid({ images, onImageClick, activeIndex = -1, mode = 'setup' }) {
  return (
    <div className="grid grid-cols-4 gap-4 w-full max-w-[480px] mx-auto bg-white p-5 rounded-2xl shadow-lg">
      {images.map((image, index) => (
        <div
          key={index}
          onClick={() => mode === 'setup' && onImageClick && onImageClick(index)}
          className={`
            relative aspect-square rounded-lg overflow-hidden group
            ${mode === 'setup' ? 'cursor-pointer' : ''}
            ${activeIndex === index ? 'z-10' : ''}
            transition-all duration-200
          `}
          style={{
            borderWidth: activeIndex === index ? '6px' : '3px',
            borderColor: activeIndex === index ? 'var(--primary-color)' : '#ddd',
            boxShadow: activeIndex === index ? 'var(--active-shadow)' : 'none'
          }}
        >
          {image ? (
            <img
              src={image}
              alt={`圖片 ${index + 1}`}
              className={`w-full h-full object-cover ${mode === 'setup' ? 'group-hover:scale-110' : ''} transition-transform duration-300`}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center gap-2 ${mode === 'setup' ? 'group-hover:from-blue-50 group-hover:to-purple-50' : ''} transition-all duration-200`}>
              <span className={`text-3xl ${mode === 'setup' ? 'group-hover:scale-110' : ''} transition-transform duration-200`}>
                📷
              </span>
              <span className={`text-xs font-bold ${mode === 'setup' ? 'text-gray-400 group-hover:text-blue-600' : 'text-gray-400'} transition-colors duration-200`}>
                {index + 1}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ImageGrid
