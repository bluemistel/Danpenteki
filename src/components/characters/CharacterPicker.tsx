'use client'

import { useRef, useEffect } from 'react'
import { Character } from '@/types'

interface CharacterPickerProps {
  characters: Character[]
  selectedId: string
  onChange: (id: string) => void
}

export function CharacterPicker({ characters, selectedId, onChange }: CharacterPickerProps) {
  const ref = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const stop = (e: Event) => { e.stopPropagation() }
    el.addEventListener('keydown', stop, true)
    el.addEventListener('keyup', stop, true)
    return () => {
      el.removeEventListener('keydown', stop, true)
      el.removeEventListener('keyup', stop, true)
    }
  }, [])

  return (
    <select
      ref={ref}
      value={selectedId}
      onChange={e => onChange(e.target.value)}
      onMouseDown={e => e.stopPropagation()}
      className="mono"
      style={{
        fontSize: 10,
        background: 'var(--paper-2)',
        border: '1px solid #d8cdb6',
        borderRadius: 999,
        padding: '2px 8px',
        color: 'var(--ink-soft)',
        outline: 'none',
        maxWidth: 110,
        cursor: 'pointer',
      }}
    >
      <option value="">（ナレーション）</option>
      {characters.map(c => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
