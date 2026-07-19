'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { NodeResizeControl, type NodeProps } from '@xyflow/react'
import { Memo } from '@/types'
import { loadImage, saveImage, deleteImage } from '@/lib/storage'
import { generateId } from '@/lib/id'
import { X, ImageIcon } from 'lucide-react'

const MEMO_COLORS = [
  { name: 'Gold', value: '#f5edd4', border: '#d9cc9e', accent: '#b89530' },
  { name: 'Sienna', value: '#f5e0db', border: '#dcc0b8', accent: '#c2543a' },
  { name: 'Navy', value: '#dce4ee', border: '#b8c8dc', accent: '#3a5a8c' },
  { name: 'Forest', value: '#ddeee2', border: '#b8d4c0', accent: '#4a7c59' },
  { name: 'Plum', value: '#eddcec', border: '#d4b8d2', accent: '#7c4a7a' },
]

export interface MemoNodeData {
  memo: Memo
  onUpdateMemo: (id: string, updates: Partial<Memo>) => void
  onRemoveMemo: (id: string) => void
  [key: string]: unknown
}

function MemoNodeComponent({ data, selected }: NodeProps) {
  const { memo, onUpdateMemo, onRemoveMemo } = data as unknown as MemoNodeData
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [localText, setLocalText] = useState(memo.text)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    setLocalText(memo.text)
  }, [memo.text])

  // Load image from IndexedDB
  useEffect(() => {
    if (!memo.imageId) {
      setImageUrl(null)
      return
    }
    let revoke: string | null = null
    loadImage(memo.imageId).then(blob => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        revoke = url
        setImageUrl(url)
      }
    })
    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [memo.imageId])

  const saveText = useCallback((text: string) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      ;(onUpdateMemo as any)(memo.id, { text })
    }, 300)
  }, [memo.id, onUpdateMemo])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setLocalText(text)
    saveText(text)
  }, [saveText])

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    const imageId = generateId()
    await saveImage(imageId, file)
    if (memo.imageId) {
      await deleteImage(memo.imageId)
    }
    ;(onUpdateMemo as any)(memo.id, { imageId })
  }, [memo.id, memo.imageId, onUpdateMemo])

  const handleRemoveImage = useCallback(async () => {
    if (memo.imageId) {
      await deleteImage(memo.imageId)
      ;(onUpdateMemo as any)(memo.id, { imageId: undefined })
    }
  }, [memo.id, memo.imageId, onUpdateMemo])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleImageFile(file)
  }, [handleImageFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file) handleImageFile(file)
        return
      }
    }
  }, [handleImageFile])

  const colorInfo = MEMO_COLORS.find(c => c.value === memo.color) || MEMO_COLORS[0]

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        width: '100%',
        minWidth: 120,
        minHeight: 80,
        position: 'relative',
        background: colorInfo.value,
        border: dragOver
          ? `2px dashed ${colorInfo.accent}`
          : `1px solid ${colorInfo.border}`,
        borderRadius: 4,
        boxShadow: selected
          ? `0 0 0 2px var(--ink), 0 4px 12px -4px rgba(40,30,15,0.35)`
          : '0 2px 6px -2px rgba(40,30,15,0.25), 0 1px 2px rgba(40,30,15,0.10)',
        transition: 'box-shadow 0.15s, border 0.15s',
      }}
    >
      {/* Resize control */}
      <NodeResizeControl
        minWidth={120}
        maxWidth={600}
        position="right"
        className="resize-control-right"
        style={{ background: 'transparent', border: 'none' }}
        onResizeEnd={(_event: any, params: any) => {
          ;(onUpdateMemo as any)(memo.id, { width: Math.round(params.width) })
        }}
      >
        <div className="resize-handle-visual" />
      </NodeResizeControl>

      {/* Fold effect - top left corner */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 16, height: 16,
        background: `linear-gradient(135deg, var(--paper-0) 50%, ${colorInfo.border} 50%)`,
        borderRadius: '0 0 4px 0',
        zIndex: 1,
      }} />

      {/* Header bar with color dots and close */}
      <div
        className="nodrag nowheel"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '4px 6px 0',
          gap: 3,
        }}
      >
        {MEMO_COLORS.map(c => (
          <button
            key={c.value}
            onClick={() => (onUpdateMemo as any)(memo.id, { color: c.value })}
            title={c.name}
            style={{
              width: 10, height: 10, borderRadius: '50%',
              background: c.accent,
              border: memo.color === c.value ? '2px solid var(--ink)' : '1px solid rgba(0,0,0,0.15)',
              cursor: 'pointer', padding: 0, flexShrink: 0,
            }}
          />
        ))}
        <button
          onClick={() => (onRemoveMemo as any)(memo.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--ink-faint)', padding: 1, lineHeight: 0,
            marginLeft: 2,
          }}
          title="メモを削除"
        >
          <X size={12} />
        </button>
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="nodrag nowheel" style={{ padding: '4px 10px 0', position: 'relative' }}>
          <img
            src={imageUrl}
            alt=""
            style={{
              width: '100%',
              borderRadius: 3,
              display: 'block',
              boxShadow: '0 1px 3px rgba(40,30,15,0.15)',
            }}
          />
          <button
            onClick={handleRemoveImage}
            title="画像を削除"
            style={{
              position: 'absolute', top: 8, right: 14,
              background: 'rgba(0,0,0,0.5)', border: 'none',
              borderRadius: '50%', width: 20, height: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
              opacity: 0.7, transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Drop hint when no image */}
      {!imageUrl && dragOver && (
        <div style={{
          padding: '12px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, color: colorInfo.accent, fontSize: 12,
        }}>
          <ImageIcon size={16} />
          <span>画像をドロップ</span>
        </div>
      )}

      {/* Text area */}
      <div
        className="nodrag nowheel nopan"
        style={{ padding: '4px 10px 10px' }}
        onKeyDown={e => e.stopPropagation()}
        onKeyUp={e => e.stopPropagation()}
        onPaste={handlePaste}
      >
        <textarea
          ref={textareaRef}
          value={localText}
          onChange={handleChange}
          placeholder="メモ..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--ink-soft)',
            width: '100%',
            resize: 'none',
            padding: 0,
            lineHeight: 1.6,
            fontSize: 13,
            fontFamily: "'Caveat', cursive",
            fontWeight: 500,
            minHeight: 48,
          }}
          rows={3}
        />
      </div>
    </div>
  )
}

export const MemoNode = MemoNodeComponent
