'use client'

import { useState, useRef } from 'react'
import { Character } from '@/types'
import { generateId } from '@/lib/id'
import { FaceIcon } from './FaceIcon'
import { X, Plus, Trash2, Upload } from 'lucide-react'

interface CharacterManagerProps {
  characters: Character[]
  onUpdate: (characters: Character[]) => void
  onClose: () => void
}

const PALETTE = ['#d8e3d0', '#e8d6c2', '#cdd8e0', '#e6dec9', '#e0ced8', '#c8dcd2', '#ddd5c4', '#d4cde0']

export function CharacterManager({ characters, onUpdate, onClose }: CharacterManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const addCharacter = () => {
    const newChar: Character = {
      id: generateId(),
      name: '新キャラクター',
      group: '',
      emotions: { normal: { iconUrl: '' } },
      backgroundColor: PALETTE[characters.length % PALETTE.length],
    }
    onUpdate([...characters, newChar])
    setEditingId(newChar.id)
  }

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    onUpdate(characters.map(c => (c.id === id ? { ...c, ...updates } : c)))
  }

  const deleteCharacter = (id: string) => {
    onUpdate(characters.filter(c => c.id !== id))
  }

  const handleIconUpload = (id: string, file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      const char = characters.find(c => c.id === id)
      if (char) {
        updateCharacter(id, {
          emotions: { ...char.emotions, normal: { iconUrl: url } },
        })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,24,21,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div className="card-analog" style={{
        width: 460, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        background: 'var(--paper-3)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px dashed var(--rule)',
        }}>
          <h2 className="hand" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>キャラクター管理</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--ink-mute)', padding: 4, lineHeight: 0,
          }}>
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {characters.map(char => (
            <div key={char.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 0',
              borderBottom: '1px dashed var(--rule-soft)',
            }}>
              <div style={{ position: 'relative' }}>
                <FaceIcon character={char} size={44} />
                <IconUploadButton
                  onUpload={file => handleIconUpload(char.id, file)}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === char.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      type="text"
                      value={char.name}
                      onChange={e => updateCharacter(char.id, { name: e.target.value })}
                      className="analog hand"
                      style={{ fontSize: 17, fontWeight: 600, borderBottom: '1px dashed var(--rule)' }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>背景色</span>
                      <input
                        type="color"
                        value={char.backgroundColor}
                        onChange={e => updateCharacter(char.id, { backgroundColor: e.target.value })}
                        style={{ width: 24, height: 24, border: 'none', borderRadius: 999, cursor: 'pointer', padding: 0 }}
                      />
                    </div>
                    <button onClick={() => setEditingId(null)} className="btn-ghost" style={{ alignSelf: 'flex-start', padding: '3px 10px', fontSize: 11 }}>
                      完了
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => setEditingId(char.id)}
                      className="hand"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 16, fontWeight: 600, color: 'var(--ink)', padding: 0, textAlign: 'left',
                      }}
                    >
                      {char.name}
                    </button>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>
                      {char.emotions.normal?.iconUrl ? 'アイコン設定済み' : 'アイコン未設定'}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => deleteCharacter(char.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--ink-faint)', padding: 4, lineHeight: 0, marginTop: 4,
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {characters.length === 0 && (
            <p className="hand" style={{ textAlign: 'center', color: 'var(--ink-faint)', fontSize: 16, padding: '24px 0' }}>
              キャラクターがいません
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px dashed var(--rule)' }}>
          <button onClick={addCharacter} className="btn-ink sm" style={{ width: '100%', justifyContent: 'center' }}>
            <Plus size={14} />
            キャラクターを追加
          </button>
        </div>
      </div>
    </div>
  )
}

function IconUploadButton({ onUpload }: { onUpload: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 20, height: 20, borderRadius: '50%',
          background: 'var(--paper-3)', border: '1.5px solid var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', lineHeight: 0, padding: 0,
          boxShadow: '0 1px 3px rgba(40,30,15,0.2)',
        }}
        title="アイコンをアップロード"
      >
        <Upload size={10} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ''
        }}
        style={{ display: 'none' }}
      />
    </>
  )
}
