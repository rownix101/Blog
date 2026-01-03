'use client'

import React, { useState, useId } from 'react'
import { cn } from '@/lib/utils'

interface InfiniteScrollProps {
  className?: string
  duration?: number
  direction?: 'normal' | 'reverse'
  showFade?: boolean
  children: React.ReactNode
  pauseOnHover?: boolean
}

export function InfiniteScroll({
  className,
  duration = 15000,
  direction = 'normal',
  showFade = true,
  children,
  pauseOnHover = true,
}: InfiniteScrollProps) {
  const [isPaused, setIsPaused] = useState(false)
  
  // Use React's useId for stable SSR-compatible ID
  const id = useId().replace(/:/g, '')
  const animationName = `scroll-${id}`

  const handleMouseEnter = () => {
    if (pauseOnHover) setIsPaused(true)
  }

  const handleMouseLeave = () => {
    if (pauseOnHover) setIsPaused(false)
  }

  return (
    <div
      className={cn(
        'relative flex shrink-0 flex-col gap-4 overflow-hidden py-3 sm:py-2 sm:gap-2',
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Scoped keyframes for this instance */}
      <style>
        {`
          @keyframes ${animationName} {
            from { transform: translateX(0); }
            to { transform: translateX(-33.333%); }
          }
        `}
      </style>
      <div className="flex">
        <div
          className="flex shrink-0"
          style={{
            animation: `${animationName} ${duration}ms linear infinite`,
            animationDirection: direction === 'reverse' ? 'reverse' : 'normal',
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          <div className="flex shrink-0">{children}</div>
          <div className="flex shrink-0">{children}</div>
          <div className="flex shrink-0">{children}</div>
        </div>
      </div>
      {showFade && (
        <div
          className="from-background to-background pointer-events-none absolute inset-0 bg-linear-to-r via-transparent sm:bg-gradient-to-r"
        />
      )}
    </div>
  )
}
