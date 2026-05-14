'use client'

import { useState, useCallback } from 'react'
import { type NodeProps } from '@xyflow/react'
import { FieldGroup } from '@/types'
import { LocalInput } from '../editor/LocalInput'
import { X } from 'lucide-react'

const PRESET_COLORS = [
  { name: 'Sienna', value: '#c2543a' },
  { name: 'Navy', value: '#3a5a8c' },
  { name: 'Forest', value: '#4a7c59' },
  { name: 'Gold', value: '#b89530' },
  { name: 'Plum', value: '#7c4a7a' },
]

export interface GroupNodeData {
  group: FieldGroup
  onUpdateGroup: (id: string, updates: Partial<FieldGroup>) => void
  onRemoveGroup: (id: string) => void
  [key: string]: unknown
}

function GroupNodeComponent({ data }: NodeProps) {
  const { group, onUpdateGroup, onRemoveGroup } = data as unknown as GroupNodeData
  const [editingName, setEditingName] = useState(false)

  const hexToRgba = useCallback((hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }, [])

  return (
    <div
      className="group-node"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 16,
        border: `2px dashed ${group.color}`,
        background: hexToRgba(group.color, 0.05),
        pointerEvents: 'none',
        position: 'relative',
      }}
    >
      {/* Label area */}
      <div
        className="group-label nodrag nowheel"
        style={{
          position: 'absolute',
          top: 8,
          left: 12,
          pointerEvents: 'all',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
        onKeyDown={e => e.stopPropagation()}
        onKeyUp={e => e.stopPropagation()}
      >
        {/* Tape decoration */}
        <div
          className="tape"
          style={{
            position: 'absolute',
            top: -6,
            left: 4,
            width: 32,
            height: 12,
            transform: 'rotate(-3deg)',
            zIndex: 2,
          }}
        />

        {/* Name */}
        <div
          style={{
            background: 'var(--paper-3)',
            border: `1px solid ${group.color}`,
            borderRadius: 6,
            padding: '2px 8px',
            boxShadow: 'var(--shadow-tight)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            position: 'relative',
          }}
        >
          {editingName ? (
            <LocalInput
              value={group.name}
              onChange={val => (onUpdateGroup as any)(group.id, { name: val })}
              onBlur={() => setEditingName(false)}
              onEnter={() => setEditingName(false)}
              className="analog hand nodrag nowheel"
              autoFocus
            />
          ) : (
            <span
              className="hand"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: group.name ? 'var(--ink)' : 'var(--ink-faint)',
                fontStyle: group.name ? 'normal' : 'italic',
                cursor: 'text',
                whiteSpace: 'nowrap',
              }}
              onDoubleClick={() => setEditingName(true)}
            >
              {group.name || 'グループ名'}
            </span>
          )}

          {/* Color dots */}
          <div style={{ display: 'flex', gap: 3 }}>
            {PRESET_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => (onUpdateGroup as any)(group.id, { color: c.value })}
                title={c.name}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: c.value,
                  border: group.color === c.value ? '2px solid var(--ink)' : '1px solid rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* Remove group button */}
          <button
            onClick={() => (onRemoveGroup as any)(group.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink-faint)',
              padding: 1,
              lineHeight: 0,
              flexShrink: 0,
            }}
            title="グループ解除"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

export const GroupNode = GroupNodeComponent
