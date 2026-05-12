'use client'

import { useMemo } from 'react'
import { DialogueField, DialogueBlock, Connection, Character } from '@/types'
import { getConnectedChain } from '@/lib/graph'

export interface PreviewItem {
  block: DialogueBlock
  character: Character | undefined
  fieldLabel: string
}

export function usePreview(
  selectedFieldId: string | null,
  fields: DialogueField[],
  connections: Connection[],
  characters: Character[]
) {
  const previewItems = useMemo<PreviewItem[]>(() => {
    if (!selectedFieldId) return []

    const chain = getConnectedChain(selectedFieldId, fields, connections)
    const charMap = new Map(characters.map(c => [c.id, c]))

    return chain.flatMap(field =>
      field.blocks.map(block => ({
        block,
        character: charMap.get(block.characterId),
        fieldLabel: field.label,
      }))
    )
  }, [selectedFieldId, fields, connections, characters])

  return previewItems
}
