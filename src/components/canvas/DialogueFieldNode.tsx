'use client'

import { memo, useState, useCallback, type MouseEvent as ReactMouseEvent } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { DialogueField, Character, DialogueBlock, Connection } from '@/types'
import { FaceIcon } from '../characters/FaceIcon'
import { CharacterPicker } from '../characters/CharacterPicker'
import { BlockTextarea } from '../editor/BlockTextarea'
import { LocalInput } from '../editor/LocalInput'
import { Plus, Trash2 } from 'lucide-react'

function AltClickHandle({ onAltClick, ...props }: React.ComponentProps<typeof Handle> & { onAltClick: () => void }) {
  const handleClick = useCallback((e: ReactMouseEvent) => {
    if (e.altKey) {
      e.stopPropagation()
      e.preventDefault()
      onAltClick()
    }
  }, [onAltClick])

  return (
    <div onClickCapture={handleClick}>
      <Handle {...props} />
    </div>
  )
}

export interface DialogueFieldNodeData {
  field: DialogueField
  characters: Character[]
  connections: Connection[]
  onUpdateField: (id: string, updates: Partial<DialogueField>) => void
  onAddBlock: (fieldId: string, characterId?: string) => void
  onUpdateBlock: (fieldId: string, blockId: string, updates: Partial<DialogueBlock>) => void
  onRemoveBlock: (fieldId: string, blockId: string) => void
  onRemoveField: (id: string) => void
  onRemoveConnectionsAt: (fieldId: string, handleType: 'source' | 'target', handleId: string) => void
  [key: string]: unknown
}

function DialogueFieldNodeComponent({ data, selected }: NodeProps) {
  const {
    field, characters, connections,
    onUpdateField, onAddBlock, onUpdateBlock, onRemoveBlock, onRemoveField, onRemoveConnectionsAt,
  } = data as unknown as DialogueFieldNodeData

  const [editingLabel, setEditingLabel] = useState(false)
  const charMap = new Map((characters as Character[]).map(c => [c.id, c]))
  const f = field as DialogueField
  const conns = connections as Connection[]

  const hasConn = (ht: 'source' | 'target', hid: string) =>
    conns.some(c =>
      ht === 'source'
        ? c.sourceFieldId === f.id && (c.sourceHandle || 'bottom') === hid
        : c.targetFieldId === f.id && (c.targetHandle || 'top') === hid
    )

  const removeAt = (ht: 'source' | 'target', hid: string) =>
    (onRemoveConnectionsAt as any)(f.id, ht, hid)

  return (
    <div
      className={`card-analog ${selected ? 'selected' : ''}`}
      style={{ width: f.width, minWidth: 260, minHeight: 60, position: 'relative' }}
    >
      {/* Tape strip */}
      <div className="tape" style={{ top: -10, left: 18, width: 64, height: 18 }} />

      {/* Handles */}
      <AltClickHandle onAltClick={() => removeAt('target', 'top')} type="target" position={Position.Top}
        className={`handle-analog ${hasConn('target', 'top') ? 'connected' : ''}`} />
      <AltClickHandle onAltClick={() => removeAt('target', 'left-target')} type="target" position={Position.Left}
        className={`handle-analog ${hasConn('target', 'left-target') ? 'connected' : ''}`} id="left-target" />
      <AltClickHandle onAltClick={() => removeAt('source', 'bottom')} type="source" position={Position.Bottom}
        className={`handle-analog ${hasConn('source', 'bottom') ? 'connected' : ''}`} />
      <AltClickHandle onAltClick={() => removeAt('source', 'right-source')} type="source" position={Position.Right}
        className={`handle-analog ${hasConn('source', 'right-source') ? 'connected' : ''}`} id="right-source" />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 10px 6px',
        borderBottom: '1px dashed var(--rule)',
      }}>
        {editingLabel ? (
          <LocalInput
            value={f.label}
            onChange={val => (onUpdateField as any)(f.id, { label: val })}
            onBlur={() => setEditingLabel(false)}
            onEnter={() => setEditingLabel(false)}
            className="analog hand nodrag nowheel"
            autoFocus
          />
        ) : (
          <span
            className="hand hand-underline"
            style={{
              flex: 1, fontSize: 18, fontWeight: 600, color: 'var(--ink)',
              cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
            onDoubleClick={() => setEditingLabel(true)}
          >
            {f.label}
          </span>
        )}

        <button
          onClick={() => (onRemoveField as any)(f.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--ink-faint)', padding: 2, lineHeight: 0,
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Body */}
      {!f.collapsed && (
        <div className="nodrag nowheel nopan">
          {f.blocks.length > 0 && (
            <div className="hide-scrollbar" style={{ padding: '8px 10px', maxHeight: 300, overflowY: 'auto' }}>
              {f.blocks.map((block, i) => (
                <div key={block.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 6,
                  paddingTop: i > 0 ? 8 : 0,
                  borderTop: i > 0 ? '1px dashed var(--rule-soft)' : 'none',
                  marginTop: i > 0 ? 8 : 0,
                }}>
                  <FaceIcon character={charMap.get(block.characterId)} size={32} emotion={block.emotion} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <CharacterPicker
                      characters={characters as Character[]}
                      selectedId={block.characterId}
                      onChange={id => (onUpdateBlock as any)(f.id, block.id, { characterId: id })}
                    />
                    <BlockTextarea
                      value={block.text}
                      onChange={text => (onUpdateBlock as any)(f.id, block.id, { text })}
                      placeholder="セリフを入力..."
                      rows={2}
                      className="analog"
                      style={{ fontSize: 14 }}
                    />
                  </div>
                  <button
                    onClick={() => (onRemoveBlock as any)(f.id, block.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--ink-faint)', padding: 2, lineHeight: 0,
                      opacity: 0, transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add block */}
          <div
            onClick={() => (onAddBlock as any)(f.id)}
            className="btn-ghost"
            style={{
              width: '100%', justifyContent: 'center',
              borderRadius: '0 0 13px 13px',
              border: 'none', borderTop: '1px dashed var(--rule)',
              padding: '10px 0', fontSize: 13,
            }}
          >
            <Plus size={14} />
            <span className="hand" style={{ fontWeight: 600 }}>ブロック追加</span>
          </div>
        </div>
      )}

      {/* Collapsed */}
      {f.collapsed && (
        <div className="mono" style={{ padding: '8px 10px', fontSize: 10, color: 'var(--ink-faint)' }}>
          {f.blocks.length > 0 ? `${f.blocks.length} ブロック` : '空'}
        </div>
      )}
    </div>
  )
}

export const DialogueFieldNode = memo(DialogueFieldNodeComponent)
