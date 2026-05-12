export interface CharacterEmotion {
  iconUrl: string
}

export interface Character {
  id: string
  name: string
  group: string
  emotions: Record<string, CharacterEmotion>
  backgroundColor: string
}

export interface DialogueBlock {
  id: string
  characterId: string
  emotion: string
  text: string
}

export interface DialogueField {
  id: string
  label: string
  blocks: DialogueBlock[]
  position: { x: number; y: number }
  width: number
  collapsed: boolean
}

export interface Connection {
  id: string
  sourceFieldId: string
  targetFieldId: string
  sourceHandle: string
  targetHandle: string
  order: number
}

export interface Workspace {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  characters: Character[]
  fields: DialogueField[]
  connections: Connection[]
  viewport: { x: number; y: number; zoom: number }
}
