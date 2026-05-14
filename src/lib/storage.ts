import { openDB, IDBPDatabase } from 'idb'
import { Workspace } from '@/types'

const DB_NAME = 'danpenteki-db'
const DB_VERSION = 1

interface DanpentekiDB {
  workspaces: {
    key: string
    value: Workspace
  }
  images: {
    key: string
    value: { id: string; blob: Blob }
  }
}

let dbPromise: Promise<IDBPDatabase<DanpentekiDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<DanpentekiDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('workspaces')) {
          db.createObjectStore('workspaces', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  const db = await getDB()
  await db.put('workspaces', workspace)
}

function migrateWorkspace(ws: Workspace): Workspace {
  if (!ws.groups) (ws as any).groups = []
  return ws
}

export async function loadWorkspace(id: string): Promise<Workspace | undefined> {
  const db = await getDB()
  const ws = await db.get('workspaces', id)
  return ws ? migrateWorkspace(ws) : undefined
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const db = await getDB()
  const all = await db.getAll('workspaces')
  return all.map(migrateWorkspace)
}

export async function deleteWorkspace(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('workspaces', id)
}

export async function saveImage(id: string, blob: Blob): Promise<void> {
  const db = await getDB()
  await db.put('images', { id, blob })
}

export async function loadImage(id: string): Promise<Blob | undefined> {
  const db = await getDB()
  const result = await db.get('images', id)
  return result?.blob
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('images', id)
}
