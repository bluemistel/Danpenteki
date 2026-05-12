'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Workspace, DialogueField, DialogueBlock, Connection, Character } from '@/types'
import { generateId } from '@/lib/id'
import { saveWorkspace, loadWorkspace } from '@/lib/storage'
import { useUndoRedo } from './useUndoRedo'

const DEFAULT_WORKSPACE_ID = 'default'

function createDefaultWorkspace(): Workspace {
  return {
    id: DEFAULT_WORKSPACE_ID,
    name: '新しいワークスペース',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    characters: [],
    fields: [],
    connections: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  }
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(createDefaultWorkspace)
  const [loaded, setLoaded] = useState(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { canUndo, canRedo, pushSnapshot, undo: undoSnap, redo: redoSnap } = useUndoRedo()
  const prevWsRef = useRef<Workspace | null>(null)
  const skipHistoryRef = useRef(false)

  useEffect(() => {
    loadWorkspace(DEFAULT_WORKSPACE_ID).then(ws => {
      if (ws) setWorkspace(ws)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false
    } else if (prevWsRef.current) {
      const prev = prevWsRef.current
      const dataChanged =
        prev.fields !== workspace.fields ||
        prev.connections !== workspace.connections ||
        prev.characters !== workspace.characters
      if (dataChanged) {
        pushSnapshot(prev)
      }
    }
    prevWsRef.current = workspace
  }, [workspace, loaded, pushSnapshot])

  useEffect(() => {
    if (!loaded) return
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      saveWorkspace({ ...workspace, updatedAt: Date.now() })
    }, 500)
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [workspace, loaded])

  const addField = useCallback((position: { x: number; y: number }) => {
    const field: DialogueField = {
      id: generateId(),
      label: '新しいフィールド',
      blocks: [],
      position,
      width: 280,
      collapsed: false,
    }
    setWorkspace(ws => ({ ...ws, fields: [...ws.fields, field] }))
    return field
  }, [])

  const updateField = useCallback((id: string, updates: Partial<DialogueField>) => {
    setWorkspace(ws => ({
      ...ws,
      fields: ws.fields.map(f => (f.id === id ? { ...f, ...updates } : f)),
    }))
  }, [])

  const removeField = useCallback((id: string) => {
    setWorkspace(ws => ({
      ...ws,
      fields: ws.fields.filter(f => f.id !== id),
      connections: ws.connections.filter(
        c => c.sourceFieldId !== id && c.targetFieldId !== id
      ),
    }))
  }, [])

  const addBlock = useCallback((fieldId: string, characterId?: string) => {
    setWorkspace(ws => {
      const field = ws.fields.find(f => f.id === fieldId)
      const lastCharId = characterId ?? (field?.blocks.length ? field.blocks[field.blocks.length - 1].characterId : '')
      const block: DialogueBlock = {
        id: generateId(),
        characterId: lastCharId,
        emotion: 'normal',
        text: '',
      }
      return {
        ...ws,
        fields: ws.fields.map(f =>
          f.id === fieldId ? { ...f, blocks: [...f.blocks, block] } : f
        ),
      }
    })
  }, [])

  const updateBlock = useCallback(
    (fieldId: string, blockId: string, updates: Partial<DialogueBlock>) => {
      setWorkspace(ws => ({
        ...ws,
        fields: ws.fields.map(f =>
          f.id === fieldId
            ? {
                ...f,
                blocks: f.blocks.map(b =>
                  b.id === blockId ? { ...b, ...updates } : b
                ),
              }
            : f
        ),
      }))
    },
    []
  )

  const removeBlock = useCallback((fieldId: string, blockId: string) => {
    setWorkspace(ws => ({
      ...ws,
      fields: ws.fields.map(f =>
        f.id === fieldId
          ? { ...f, blocks: f.blocks.filter(b => b.id !== blockId) }
          : f
      ),
    }))
  }, [])

  const moveBlock = useCallback(
    (fieldId: string, fromIndex: number, toIndex: number) => {
      setWorkspace(ws => ({
        ...ws,
        fields: ws.fields.map(f => {
          if (f.id !== fieldId) return f
          const blocks = [...f.blocks]
          const [moved] = blocks.splice(fromIndex, 1)
          blocks.splice(toIndex, 0, moved)
          return { ...f, blocks }
        }),
      }))
    },
    []
  )

  const addConnection = useCallback(
    (conn: Omit<Connection, 'id' | 'order'>) => {
      const connection: Connection = {
        ...conn,
        id: generateId(),
        order: 0,
      }
      setWorkspace(ws => {
        const sameSourceCount = ws.connections.filter(
          c => c.sourceFieldId === conn.sourceFieldId
        ).length
        return {
          ...ws,
          connections: [
            ...ws.connections,
            { ...connection, order: sameSourceCount },
          ],
        }
      })
      return connection
    },
    []
  )

  const removeConnection = useCallback((id: string) => {
    setWorkspace(ws => ({
      ...ws,
      connections: ws.connections.filter(c => c.id !== id),
    }))
  }, [])

  const setCharacters = useCallback((characters: Character[]) => {
    setWorkspace(ws => ({ ...ws, characters }))
  }, [])

  const setViewport = useCallback(
    (viewport: { x: number; y: number; zoom: number }) => {
      setWorkspace(ws => ({ ...ws, viewport }))
    },
    []
  )

  const undo = useCallback(() => {
    const snap = undoSnap(workspace)
    if (snap) {
      skipHistoryRef.current = true
      setWorkspace(ws => ({ ...ws, ...snap }))
    }
  }, [workspace, undoSnap])

  const redo = useCallback(() => {
    const snap = redoSnap(workspace)
    if (snap) {
      skipHistoryRef.current = true
      setWorkspace(ws => ({ ...ws, ...snap }))
    }
  }, [workspace, redoSnap])

  return {
    workspace,
    loaded,
    addField,
    updateField,
    removeField,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    addConnection,
    removeConnection,
    setCharacters,
    setViewport,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}
