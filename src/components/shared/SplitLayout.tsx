'use client'

import { useState, useCallback, useRef } from 'react'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'

interface SplitLayoutProps {
  left: React.ReactNode
  right: React.ReactNode
  rightHeader?: React.ReactNode
  defaultRatio?: number
}

export function SplitLayout({ left, right, rightHeader, defaultRatio = 0.65 }: SplitLayoutProps) {
  const [ratio, setRatio] = useState(defaultRatio)
  const [collapsed, setCollapsed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const ratioBeforeCollapse = useRef(defaultRatio)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (collapsed) return
    e.preventDefault()
    dragging.current = true

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newRatio = (e.clientX - rect.left) / rect.width
      setRatio(Math.max(0.3, Math.min(0.92, newRatio)))
    }

    const onMouseUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [collapsed])

  const toggleCollapse = useCallback(() => {
    if (collapsed) {
      setRatio(ratioBeforeCollapse.current)
      setCollapsed(false)
    } else {
      ratioBeforeCollapse.current = ratio
      setCollapsed(true)
    }
  }, [collapsed, ratio])

  return (
    <div ref={containerRef} style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      <div style={{ flex: collapsed ? 1 : undefined, width: collapsed ? undefined : `${ratio * 100}%`, height: '100%', overflow: 'hidden' }}>
        {left}
      </div>

      {/* Divider + collapse toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div
          onMouseDown={onMouseDown}
          style={{
            flex: 1,
            width: collapsed ? 0 : 1,
            cursor: collapsed ? undefined : 'col-resize',
            background: collapsed ? 'transparent' : 'linear-gradient(to bottom, transparent, var(--rule) 12%, var(--rule) 88%, transparent)',
          }}
        />
      </div>

      {/* Right panel */}
      <div style={{
        width: collapsed ? 36 : `${(1 - ratio) * 100}%`,
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: collapsed ? 'width 0.15s ease' : undefined,
      }}>
        {/* Collapsed bar */}
        {collapsed ? (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', paddingTop: 8,
            background: 'var(--paper-2)',
            borderLeft: '1px solid var(--rule)',
          }}>
            <button
              onClick={toggleCollapse}
              className="btn-ghost"
              style={{ padding: 6, border: 'none' }}
              title="プレビューを開く"
            >
              <PanelRightOpen size={16} />
            </button>
            <span className="hand" style={{
              writingMode: 'vertical-rl', fontSize: 13, fontWeight: 600,
              color: 'var(--ink-faint)', marginTop: 12, letterSpacing: 2,
            }}>
              プレビュー
            </span>
          </div>
        ) : (
          <>
            {/* Header with collapse button */}
            <div style={{
              height: 40, flexShrink: 0,
              display: 'flex', alignItems: 'center', padding: '0 8px 0 14px',
              borderBottom: '1px dashed var(--rule)',
              background: 'var(--paper-2)',
            }}>
              <span className="hand" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-soft)', flex: 1 }}>
                プレビュー
              </span>
              <button
                onClick={toggleCollapse}
                className="btn-ghost"
                style={{ padding: 4, border: 'none' }}
                title="プレビューを閉じる"
              >
                <PanelRightClose size={15} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {right}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
