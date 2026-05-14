'use client'

import { useState, useCallback, useRef } from 'react'
import { Workspace } from '@/types'

type WorkspaceSnapshot = Pick<Workspace, 'fields' | 'connections' | 'characters' | 'groups'>

const MAX_HISTORY = 50

function snapshot(ws: Workspace): WorkspaceSnapshot {
  return JSON.parse(JSON.stringify({
    fields: ws.fields,
    connections: ws.connections,
    characters: ws.characters,
    groups: ws.groups,
  }))
}

export function useUndoRedo() {
  const [undoStack, setUndoStack] = useState<WorkspaceSnapshot[]>([])
  const [redoStack, setRedoStack] = useState<WorkspaceSnapshot[]>([])
  const skipNextPush = useRef(false)

  const canUndo = undoStack.length > 0
  const canRedo = redoStack.length > 0

  const pushSnapshot = useCallback((ws: Workspace) => {
    if (skipNextPush.current) {
      skipNextPush.current = false
      return
    }
    setUndoStack(prev => {
      const next = [...prev, snapshot(ws)]
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next
    })
    setRedoStack([])
  }, [])

  const undo = useCallback((currentWs: Workspace): WorkspaceSnapshot | null => {
    if (undoStack.length === 0) return null
    skipNextPush.current = true
    const prev = undoStack[undoStack.length - 1]
    setUndoStack(s => s.slice(0, -1))
    setRedoStack(s => [snapshot(currentWs), ...s])
    return prev
  }, [undoStack])

  const redo = useCallback((currentWs: Workspace): WorkspaceSnapshot | null => {
    if (redoStack.length === 0) return null
    skipNextPush.current = true
    const next = redoStack[0]
    setRedoStack(s => s.slice(1))
    setUndoStack(s => [...s, snapshot(currentWs)])
    return next
  }, [redoStack])

  const clear = useCallback(() => {
    setUndoStack([])
    setRedoStack([])
  }, [])

  return { canUndo, canRedo, pushSnapshot, undo, redo, clear }
}
