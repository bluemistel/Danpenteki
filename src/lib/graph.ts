import { Connection, DialogueField } from '@/types'

export function getConnectedChain(
  startFieldId: string,
  fields: DialogueField[],
  connections: Connection[]
): DialogueField[] {
  const fieldMap = new Map(fields.map(f => [f.id, f]))
  const outgoing = new Map<string, Connection[]>()

  for (const conn of connections) {
    const existing = outgoing.get(conn.sourceFieldId) || []
    existing.push(conn)
    outgoing.set(conn.sourceFieldId, existing)
  }

  const visited = new Set<string>()
  const result: DialogueField[] = []

  function traverse(fieldId: string) {
    if (visited.has(fieldId)) return
    visited.add(fieldId)

    const field = fieldMap.get(fieldId)
    if (field) result.push(field)

    const edges = outgoing.get(fieldId) || []
    edges.sort((a, b) => a.order - b.order)

    for (const edge of edges) {
      traverse(edge.targetFieldId)
    }
  }

  traverse(startFieldId)
  return result
}

export function findRoots(
  fields: DialogueField[],
  connections: Connection[]
): DialogueField[] {
  const hasIncoming = new Set(connections.map(c => c.targetFieldId))
  return fields.filter(f => !hasIncoming.has(f.id))
}

export function hasCycle(
  connections: Connection[],
  newSource: string,
  newTarget: string
): boolean {
  const outgoing = new Map<string, string[]>()
  for (const conn of connections) {
    const existing = outgoing.get(conn.sourceFieldId) || []
    existing.push(conn.targetFieldId)
    outgoing.set(conn.sourceFieldId, existing)
  }

  const existingTargets = outgoing.get(newSource) || []
  outgoing.set(newSource, [...existingTargets, newTarget])

  const visited = new Set<string>()
  const stack = new Set<string>()

  function dfs(node: string): boolean {
    if (stack.has(node)) return true
    if (visited.has(node)) return false

    visited.add(node)
    stack.add(node)

    for (const neighbor of outgoing.get(node) || []) {
      if (dfs(neighbor)) return true
    }

    stack.delete(node)
    return false
  }

  return dfs(newSource)
}
