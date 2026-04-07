import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

type AutoRotateCarouselProps<T> = {
  items: T[]
  label: string
  interval: number
  renderItem: (item: T, index: number) => ReactNode
  className?: string
}

export function AutoRotateCarousel<T>({
  items,
  label,
  interval,
  renderItem,
  className,
}: AutoRotateCarouselProps<T>) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [pauseCount, setPauseCount] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const pointerStartX = useRef<number | null>(null)

  const isPaused = pauseCount > 0

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (reduceMotion || isPaused || items.length < 2) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % items.length)
    }, interval)

    return () => window.clearTimeout(timer)
  }, [interval, isPaused, reduceMotion, items.length])

  const handlePrev = () => {
    setActiveIndex((current) => (current - 1 + items.length) % items.length)
  }

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % items.length)
  }

  const handleDotSelect = (index: number) => {
    setActiveIndex(index)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = event.clientX
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) {
      return
    }

    const delta = event.clientX - pointerStartX.current
    const threshold = 40

    if (delta > threshold) {
      handlePrev()
    } else if (delta < -threshold) {
      handleNext()
    }

    pointerStartX.current = null
  }

  return (
    <div
      className={`carousel-root ${className ?? ''}`}
      aria-label={label}
      onMouseEnter={() => setPauseCount((count) => count + 1)}
      onMouseLeave={() => setPauseCount((count) => Math.max(0, count - 1))}
      onFocus={() => setPauseCount((count) => count + 1)}
      onBlur={() => setPauseCount((count) => Math.max(0, count - 1))}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div className="carousel-stage">
        {items.map((item, index) => (
          <div
            key={index}
            className={`carousel-slide${index === activeIndex ? ' active' : ''}`}
            aria-hidden={index !== activeIndex}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      <div className="carousel-controls">
        <button type="button" onClick={handlePrev} aria-label={`Previous ${label}`}>
          ‹
        </button>
        <button type="button" onClick={handleNext} aria-label={`Next ${label}`}>
          ›
        </button>
      </div>

      <div className="carousel-dots" role="tablist" aria-label={`${label} navigation`}>
        {items.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`carousel-dot${index === activeIndex ? ' active' : ''}`}
            aria-label={`Show ${label} item ${index + 1} of ${items.length}`}
            aria-selected={index === activeIndex}
            onClick={() => handleDotSelect(index)}
          />
        ))}
      </div>
    </div>
  )
}
