'use client'

import { useState, useCallback, useRef } from 'react'

interface SplitLayoutProps {
  left: React.ReactNode
  right: React.ReactNode
  defaultRatio?: number
}

export function SplitLayout({ left, right, defaultRatio = 0.65 }: SplitLayoutProps) {
  const [ratio, setRatio] = useState(defaultRatio)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newRatio = (e.clientX - rect.left) / rect.width
      setRatio(Math.max(0.3, Math.min(0.8, newRatio)))
    }

    const onMouseUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  return (
    <div ref={containerRef} style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      <div style={{ width: `${ratio * 100}%`, height: '100%', overflow: 'hidden' }}>
        {left}
      </div>
      <div className="v-divider" onMouseDown={onMouseDown} style={{ cursor: 'col-resize', flexShrink: 0 }} />
      <div style={{ width: `${(1 - ratio) * 100}%`, height: '100%', overflow: 'hidden' }}>
        {right}
      </div>
    </div>
  )
}
