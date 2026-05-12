'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { usePreview } from '@/hooks/usePreview'
import { WhiteboardCanvas } from '@/components/canvas/WhiteboardCanvas'
import { PreviewPane } from '@/components/preview/PreviewPane'
import { SplitLayout } from '@/components/shared/SplitLayout'
import { CharacterManager } from '@/components/characters/CharacterManager'
import { Users, Undo2, Redo2 } from 'lucide-react'

export default function Home() {
  const {
    workspace, loaded,
    addField, updateField, removeField,
    addBlock, updateBlock, removeBlock, moveBlock,
    addConnection, removeConnection,
    setCharacters, setViewport,
    undo, redo, canUndo, canRedo,
  } = useWorkspace()

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [showCharacterManager, setShowCharacterManager] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  const { previewItems, previewGroups } = usePreview(
    selectedFieldId,
    workspace.fields,
    workspace.connections,
    workspace.characters
  )

  if (!loaded) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper-0)' }}>
        <p className="hand" style={{ fontSize: 20, color: 'var(--ink-faint)' }}>読み込み中...</p>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        height: 56, flexShrink: 0,
        background: 'var(--paper-1)',
        borderBottom: '1px solid var(--rule)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset, 0 6px 12px -10px rgba(40,30,15,0.30)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
        position: 'relative', zIndex: 5,
      }}>
        {/* Logo */}
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'var(--ink)', color: 'var(--paper-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 0 #000, 0 6px 12px -4px rgba(20,15,5,0.40)',
        }}>
          <span className="hand" style={{ fontSize: 18, fontWeight: 700 }}>D</span>
        </div>

        <span className="hand" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>
          Danpenteki
        </span>

        <div className="chip mono" style={{ fontSize: 9.5 }}>
          会話フローエディタ
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 2 }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            className="btn-ghost"
            style={{ padding: '5px 8px', opacity: canUndo ? 1 : 0.35 }}
            title="元に戻す (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="btn-ghost"
            style={{ padding: '5px 8px', opacity: canRedo ? 1 : 0.35 }}
            title="やり直し (Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>
        </div>

        <div className="v-divider" style={{ height: 28, flexShrink: 0 }} />

        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
          ダブルクリックでフィールド追加
        </span>

        <div className="v-divider" style={{ height: 28, flexShrink: 0 }} />

        <button
          onClick={() => setShowCharacterManager(true)}
          className="btn-ghost"
          style={{ padding: '5px 12px', fontSize: 12, gap: 5 }}
        >
          <Users size={14} />
          キャラクター
        </button>
      </header>

      {/* Main */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <SplitLayout
          left={
            <div className="paper-grain" style={{
              height: '100%',
              background: 'linear-gradient(120deg, var(--paper-0), var(--paper-1))',
            }}>
              <WhiteboardCanvas
                fields={workspace.fields}
                connections={workspace.connections}
                characters={workspace.characters}
                selectedFieldId={selectedFieldId}
                onSelectField={setSelectedFieldId}
                onUpdateField={updateField}
                onAddField={addField}
                onRemoveField={removeField}
                onAddBlock={addBlock}
                onUpdateBlock={updateBlock}
                onRemoveBlock={removeBlock}
                onAddConnection={addConnection}
                onRemoveConnection={removeConnection}
                onViewportChange={setViewport}
              />
            </div>
          }
          right={
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Preview header */}
              <div style={{
                height: 40, flexShrink: 0,
                display: 'flex', alignItems: 'center', padding: '0 14px',
                borderBottom: '1px dashed var(--rule)',
                background: 'var(--paper-2)',
              }}>
                <span className="hand" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-soft)' }}>プレビュー</span>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <PreviewPane items={previewItems} groups={previewGroups} selectedFieldId={selectedFieldId} />
              </div>
            </div>
          }
        />
      </div>

      {showCharacterManager && (
        <CharacterManager
          characters={workspace.characters}
          onUpdate={setCharacters}
          onClose={() => setShowCharacterManager(false)}
        />
      )}
    </div>
  )
}
