'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Workspace, DialogueField, DialogueBlock, Connection, Character, FieldGroup, Memo } from '@/types'
import { generateId } from '@/lib/id'
import { saveWorkspace, loadWorkspace, listWorkspaces as listWs, deleteWorkspace as deleteWs } from '@/lib/storage'
import { useUndoRedo } from './useUndoRedo'

const LAST_WS_KEY = 'danpenteki-last-workspace'

function createNewWorkspace(name = '新しいプロジェクト'): Workspace {
  return {
    id: generateId(),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    characters: [],
    fields: [],
    connections: [],
    groups: [],
    memos: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  }
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(createNewWorkspace)
  const [loaded, setLoaded] = useState(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { canUndo, canRedo, pushSnapshot, undo: undoSnap, redo: redoSnap, clear: clearHistory } = useUndoRedo()
  const prevWsRef = useRef<Workspace | null>(null)
  const skipHistoryRef = useRef(false)

  useEffect(() => {
    (async () => {
      const lastId = localStorage.getItem(LAST_WS_KEY)
      if (lastId) {
        const ws = await loadWorkspace(lastId)
        if (ws) { setWorkspace(ws); setLoaded(true); return }
      }
      const all = await listWs()
      if (all.length > 0) {
        const latest = all.sort((a, b) => b.updatedAt - a.updatedAt)[0]
        setWorkspace(latest)
      }
      setLoaded(true)
    })()
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
        prev.characters !== workspace.characters ||
        prev.groups !== workspace.groups ||
        prev.memos !== workspace.memos
      if (dataChanged) {
        pushSnapshot(prev)
      }
    }
    prevWsRef.current = workspace
  }, [workspace, loaded, pushSnapshot])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(LAST_WS_KEY, workspace.id)
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
      label: '',
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
      groups: ws.groups
        .map(g => ({ ...g, fieldIds: g.fieldIds.filter(fid => fid !== id) }))
        .filter(g => g.fieldIds.length > 0),
    }))
  }, [])

  const removeFields = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setWorkspace(ws => ({
      ...ws,
      fields: ws.fields.filter(f => !idSet.has(f.id)),
      connections: ws.connections.filter(
        c => !idSet.has(c.sourceFieldId) && !idSet.has(c.targetFieldId)
      ),
      groups: ws.groups
        .map(g => ({ ...g, fieldIds: g.fieldIds.filter(fid => !idSet.has(fid)) }))
        .filter(g => g.fieldIds.length > 0),
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

  const addGroup = useCallback((fieldIds: string[], name?: string, color?: string) => {
    const group: FieldGroup = {
      id: generateId(),
      name: name || '',
      color: color || '#c2543a',
      fieldIds,
    }
    setWorkspace(ws => ({ ...ws, groups: [...ws.groups, group] }))
    return group
  }, [])

  const updateGroup = useCallback((id: string, updates: Partial<FieldGroup>) => {
    setWorkspace(ws => ({
      ...ws,
      groups: ws.groups.map(g => g.id === id ? { ...g, ...updates } : g),
    }))
  }, [])

  const removeGroup = useCallback((id: string) => {
    setWorkspace(ws => ({
      ...ws,
      groups: ws.groups.filter(g => g.id !== id),
    }))
  }, [])

  const addMemo = useCallback((position: { x: number; y: number }, color?: string) => {
    const memo: Memo = {
      id: generateId(),
      text: '',
      color: color || '#f5edd4',
      position,
      width: 200,
    }
    setWorkspace(ws => ({ ...ws, memos: [...ws.memos, memo] }))
    return memo
  }, [])

  const updateMemo = useCallback((id: string, updates: Partial<Memo>) => {
    setWorkspace(ws => ({
      ...ws,
      memos: ws.memos.map(m => (m.id === id ? { ...m, ...updates } : m)),
    }))
  }, [])

  const removeMemo = useCallback((id: string) => {
    setWorkspace(ws => ({
      ...ws,
      memos: ws.memos.filter(m => m.id !== id),
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

  const renameWorkspace = useCallback((name: string) => {
    setWorkspace(ws => ({ ...ws, name }))
  }, [])

  const switchWorkspace = useCallback(async (id: string) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current)
      await saveWorkspace({ ...workspace, updatedAt: Date.now() })
    }
    const ws = await loadWorkspace(id)
    if (ws) {
      skipHistoryRef.current = true
      clearHistory()
      prevWsRef.current = null
      setWorkspace(ws)
    }
  }, [workspace, clearHistory])

  const createWorkspace = useCallback(async () => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current)
      await saveWorkspace({ ...workspace, updatedAt: Date.now() })
    }
    const ws = createNewWorkspace()
    skipHistoryRef.current = true
    clearHistory()
    prevWsRef.current = null
    setWorkspace(ws)
    await saveWorkspace(ws)
    return ws
  }, [workspace, clearHistory])

  const deleteProject = useCallback(async (id: string) => {
    await deleteWs(id)
    if (workspace.id === id) {
      const all = await listWs()
      if (all.length > 0) {
        const latest = all.sort((a, b) => b.updatedAt - a.updatedAt)[0]
        skipHistoryRef.current = true
        clearHistory()
        prevWsRef.current = null
        setWorkspace(latest)
      } else {
        const ws = createNewWorkspace()
        skipHistoryRef.current = true
        clearHistory()
        prevWsRef.current = null
        setWorkspace(ws)
        await saveWorkspace(ws)
      }
    }
  }, [workspace.id, clearHistory])

  const listProjects = useCallback(async () => {
    return listWs()
  }, [])

  return {
    workspace,
    loaded,
    addField,
    updateField,
    removeField,
    removeFields,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    addConnection,
    removeConnection,
    addGroup,
    updateGroup,
    removeGroup,
    addMemo,
    updateMemo,
    removeMemo,
    setCharacters,
    setViewport,
    undo,
    redo,
    canUndo,
    canRedo,
    renameWorkspace,
    switchWorkspace,
    createWorkspace,
    deleteProject,
    listProjects,
  }
}
