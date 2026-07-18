'use client'

import { StickyNote, Plus } from 'lucide-react'

interface CanvasContextMenuProps {
  x: number
  y: number
  onAddField: () => void
  onAddMemo: () => void
  onClose: () => void
}

export function CanvasContextMenu({ x, y, onAddField, onAddMemo, onClose }: CanvasContextMenuProps) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50 }}
      onClick={onClose}
      onContextMenu={e => { e.preventDefault(); onClose() }}
    >
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          background: 'var(--paper-3)',
          border: '1px solid var(--rule)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-deep)',
          minWidth: 160,
          overflow: 'hidden',
          padding: '4px 0',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => { onAddField(); onClose() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '8px 14px',
            background: 'transparent', border: 'none',
            cursor: 'pointer', fontSize: 13,
            color: 'var(--ink-soft)',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(40,30,15,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Plus size={14} />
          <span>フィールドを追加</span>
        </button>
        <button
          onClick={() => { onAddMemo(); onClose() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '8px 14px',
            background: 'transparent', border: 'none',
            cursor: 'pointer', fontSize: 13,
            color: 'var(--ink-soft)',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(40,30,15,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <StickyNote size={14} />
          <span>メモを追加</span>
        </button>
      </div>
    </div>
  )
}
