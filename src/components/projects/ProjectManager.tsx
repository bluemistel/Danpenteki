'use client'

import { useState, useEffect, useCallback } from 'react'
import { Workspace } from '@/types'
import { X, Plus, Trash2, Pencil, Check } from 'lucide-react'

interface ProjectManagerProps {
  currentId: string
  onSwitch: (id: string) => Promise<void>
  onCreate: () => Promise<Workspace>
  onDelete: (id: string) => Promise<void>
  onRename: (name: string) => void
  onList: () => Promise<Workspace[]>
  onClose: () => void
}

function BoardThumbnail({ workspace, size = 120 }: { workspace: Workspace; size?: number }) {
  const fields = workspace.fields
  const connections = workspace.connections
  if (fields.length === 0) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 8,
        background: 'var(--paper-0)', border: '1px solid var(--rule)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>空</span>
      </div>
    )
  }

  const xs = fields.map(f => f.position.x)
  const ys = fields.map(f => f.position.y)
  const minX = Math.min(...xs) - 20
  const minY = Math.min(...ys) - 20
  const maxX = Math.max(...xs.map((x, i) => x + fields[i].width)) + 20
  const maxY = Math.max(...ys.map((y, i) => y + 60 + fields[i].blocks.length * 40)) + 20
  const rangeX = Math.max(maxX - minX, 1)
  const rangeY = Math.max(maxY - minY, 1)
  const scale = Math.min(size / rangeX, size / rangeY) * 0.9

  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: 'var(--paper-0)', border: '1px solid var(--rule)',
      overflow: 'hidden', position: 'relative',
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size / 2}, ${size / 2}) scale(${scale}) translate(${-(minX + rangeX / 2)}, ${-(minY + rangeY / 2)})`}>
          {connections.map(conn => {
            const src = fields.find(f => f.id === conn.sourceFieldId)
            const tgt = fields.find(f => f.id === conn.targetFieldId)
            if (!src || !tgt) return null
            const sx = src.position.x + src.width / 2
            const sy = src.position.y + 60
            const tx = tgt.position.x + tgt.width / 2
            const ty = tgt.position.y
            return (
              <line key={conn.id} x1={sx} y1={sy} x2={tx} y2={ty}
                stroke="var(--ink-faint)" strokeWidth={2 / scale} opacity={0.5} />
            )
          })}
          {fields.map(f => {
            const h = 30 + f.blocks.length * 20
            return (
              <rect key={f.id} x={f.position.x} y={f.position.y}
                width={f.width} height={h} rx={6}
                fill="var(--paper-3)" stroke="var(--ink-faint)" strokeWidth={1.5 / scale} />
            )
          })}
        </g>
      </svg>
    </div>
  )
}

export function ProjectManager({
  currentId, onSwitch, onCreate, onDelete, onRename, onList, onClose,
}: ProjectManagerProps) {
  const [projects, setProjects] = useState<Workspace[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const list = await onList()
    setProjects(list.sort((a, b) => b.updatedAt - a.updatedAt))
    setLoading(false)
  }, [onList])

  useEffect(() => { refresh() }, [refresh])

  const handleCreate = async () => {
    await onCreate()
    onClose()
  }

  const handleSwitch = async (id: string) => {
    if (id === currentId) { onClose(); return }
    await onSwitch(id)
    onClose()
  }

  const handleDelete = async (id: string) => {
    await onDelete(id)
    await refresh()
  }

  const startRename = (ws: Workspace) => {
    setEditingId(ws.id)
    setEditName(ws.name)
  }

  const commitRename = (id: string) => {
    if (id === currentId) {
      onRename(editName)
    }
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: editName } : p))
    setEditingId(null)
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(40,30,15,0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--paper-2)', borderRadius: 18,
        boxShadow: 'var(--shadow-deep)',
        width: '90%', maxWidth: 680, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '16px 20px 12px',
          borderBottom: '1px dashed var(--rule)',
        }}>
          <span className="hand" style={{ fontSize: 22, fontWeight: 600, flex: 1 }}>
            プロジェクト
          </span>
          <button onClick={handleCreate} className="btn-ink sm" style={{ marginRight: 8 }}>
            <Plus size={13} /> 新規作成
          </button>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 6, border: 'none' }}>
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <p className="hand" style={{ textAlign: 'center', padding: 20, color: 'var(--ink-faint)' }}>
              読み込み中...
            </p>
          ) : projects.length === 0 ? (
            <p className="hand" style={{ textAlign: 'center', padding: 20, color: 'var(--ink-faint)' }}>
              プロジェクトがありません
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map(ws => (
                <div
                  key={ws.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: 10, borderRadius: 12, cursor: 'pointer',
                    background: ws.id === currentId ? 'rgba(40,30,15,0.06)' : 'transparent',
                    border: ws.id === currentId ? '1.5px solid var(--ink)' : '1.5px solid transparent',
                    transition: 'background 0.1s',
                  }}
                  onClick={() => handleSwitch(ws.id)}
                  onMouseEnter={e => { if (ws.id !== currentId) (e.currentTarget.style.background = 'rgba(40,30,15,0.03)') }}
                  onMouseLeave={e => { if (ws.id !== currentId) (e.currentTarget.style.background = 'transparent') }}
                >
                  <BoardThumbnail workspace={ws} size={80} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingId === ws.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        onClick={e => e.stopPropagation()}>
                        <input
                          className="analog hand"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') commitRename(ws.id); e.stopPropagation() }}
                          onKeyUp={e => e.stopPropagation()}
                          autoFocus
                          style={{ fontSize: 16, fontWeight: 600, padding: '2px 4px', border: '1px solid var(--rule)' }}
                        />
                        <button onClick={() => commitRename(ws.id)}
                          className="btn-ghost" style={{ padding: 4, border: 'none' }}>
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="hand" style={{
                        fontSize: 18, fontWeight: 600, color: 'var(--ink)',
                        display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {ws.name}
                      </span>
                    )}
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 4 }}>
                      {ws.fields.length} フィールド · {ws.connections.length} 接続 · 更新 {formatDate(ws.updatedAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => startRename(ws)}
                      className="btn-ghost" style={{ padding: 5, border: 'none' }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(ws.id)}
                      className="btn-ghost" style={{ padding: 5, border: 'none', color: 'var(--accent)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
