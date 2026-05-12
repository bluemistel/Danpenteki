'use client'

import { useCallback } from 'react'
import { PreviewItem, PreviewFieldGroup } from '@/hooks/usePreview'
import { FaceIcon } from '../characters/FaceIcon'
import { Download } from 'lucide-react'

interface PreviewPaneProps {
  items: PreviewItem[]
  groups: PreviewFieldGroup[]
  selectedFieldId: string | null
}

function exportAsCSV(items: PreviewItem[]) {
  const lines = items.map(item => {
    const speaker = item.character?.name || 'ナレーション'
    const text = item.block.text
    return `${speaker},${text}`
  })
  const bom = '﻿'
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'dialogue.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function TreePrefix({ prefixes }: { prefixes: string[] }) {
  if (prefixes.length === 0) return null
  return (
    <span className="mono" style={{
      color: 'var(--ink-faint)', fontSize: 13, lineHeight: 1,
      whiteSpace: 'pre', userSelect: 'none', flexShrink: 0,
    }}>
      {prefixes.map((p, i) => {
        if (i < prefixes.length - 1) {
          return p === '│' ? '│ ' : '  '
        }
        return p === '├' ? '├─' : '└─'
      }).join('')}
    </span>
  )
}

export function PreviewPane({ items, groups, selectedFieldId }: PreviewPaneProps) {
  const handleExport = useCallback(() => {
    if (items.length > 0) exportAsCSV(items)
  }, [items])

  if (!selectedFieldId) {
    return (
      <div className="paper-grain" style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--paper-2)', padding: 24,
      }}>
        <p className="hand" style={{ fontSize: 18, color: 'var(--ink-faint)', textAlign: 'center', lineHeight: 1.6 }}>
          フィールドを選択すると<br />会話が表示されます
        </p>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="paper-grain" style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--paper-2)', padding: 24,
      }}>
        <p className="hand" style={{ fontSize: 18, color: 'var(--ink-faint)', textAlign: 'center', lineHeight: 1.6 }}>
          フィールドにブロックを<br />追加してください
        </p>
      </div>
    )
  }

  return (
    <div className="paper-grain" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper-2)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        padding: '6px 12px', borderBottom: '1px dashed var(--rule)',
        position: 'relative', zIndex: 2,
      }}>
        <button onClick={handleExport} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 11, gap: 4 }}>
          <Download size={12} />
          エクスポート
        </button>
      </div>

      {/* Dialogue list with tree */}
      <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px', position: 'relative', zIndex: 2 }}>
        {groups.map((group, gi) => (
          <div key={group.field.id} style={{ marginTop: gi > 0 ? 14 : 0 }}>
            {/* Field header with tree prefix */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 8,
            }}>
              <TreePrefix prefixes={group.prefixes} />
              <span className="hand hand-underline" style={{
                fontSize: 15, fontWeight: 600, color: 'var(--ink-soft)',
                textAlign: 'center',
              }}>
                {group.field.label}
              </span>
              <div style={{ flex: 1, height: 1, borderBottom: '1px dashed var(--rule)' }} />
            </div>

            {/* Blocks in this field */}
            {group.items.map((item, bi) => {
              const continuationPrefix = group.prefixes.length > 0
                ? group.prefixes.map((p, i) => {
                    if (i < group.prefixes.length - 1) {
                      return p === '│' ? '│ ' : '  '
                    }
                    return p === '├' ? '│ ' : '  '
                  }).join('')
                : ''

              return (
                <div key={item.block.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  marginTop: bi > 0 ? 8 : 0,
                }}>
                  {continuationPrefix && (
                    <span className="mono" style={{
                      color: 'var(--ink-faint)', fontSize: 13, lineHeight: 1,
                      whiteSpace: 'pre', userSelect: 'none', flexShrink: 0,
                      marginTop: 8,
                    }}>
                      {continuationPrefix}
                    </span>
                  )}
                  <FaceIcon character={item.character} size={32} emotion={item.block.emotion} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginBottom: 3 }}>
                      {item.character?.name || 'ナレーション'}
                    </div>
                    <div style={{
                      fontSize: 13, lineHeight: 1.6, color: 'var(--ink)',
                      background: 'var(--paper-3)',
                      border: '1px solid #d8cdb6',
                      borderRadius: 10,
                      padding: '8px 12px',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 1px 2px rgba(40,30,15,0.06)',
                      borderLeft: `3px solid ${item.character?.backgroundColor || 'var(--ink-faint)'}`,
                    }}>
                      {item.block.text || <span style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}>（空）</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
