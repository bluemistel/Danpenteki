'use client'

import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection as RFConnection,
  Node,
  Edge,
  NodeTypes,
  BackgroundVariant,
  OnConnectEnd,
  useReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  OnNodesChange,
  OnEdgesChange,
  NodeChange,
  SelectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { DialogueFieldNode, DialogueFieldNodeData } from './DialogueFieldNode'
import { GroupNode, GroupNodeData } from './GroupNode'
import { MemoNode, MemoNodeData } from './MemoNode'
import { SelectionToolbar } from './SelectionToolbar'
import { CanvasContextMenu } from './CanvasContextMenu'
import { DialogueField, Character, Connection, DialogueBlock, FieldGroup, Memo } from '@/types'
import { hasCycle } from '@/lib/graph'

const nodeTypes: NodeTypes = {
  dialogueField: DialogueFieldNode as any,
  fieldGroup: GroupNode as any,
  memo: MemoNode as any,
}

interface WhiteboardCanvasProps {
  fields: DialogueField[]
  connections: Connection[]
  characters: Character[]
  groups: FieldGroup[]
  memos: Memo[]
  selectedFieldId: string | null
  onSelectField: (id: string | null) => void
  onUpdateField: (id: string, updates: Partial<DialogueField>) => void
  onAddField: (position: { x: number; y: number }) => DialogueField
  onRemoveField: (id: string) => void
  onRemoveFields: (ids: string[]) => void
  onAddBlock: (fieldId: string, characterId?: string) => void
  onUpdateBlock: (fieldId: string, blockId: string, updates: Partial<DialogueBlock>) => void
  onRemoveBlock: (fieldId: string, blockId: string) => void
  onAddConnection: (conn: Omit<Connection, 'id' | 'order'>) => void
  onRemoveConnection: (id: string) => void
  onAddGroup: (fieldIds: string[], name?: string, color?: string) => FieldGroup
  onUpdateGroup: (id: string, updates: Partial<FieldGroup>) => void
  onRemoveGroup: (id: string) => void
  onAddMemo: (position: { x: number; y: number }, color?: string) => Memo
  onUpdateMemo: (id: string, updates: Partial<Memo>) => void
  onRemoveMemo: (id: string) => void
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void
  onSelectionChange?: (fieldIds: string[]) => void
}

