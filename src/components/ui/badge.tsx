import React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-gray-200 text-gray-800'
  }

  return (
    <span 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
