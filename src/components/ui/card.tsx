import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`p-6 pb-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '', ...props }) => {
  return (
    <h3 
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = '', ...props }) => {
  return (
    <p 
      className={`text-sm text-gray-600 ${className}`}
      {...props}
    >
      {children}
    </p>
  )
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`p-6 pt-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
