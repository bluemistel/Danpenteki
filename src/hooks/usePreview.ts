'use client'

import { useMemo } from 'react'
import { DialogueField, DialogueBlock, Connection, Character } from '@/types'
import { getConnectedTree } from '@/lib/graph'

export interface PreviewItem {
  block: DialogueBlock
  character: Character | undefined
  fieldLabel: string
}

export interface PreviewFieldGroup {
  field: DialogueField
  depth: number
  isLastStack: boolean[]
  items: { block: DialogueBlock; character: Character | undefined }[]
}

export function usePreview(
  selectedFieldId: string | null,
  fields: DialogueField[],
  connections: Connection[],
  characters: Character[]
) {
  const previewItems = useMemo<PreviewItem[]>(() => {
    if (!selectedFieldId) return []
    const tree = getConnectedTree(selectedFieldId, fields, connections)
    const charMap = new Map(characters.map(c => [c.id, c]))
    return tree.flatMap(n =>
      n.field.blocks.map(block => ({
        block,
        character: charMap.get(block.characterId),
        fieldLabel: n.field.label,
      }))
    )
  }, [selectedFieldId, fields, connections, characters])

  const previewGroups = useMemo<PreviewFieldGroup[]>(() => {
    if (!selectedFieldId) return []
    const tree = getConnectedTree(selectedFieldId, fields, connections)
    const charMap = new Map(characters.map(c => [c.id, c]))
    return tree.map(n => ({
      field: n.field,
      depth: n.depth,
      isLastStack: n.isLastStack,
      items: n.field.blocks.map(block => ({
        block,
        character: charMap.get(block.characterId),
      })),
    }))
  }, [selectedFieldId, fields, connections, characters])

  return { previewItems, previewGroups }
}
