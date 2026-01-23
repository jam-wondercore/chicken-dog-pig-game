/**
 * 通用按鈕元件
 * @param {string} variant - 樣式變體 (primary | secondary | danger | success | warning | ghost)
 * @param {string} size - 大小 (sm | md | lg)
 * @param {boolean} fullWidth - 是否滿版寬度
 * @param {boolean} disabled - 是否禁用
 * @param {string} icon - 圖示
 * @param {React.ReactNode} children - 按鈕文字
 * @param {string} className - 額外 class
 * @param {function} onClick - 點擊回調
 */
function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon,
  children,
  className = '',
  onClick,
  ...props
}) {
  // 基礎樣式
  const baseClass = 'flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300'

  // 大小樣式
  const sizeClasses = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-4 text-base',
  }

  // 變體樣式
  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5',
    secondary: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    danger: 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    'outline-danger': 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100',
    'outline-warning': 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100',
  }

  // 禁用樣式
  const disabledClass = disabled
    ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:shadow-none hover:translate-y-0'
    : ''

  // 寬度樣式
  const widthClass = fullWidth ? 'w-full' : ''

  const finalClass = `
    ${baseClass}
    ${sizeClasses[size]}
    ${disabled ? disabledClass : variantClasses[variant]}
    ${widthClass}
    ${className}
  `.trim()

  return (
    <button
      className={finalClass}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && <span className={size === 'lg' ? 'text-xl' : 'text-lg'}>{icon}</span>}
      {children}
    </button>
  )
}

export default Button
