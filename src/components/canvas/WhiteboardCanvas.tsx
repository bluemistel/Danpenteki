'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
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
  onAddField: (position: { x: number; y: number }) => DialogueField
  onRemoveField: (id: string) => void
  onAddBlock: (fieldId: string, characterId?: string) => void
  onUpdateBlock: (fieldId: string, blockId: string, updates: Partial<DialogueBlock>) => void
  onRemoveBlock: (fieldId: string, blockId: string) => void
  onAddConnection: (conn: Omit<Connection, 'id' | 'order'>) => void
  onRemoveConnection: (id: string) => void
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void
}

function buildNodesFromFields(
  fields: DialogueField[],
  characters: Character[],
  connections: Connection[],
  selectedFieldId: string | null,
  callbacks: {
    onUpdateField: WhiteboardCanvasProps['onUpdateField']
    onAddBlock: WhiteboardCanvasProps['onAddBlock']
    onUpdateBlock: WhiteboardCanvasProps['onUpdateBlock']
    onRemoveBlock: WhiteboardCanvasProps['onRemoveBlock']
    onRemoveField: WhiteboardCanvasProps['onRemoveField']
    onRemoveConnectionsAt: (fieldId: string, handleType: 'source' | 'target', handleId: string) => void
  },
  prevNodes: Node[],
): Node[] {
  const posMap = new Map(prevNodes.map(n => [n.id, n.position]))
  return fields.map(field => ({
    id: field.id,
    type: 'dialogueField',
    position: posMap.get(field.id) || field.position,
    selected: field.id === selectedFieldId,
    data: {
      field,
      characters,
      connections,
      ...callbacks,
    } satisfies DialogueFieldNodeData,
  }))
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
  const connectingFrom = useRef<{ nodeId: string; handleId: string | null } | null>(null)

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

  const [nodes, setNodes] = useState<Node[]>([])

  // Synchronous data sync: update nodes during render (not in useEffect)
  // React detects setState during render and re-renders immediately
  // WITHOUT committing the stale intermediate state to the DOM.
  const prevSyncRef = useRef<{
    fields: DialogueField[]
    characters: Character[]
    connections: Connection[]
    selectedFieldId: string | null
    onRemoveConnectionsAt: typeof onRemoveConnectionsAt
  }>({ fields: [], characters: [], connections: [], selectedFieldId: null, onRemoveConnectionsAt })

  const prev = prevSyncRef.current
  if (
    prev.fields !== fields ||
    prev.characters !== characters ||
    prev.connections !== connections ||
    prev.selectedFieldId !== selectedFieldId ||
    prev.onRemoveConnectionsAt !== onRemoveConnectionsAt
  ) {
    prevSyncRef.current = { fields, characters, connections, selectedFieldId, onRemoveConnectionsAt }
    setNodes(prevNodes =>
      buildNodesFromFields(
        fields, characters, connections, selectedFieldId,
        { onUpdateField, onAddBlock, onUpdateBlock, onRemoveBlock, onRemoveField, onRemoveConnectionsAt },
        prevNodes,
      )
    )
  }

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
    (_event: any, params: { nodeId: string | null; handleId: string | null }) => {
      if (params.nodeId) {
        connectingFrom.current = { nodeId: params.nodeId, handleId: params.handleId }
      }
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
      const source = connectingFrom.current
      if (!source) return
      connectingFrom.current = null

      const target = (event as MouseEvent).target as HTMLElement
      if (target.closest('.react-flow__node')) return

      const position = screenToFlowPosition({
        x: (event as MouseEvent).clientX,
        y: (event as MouseEvent).clientY,
      })

      const newField = onAddField(position)
      onAddConnection({
        sourceFieldId: source.nodeId,
        targetFieldId: newField.id,
        sourceHandle: source.handleId || 'bottom',
        targetHandle: 'top',
      })
    },
    [onAddField, onAddConnection, screenToFlowPosition]
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
        nodesFocusable={false}
        edgesFocusable={false}
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
