import { DialogueField, Connection, Character, FieldGroup } from '@/types'
import { getConnectedTree } from './graph'

function charName(characters: Character[], charId: string): string {
  return characters.find(c => c.id === charId)?.name || 'ナレーション'
}

function fieldLabel(field: DialogueField): string {
  return field.label || '(無題)'
}

/** Mermaid node ID: alphanumeric only */
function mermaidId(fieldId: string): string {
  return 'f_' + fieldId.replace(/[^a-zA-Z0-9]/g, '')
}

/** Escape label for Mermaid (quotes inside brackets) */
function mermaidLabel(label: string): string {
  return label.replace(/"/g, "'")
}

/** Generate Mermaid flowchart from fields & connections */
function buildMermaidFlowchart(
  fields: DialogueField[],
  connections: Connection[],
): string {
  const lines: string[] = []
  lines.push('```mermaid')
  lines.push('flowchart TD')

  // Nodes
  for (const f of fields) {
    const id = mermaidId(f.id)
    const label = mermaidLabel(fieldLabel(f))
    const blockCount = f.blocks.length
    lines.push(`    ${id}["${label} (${blockCount})"]`)
  }

  // Edges
  for (const conn of connections) {
    const src = mermaidId(conn.sourceFieldId)
    const tgt = mermaidId(conn.targetFieldId)
    lines.push(`    ${src} --> ${tgt}`)
  }

  lines.push('```')
  return lines.join('\n')
}

/* ─── Preview (connected chain) as Markdown ─── */

export function exportPreviewMarkdown(
  startFieldId: string,
  fields: DialogueField[],
  connections: Connection[],
  characters: Character[],
  projectName: string,
): string {
  const tree = getConnectedTree(startFieldId, fields, connections)
  const lines: string[] = []

  lines.push(`# ${projectName}`)
  lines.push('')

  // Mermaid flowchart for the connected chain
  const chainFieldIds = new Set(tree.map(n => n.field.id))
  const chainFields = tree.map(n => n.field)
  const chainConns = connections.filter(
    c => chainFieldIds.has(c.sourceFieldId) && chainFieldIds.has(c.targetFieldId)
  )
  lines.push(buildMermaidFlowchart(chainFields, chainConns))
  lines.push('')

  // Dialogue content
  for (const node of tree) {
    const indent = node.depth > 0 ? '#'.repeat(Math.min(node.depth, 4)) : ''
    const heading = indent ? `##${indent}` : '##'
    lines.push(`${heading} ${fieldLabel(node.field)}`)
    lines.push('')

    for (const block of node.field.blocks) {
      const name = charName(characters, block.characterId)
      const text = block.text || '（空）'
      lines.push(`**${name}**`)
      lines.push(`${text}`)
      lines.push('')
    }
  }

  return lines.join('\n')
}

/* ─── Full project as Markdown ─── */

export function exportFullMarkdown(
  fields: DialogueField[],
  connections: Connection[],
  characters: Character[],
  groups: FieldGroup[],
  projectName: string,
): string {
  const lines: string[] = []

  lines.push(`# ${projectName}`)
  lines.push('')

  // Characters
  if (characters.length > 0) {
    lines.push('## キャラクター')
    lines.push('')
    for (const c of characters) {
      const group = c.group ? ` (${c.group})` : ''
      lines.push(`- **${c.name}**${group}`)
    }
    lines.push('')
  }

  // Groups
  if (groups.length > 0) {
    lines.push('## グループ')
    lines.push('')
    const fieldMap = new Map(fields.map(f => [f.id, f]))
    for (const g of groups) {
      const members = g.fieldIds
        .map(id => fieldMap.get(id))
        .filter(Boolean)
        .map(f => fieldLabel(f!))
        .join(', ')
      lines.push(`- **${g.name}**: ${members}`)
    }
    lines.push('')
  }

  // Dialogue flow — Mermaid flowchart
  lines.push('## 会話フロー')
  lines.push('')
  lines.push(buildMermaidFlowchart(fields, connections))
  lines.push('')

  // Full dialogue content
  lines.push('---')
  lines.push('')
  lines.push('## 全セリフ')
  lines.push('')

  for (const field of fields) {
    if (field.blocks.length === 0) continue

    lines.push(`### ${fieldLabel(field)}`)
    lines.push('')

    for (const block of field.blocks) {
      const name = charName(characters, block.characterId)
      const text = block.text || '（空）'
      lines.push(`**${name}**`)
      lines.push(`${text}`)
      lines.push('')
    }
  }

  return lines.join('\n')
}

/* ─── Download helper ─── */

export function downloadMarkdown(content: string, filename: string) {
  triggerDownload(
    new Blob(['﻿' + content], { type: 'text/markdown;charset=utf-8' }),
    filename,
  )
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 200)
}
