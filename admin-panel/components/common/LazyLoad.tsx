'use client'

import React, { Suspense, lazy as reactLazy, ComponentType } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface LazyLoadProps {
  fallback?: React.ReactNode
}

/**
 * Lazy load wrapper component for code splitting
 * Usage: const MyComponent = lazy(() => import('./MyComponent'))
 */
export function lazy<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return reactLazy(importFunc)
}

/**
 * Lazy wrapper with custom fallback
 */
export function LazyWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <Suspense 
      fallback={
        fallback || (
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  )
}

/**
 * Lazy load with skeleton fallback
 */
export function LazyWithSkeleton({ 
  children, 
  skeleton 
}: { 
  children: React.ReactNode
  skeleton: React.ReactNode 
}) {
  return (
    <Suspense fallback={skeleton}>
      {children}
    </Suspense>
  )
}

export default LazyWrapper
