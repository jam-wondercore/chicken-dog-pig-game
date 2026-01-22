/**
 * 圖示按鈕元件
 * @param {string} icon - 圖示
 * @param {string} variant - 樣式變體 (primary | secondary | danger | ghost)
 * @param {string} size - 大小 (sm | md | lg)
 * @param {boolean} disabled - 是否禁用
 * @param {string} className - 額外 class
 * @param {function} onClick - 點擊回調
 * @param {string} title - 提示文字
 */
function IconButton({
  icon,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  title,
  ...props
}) {
  // 大小樣式
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg',
  }

  // 變體樣式
  const variantClasses = {
    primary: 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700',
    danger: 'bg-rose-100 text-rose-600 hover:bg-rose-200',
    ghost: 'bg-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-600',
  }

  // 禁用樣式
  const disabledClass = disabled
    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
    : ''

  const finalClass = `
    rounded-full flex items-center justify-center transition-all duration-200
    ${sizeClasses[size]}
    ${disabled ? disabledClass : variantClasses[variant]}
    ${className}
  `.trim()

  return (
    <button
      className={finalClass}
      disabled={disabled}
      onClick={onClick}
      title={title}
      {...props}
    >
      {icon}
    </button>
  )
}

export default IconButton