function WhiteboardCanvasInner({
  fields,
  connections,
  characters,
  groups,
  memos,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  onAddField,
  onRemoveField,
  onRemoveFields,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onAddConnection,
  onRemoveConnection,
  onAddGroup,
  onUpdateGroup,
  onRemoveGroup,
  onAddMemo,
  onUpdateMemo,
  onRemoveMemo,
  onViewportChange,
  onSelectionChange,
}: WhiteboardCanvasProps) {
  const { screenToFlowPosition, getNodes } = useReactFlow()
  const connectingFrom = useRef<{ nodeId: string; handleId: string | null } | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; flowPos: { x: number; y: number } } | null>(null)

  const onRemoveConnectionsAt = useCallback(
    (fieldId: string, handleType: 'source' | 'target', handleId: string) => {
      const toRemove = connections.filter(c => {
        if (handleType === 'source') {
          const srcHandle = c.sourceHandle || 'bottom'
          return c.sourceFieldId === fieldId && srcHandle === handleId
        }
        const tgtHandle = c.targetHandle || 'top'
        return c.targetFieldId === fieldId && tgtHandle === handleId
      })
      for (const c of toRemove) {
        onRemoveConnection(c.id)
      }
    },
    [connections, onRemoveConnection]
  )

  // Stable callback refs — never change reference, always call latest function
  const cbRef = useRef({
    onUpdateField, onAddBlock, onUpdateBlock, onRemoveBlock,
    onRemoveField, onRemoveConnectionsAt, onUpdateGroup, onRemoveGroup,
    onUpdateMemo, onRemoveMemo,
  })
  cbRef.current = {
    onUpdateField, onAddBlock, onUpdateBlock, onRemoveBlock,
    onRemoveField, onRemoveConnectionsAt, onUpdateGroup, onRemoveGroup,
    onUpdateMemo, onRemoveMemo,
  }

  const stableCallbacks = useMemo(() => ({
    onUpdateField: (...args: Parameters<typeof onUpdateField>) => cbRef.current.onUpdateField(...args),
    onAddBlock: (...args: Parameters<typeof onAddBlock>) => cbRef.current.onAddBlock(...args),
    onUpdateBlock: (...args: Parameters<typeof onUpdateBlock>) => cbRef.current.onUpdateBlock(...args),
    onRemoveBlock: (...args: Parameters<typeof onRemoveBlock>) => cbRef.current.onRemoveBlock(...args),
    onRemoveField: (...args: Parameters<typeof onRemoveField>) => cbRef.current.onRemoveField(...args),
    onRemoveConnectionsAt: (...args: Parameters<typeof onRemoveConnectionsAt>) => cbRef.current.onRemoveConnectionsAt(...args),
    onUpdateGroup: (...args: Parameters<typeof onUpdateGroup>) => cbRef.current.onUpdateGroup(...args),
    onRemoveGroup: (...args: Parameters<typeof onRemoveGroup>) => cbRef.current.onRemoveGroup(...args),
    onUpdateMemo: (...args: Parameters<typeof onUpdateMemo>) => cbRef.current.onUpdateMemo(...args),
    onRemoveMemo: (...args: Parameters<typeof onRemoveMemo>) => cbRef.current.onRemoveMemo(...args),
  }), [])

  const [nodes, setNodes] = useState<Node[]>([])

  // Build node data object (memoized per field to reduce re-renders)
  const nodeDataMap = useMemo(() => {
    const map = new Map<string, DialogueFieldNodeData>()
    for (const field of fields) {
      map.set(field.id, {
        field,
        characters,
        connections,
        ...stableCallbacks,
      })
    }
    return map
  }, [fields, characters, connections, stableCallbacks])

  // Sync field/group changes to nodes, preserving React Flow internals
  useEffect(() => {
    setNodes(prevNodes => {
      const prevMap = new Map(prevNodes.map(n => [n.id, n]))
      const fieldIdSet = new Set(fields.map(f => f.id))

      // Build field nodes - preserve ALL existing properties including selected
      const fieldNodes: Node[] = fields.map(field => {
        const existing = prevMap.get(field.id)
        if (existing) {
          // Only update data and style width, keep everything else (selected, position, measured, etc.)
          const newData = nodeDataMap.get(field.id)!
          if (existing.data === newData && (existing.style as any)?.width === field.width) {
            if ((existing.style as any)?.height != null) {
              return { ...existing, style: { ...existing.style, height: undefined } }
            }
            return existing // No change, reuse same object
          }
          return {
            ...existing,
            style: { ...existing.style, width: field.width, height: undefined },
            data: newData,
          }
        }
        // New node
        return {
          id: field.id,
          type: 'dialogueField' as const,
          position: field.position,
          style: { width: field.width },
          data: nodeDataMap.get(field.id)!,
        }
      })

      // Build group nodes from measured field positions
      const measuredNodes = getNodes()
      const measuredMap = new Map(measuredNodes.map(n => [n.id, n]))

      const groupNodes: Node[] = groups.map(group => {
        const memberNodes = group.fieldIds
          .map(fid => measuredMap.get(fid) || fieldNodes.find(n => n.id === fid))
          .filter(Boolean) as Node[]
        if (memberNodes.length === 0) return null!

        const padding = 30
        const labelHeight = 36
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const n of memberNodes) {
          const w = n.measured?.width ?? (n.style as any)?.width ?? 280
          const h = n.measured?.height ?? 200
          minX = Math.min(minX, n.position.x)
          minY = Math.min(minY, n.position.y)
          maxX = Math.max(maxX, n.position.x + w)
          maxY = Math.max(maxY, n.position.y + h)
        }

        const groupId = `group-${group.id}`
        const existing = prevMap.get(groupId)
        const pos = { x: minX - padding, y: minY - padding - labelHeight }
        const style = {
          width: maxX - minX + padding * 2,
          height: maxY - minY + padding * 2 + labelHeight,
        }

        return {
          ...(existing || {}),
          id: groupId,
          type: 'fieldGroup' as const,
          position: pos,
          style,
          selectable: false,
          draggable: false,
          connectable: false,
          focusable: false,
          zIndex: -1,
          data: {
            group,
            ...stableCallbacks,
          } satisfies GroupNodeData,
        } as Node
      }).filter(Boolean)

      // Build memo nodes
      const memoNodes: Node[] = memos.map(memo => {
        const memoId = `memo-${memo.id}`
        const existing = prevMap.get(memoId)
        const newData: MemoNodeData = {
          memo,
          ...stableCallbacks,
        }
        if (existing) {
          if (existing.data === newData && (existing.style as any)?.width === memo.width) {
            if ((existing.style as any)?.height != null) {
              return { ...existing, style: { ...existing.style, height: undefined } }
            }
            return existing
          }
          return {
            ...existing,
            style: { ...existing.style, width: memo.width, height: undefined },
            data: newData,
          }
        }
        return {
          id: memoId,
          type: 'memo' as const,
          position: memo.position,
          style: { width: memo.width },
          connectable: false,
          data: newData,
        }
      })

      return [...groupNodes, ...memoNodes, ...fieldNodes]
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, nodeDataMap, groups, memos, stableCallbacks, getNodes])

  const edges: Edge[] = useMemo(
    () =>
      connections.map(conn => ({
        id: conn.id,
        source: conn.sourceFieldId,
        target: conn.targetFieldId,
        sourceHandle: conn.sourceHandle || undefined,
        targetHandle: conn.targetHandle || undefined,
        type: 'default',
        animated: true,
        style: { stroke: '#6b7280', strokeWidth: 2 },
        markerEnd: { type: 'arrowclosed' as any, color: '#6b7280' },
      })),
    [connections]
  )

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(nds => applyNodeChanges(changes, nds))

      // Track primary selection for preview (skip group and memo nodes)
      for (const change of changes) {
        if (change.type === 'select' && change.selected && !change.id.startsWith('group-') && !change.id.startsWith('memo-')) {
          onSelectField(change.id)
        }
      }
    },
    [onSelectField]
  )

  // Track multi-selection via React Flow's onSelectionChange
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[]; edges: Edge[] }) => {
      const ids = selectedNodes
        .filter(n => !n.id.startsWith('group-'))
        .map(n => n.id)
      setSelectedIds(ids)
      onSelectionChange?.(ids)
    },
    [onSelectionChange]
  )

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, _node: Node, draggedNodes: Node[]) => {
      for (const n of draggedNodes) {
        if (n.id.startsWith('group-')) continue
        if (n.id.startsWith('memo-')) {
          const memoId = n.id.replace('memo-', '')
          onUpdateMemo(memoId, { position: n.position })
        } else {
          onUpdateField(n.id, { position: n.position })
        }
      }
    },
    [onUpdateField, onUpdateMemo]
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    changes => {
      for (const change of changes) {
        if (change.type === 'remove') {
          onRemoveConnection(change.id)
        }
      }
    },
    [onRemoveConnection]
  )

  const onConnectStart = useCallback(
    (_event: any, params: { nodeId: string | null; handleId: string | null }) => {
      if (params.nodeId) {
        connectingFrom.current = { nodeId: params.nodeId, handleId: params.handleId }
      }
    },
    []
  )

  const onConnect = useCallback(
    (params: RFConnection) => {
      connectingFrom.current = null
      if (!params.source || !params.target) return
      if (params.source === params.target) return

      if (hasCycle(connections, params.source, params.target)) {
        return
      }

      onAddConnection({
        sourceFieldId: params.source,
        targetFieldId: params.target,
        sourceHandle: params.sourceHandle || 'bottom',
        targetHandle: params.targetHandle || 'top',
      })
    },
    [connections, onAddConnection]
  )

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const source = connectingFrom.current
      if (!source) return
      connectingFrom.current = null

      const target = (event as MouseEvent).target as HTMLElement
      if (target.closest('.react-flow__node')) return

      const dropPos = screenToFlowPosition({
        x: (event as MouseEvent).clientX,
        y: (event as MouseEvent).clientY,
      })

      const defaultWidth = 280
      // Determine which target handle the new node should receive the connection on,
      // then offset so that handle aligns with the drop point
      const sourceHandle = source.handleId || 'bottom'
      let targetHandle: string
      let position: { x: number; y: number }

      if (sourceHandle === 'right-source') {
        targetHandle = 'left-target'
        position = { x: dropPos.x, y: dropPos.y - 40 }
      } else if (sourceHandle === 'bottom') {
        targetHandle = 'top'
        position = { x: dropPos.x - defaultWidth / 2, y: dropPos.y }
      } else {
        targetHandle = 'top'
        position = { x: dropPos.x - defaultWidth / 2, y: dropPos.y }
      }

      const newField = onAddField(position)
      onAddConnection({
        sourceFieldId: source.nodeId,
        targetFieldId: newField.id,
        sourceHandle,
        targetHandle,
      })
    },
    [onAddField, onAddConnection, screenToFlowPosition]
  )

  const onPaneClick = useCallback(() => {
    onSelectField(null)
    setSelectedIds([])
    setContextMenu(null)
  }, [onSelectField])

  const onDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('.react-flow__node')) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      onAddField(position)
    },
    [onAddField, screenToFlowPosition]
  )

  const handleCreateGroup = useCallback(
    (fieldIds: string[]) => {
      onAddGroup(fieldIds)
    },
    [onAddGroup]
  )

  const handleDeleteSelected = useCallback(
    (fieldIds: string[]) => {
      onRemoveFields(fieldIds)
      setSelectedIds([])
    },
    [onRemoveFields]
  )

  // Right-click: short press → context menu, drag → pan
  const wrapperRef = useRef<HTMLDivElement>(null)
  const rightClickStart = useRef<{ x: number; y: number; time: number } | null>(null)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        rightClickStart.current = { x: e.clientX, y: e.clientY, time: Date.now() }
      }
    }

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      const start = rightClickStart.current
      rightClickStart.current = null
      if (!start) return

      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const elapsed = Date.now() - start.time

      if (dist > 5 || elapsed > 300) return

      const target = e.target as HTMLElement
      if (target.closest('.react-flow__node')) return

      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      setContextMenu({ x: e.clientX, y: e.clientY, flowPos })
    }

    el.addEventListener('mousedown', onMouseDown, true)
    el.addEventListener('contextmenu', onContextMenu, true)
    return () => {
      el.removeEventListener('mousedown', onMouseDown, true)
      el.removeEventListener('contextmenu', onContextMenu, true)
    }
  }, [screenToFlowPosition])

  return (
    <div ref={wrapperRef} className="w-full h-full" style={{ position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgesChange={onEdgesChange}
        onConnectStart={onConnectStart}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onPaneClick={onPaneClick}
        onDoubleClick={onDoubleClick}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        zoomOnDoubleClick={false}
        deleteKeyCode={null}
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectionKeyCode={null}
        multiSelectionKeyCode="Shift"
        selectionMode={SelectionMode.Partial}
        nodesFocusable={false}
        edgesFocusable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1.1} color="var(--rule)" />
        <Controls />
        <MiniMap
          pannable
          zoomable
          nodeColor={(node) => {
            if (node.id.startsWith('group-')) return 'transparent'
            if (node.id.startsWith('memo-')) return '#e8d97f'
            return 'var(--ink-faint)'
          }}
          maskColor="rgba(40,30,15,0.06)"
          style={{ background: 'var(--paper-2)', border: '1px solid #d8cdb6', borderRadius: 12 }}
        />
      </ReactFlow>
      <SelectionToolbar
        selectedFieldIds={selectedIds}
        onCreateGroup={handleCreateGroup}
        onDeleteSelected={handleDeleteSelected}
      />
      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onAddField={() => onAddField(contextMenu.flowPos)}
          onAddMemo={() => onAddMemo(contextMenu.flowPos)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

export function WhiteboardCanvas(props: WhiteboardCanvasProps) {
  return (
    <ReactFlowProvider>
      <WhiteboardCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
