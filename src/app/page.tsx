'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { usePreview } from '@/hooks/usePreview'
import { WhiteboardCanvas } from '@/components/canvas/WhiteboardCanvas'
import { PreviewPane } from '@/components/preview/PreviewPane'
import { SplitLayout } from '@/components/shared/SplitLayout'
import { CharacterManager } from '@/components/characters/CharacterManager'
import { ProjectManager } from '@/components/projects/ProjectManager'
import { HelpModal } from '@/components/shared/HelpModal'
import { Users, Undo2, Redo2, ChevronDown, HelpCircle } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  const {
    workspace, loaded,
    addField, updateField, removeField,
    addBlock, updateBlock, removeBlock, moveBlock,
    addConnection, removeConnection,
    setCharacters, setViewport,
    undo, redo, canUndo, canRedo,
    renameWorkspace, switchWorkspace, createWorkspace, deleteProject, listProjects,
  } = useWorkspace()

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [showCharacterManager, setShowCharacterManager] = useState(false)
  const [showProjectManager, setShowProjectManager] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

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
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
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
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
        position: 'relative', zIndex: 5,
      }}>
        {/* Logo */}
        <Image
          src="/icon.png"
          alt="DanpentekiBoard"
          width={32}
          height={32}
          style={{ borderRadius: 8, boxShadow: '0 2px 0 rgba(0,0,0,0.15), 0 6px 12px -4px rgba(20,15,5,0.40)', flexShrink: 0 }}
        />

        <span className="hand" style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', flexShrink: 0 }}>
          DanpentekiBoard
        </span>

        <div className="v-divider" style={{ height: 28, flexShrink: 0 }} />

        {/* Project name — clickable */}
        <button
          onClick={() => setShowProjectManager(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 8px', borderRadius: 8,
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(40,30,15,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span className="hand" style={{
            fontSize: 18, fontWeight: 600, color: 'var(--ink-soft)',
            maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {workspace.name}
          </span>
          <ChevronDown size={14} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
        </button>

        <div style={{ flex: 1 }} />

        {/* Undo/Redo */}
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

        {/* Help button */}
        <button
          onClick={() => setShowHelp(true)}
          className="btn-ghost"
          style={{ padding: 5, border: 'none' }}
          title="使い方・ショートカット"
        >
          <HelpCircle size={16} />
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
            <PreviewPane items={previewItems} groups={previewGroups} selectedFieldId={selectedFieldId} />
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

      {showProjectManager && (
        <ProjectManager
          currentId={workspace.id}
          onSwitch={switchWorkspace}
          onCreate={createWorkspace}
          onDelete={deleteProject}
          onRename={renameWorkspace}
          onList={listProjects}
          onClose={() => setShowProjectManager(false)}
        />
      )}

      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}
    </div>
  )
}
