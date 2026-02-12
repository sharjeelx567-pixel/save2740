import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg focus-ring disabled:opacity-50 disabled:cursor-not-allowed hover-lift gpu-accelerated touch-manipulation transition-colors duration-200'

    const variants = {
      primary: 'bg-brand-green text-white hover:bg-emerald-600 focus:ring-brand-green shadow-sm active:bg-emerald-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400 active:bg-gray-400',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm active:bg-red-800',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400 active:bg-gray-200',
      outline: 'border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-400 active:bg-gray-100'
    }

    const sizes = {
      sm: 'px-3 py-2.5 text-sm min-h-[44px]', // 44px min for touch targets
      md: 'px-4 py-3 text-base min-h-[48px]', // Comfortable desktop/mobile
      lg: 'px-6 py-4 text-lg min-h-[52px]' // Large touch targets
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          isLoading && 'btn-loading',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
