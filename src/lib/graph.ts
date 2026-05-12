import { Connection, DialogueField } from '@/types'

export interface TreeNode {
  field: DialogueField
  depth: number
  prefixes: string[]
}

export function getConnectedChain(
  startFieldId: string,
  fields: DialogueField[],
  connections: Connection[]
): DialogueField[] {
  const tree = getConnectedTree(startFieldId, fields, connections)
  return tree.map(n => n.field)
}

export function getConnectedTree(
  startFieldId: string,
  fields: DialogueField[],
  connections: Connection[]
): TreeNode[] {
  const fieldMap = new Map(fields.map(f => [f.id, f]))
  const outgoing = new Map<string, Connection[]>()

  for (const conn of connections) {
    const existing = outgoing.get(conn.sourceFieldId) || []
    existing.push(conn)
    outgoing.set(conn.sourceFieldId, existing)
  }

  const visited = new Set<string>()
  const result: TreeNode[] = []

  function traverse(fieldId: string, depth: number, prefixes: string[]) {
    if (visited.has(fieldId)) return
    visited.add(fieldId)

    const field = fieldMap.get(fieldId)
    if (field) result.push({ field, depth, prefixes: [...prefixes] })

    const edges = outgoing.get(fieldId) || []
    edges.sort((a, b) => a.order - b.order)

    for (let i = 0; i < edges.length; i++) {
      const isLast = i === edges.length - 1
      const childPrefixes = depth === 0
        ? [isLast ? '└' : '├']
        : [...prefixes.slice(0, -1),
           prefixes[prefixes.length - 1] === '├' || prefixes[prefixes.length - 1] === '│' ? '│' : ' ',
           isLast ? '└' : '├']
      traverse(edges[i].targetFieldId, depth + 1, childPrefixes)
    }
  }

  traverse(startFieldId, 0, [])
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
