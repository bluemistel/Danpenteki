'use client'

import { useMemo } from 'react'
import { useReactFlow, useViewport } from '@xyflow/react'
import { Layers, Trash2 } from 'lucide-react'

interface SelectionToolbarProps {
  selectedFieldIds: string[]
  onCreateGroup: (fieldIds: string[]) => void
  onDeleteSelected: (fieldIds: string[]) => void
}

export function SelectionToolbar({
  selectedFieldIds,
  onCreateGroup,
  onDeleteSelected,
}: SelectionToolbarProps) {
  const { getNodes } = useReactFlow()
  const viewport = useViewport()

  const position = useMemo(() => {
    if (selectedFieldIds.length < 2) return null
    const nodes = getNodes().filter(n =>
      selectedFieldIds.includes(n.id) && !n.id.startsWith('group-')
    )
    if (nodes.length < 2) return null

    let minX = Infinity, minY = Infinity, maxX = -Infinity
    for (const n of nodes) {
      const w = n.measured?.width ?? (n.style as any)?.width ?? 280
      minX = Math.min(minX, n.position.x)
      minY = Math.min(minY, n.position.y)
      maxX = Math.max(maxX, n.position.x + w)
    }

    const centerX = (minX + maxX) / 2
    const topY = minY

    // Convert flow coords to screen coords relative to the container
    const screenX = centerX * viewport.zoom + viewport.x
    const screenY = topY * viewport.zoom + viewport.y - 48

    return { x: screenX, y: Math.max(4, screenY) }
  }, [selectedFieldIds, getNodes, viewport])

  if (!position || selectedFieldIds.length < 2) return null

  return (
    <div
      className="selection-toolbar"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)',
        zIndex: 10,
        pointerEvents: 'all',
      }}
    >
      <button
        className="selection-toolbar-btn"
        onClick={() => onCreateGroup(selectedFieldIds)}
        title="グループ作成"
      >
        <Layers size={15} />
      </button>
      <button
        className="selection-toolbar-btn"
        onClick={() => onDeleteSelected(selectedFieldIds)}
        title="選択フィールドを削除"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
