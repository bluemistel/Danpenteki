'use client'

import { useCallback, useMemo, useRef, useEffect, useState } from 'react'
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
  applyEdgeChanges,
  OnNodesChange,
  OnEdgesChange,
  NodeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { DialogueFieldNode, DialogueFieldNodeData } from './DialogueFieldNode'
import { DialogueField, Character, Connection, DialogueBlock } from '@/types'
import { hasCycle } from '@/lib/graph'

const nodeTypes: NodeTypes = {
  dialogueField: DialogueFieldNode as any,
}

interface WhiteboardCanvasProps {
  fields: DialogueField[]
  connections: Connection[]
  characters: Character[]
  selectedFieldId: string | null
  onSelectField: (id: string | null) => void
  onUpdateField: (id: string, updates: Partial<DialogueField>) => void
  onAddField: (position: { x: number; y: number }) => void
  onRemoveField: (id: string) => void
  onAddBlock: (fieldId: string, characterId?: string) => void
  onUpdateBlock: (fieldId: string, blockId: string, updates: Partial<DialogueBlock>) => void
  onRemoveBlock: (fieldId: string, blockId: string) => void
  onAddConnection: (conn: Omit<Connection, 'id' | 'order'>) => void
  onRemoveConnection: (id: string) => void
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void
}

function WhiteboardCanvasInner({
  fields,
  connections,
  characters,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  onAddField,
  onRemoveField,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onAddConnection,
  onRemoveConnection,
  onViewportChange,
}: WhiteboardCanvasProps) {
  const { screenToFlowPosition } = useReactFlow()
  const connectingFrom = useRef<string | null>(null)

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

  const buildNodes = useCallback((): Node[] => {
    return fields.map(field => ({
      id: field.id,
      type: 'dialogueField',
      position: field.position,
      selected: field.id === selectedFieldId,
      data: {
        field,
        characters,
        connections,
        onUpdateField,
        onAddBlock,
        onUpdateBlock,
        onRemoveBlock,
        onRemoveField,
        onRemoveConnectionsAt,
      } satisfies DialogueFieldNodeData,
    }))
  }, [fields, characters, connections, selectedFieldId, onUpdateField, onAddBlock, onUpdateBlock, onRemoveBlock, onRemoveField, onRemoveConnectionsAt])

  const [nodes, setNodes] = useState<Node[]>(buildNodes)

  useEffect(() => {
    setNodes(buildNodes())
  }, [buildNodes])

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

      for (const change of changes) {
        if (change.type === 'select' && change.selected) {
          onSelectField(change.id)
        }
      }
    },
    [onSelectField]
  )

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onUpdateField(node.id, { position: node.position })
    },
    [onUpdateField]
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
    (_event: any, params: { nodeId: string | null }) => {
      connectingFrom.current = params.nodeId
    },
    []
  )

  const onConnect = useCallback(
    (params: RFConnection) => {
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
      const sourceId = connectingFrom.current
      if (!sourceId) return
      connectingFrom.current = null

      const target = (event as MouseEvent).target as HTMLElement
      if (target.closest('.react-flow__node')) return

      const position = screenToFlowPosition({
        x: (event as MouseEvent).clientX,
        y: (event as MouseEvent).clientY,
      })

      onAddField(position)
    },
    [onAddField, screenToFlowPosition]
  )

  const onPaneClick = useCallback(() => {
    onSelectField(null)
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

  return (
    <div className="w-full h-full">
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
        nodeTypes={nodeTypes}
        fitView
        zoomOnDoubleClick={false}
        deleteKeyCode={null}
        multiSelectionKeyCode="Shift"
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1.1} color="var(--rule)" />
        <Controls />
        <MiniMap
          pannable
          zoomable
          nodeColor={() => 'var(--ink-faint)'}
          maskColor="rgba(40,30,15,0.06)"
          style={{ background: 'var(--paper-2)', border: '1px solid #d8cdb6', borderRadius: 12 }}
        />
      </ReactFlow>
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
