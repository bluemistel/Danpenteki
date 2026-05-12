'use client'

import { Character } from '@/types'

interface FaceIconProps {
  character: Character | undefined
  size?: number
  emotion?: string
}

export function FaceIcon({ character, size = 28, emotion = 'normal' }: FaceIconProps) {
  if (!character) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--paper-2)',
          border: '1px dashed var(--ink-faint)',
          flexShrink: 0,
        }}
      />
    )
  }

  const iconUrl = character.emotions[emotion]?.iconUrl || character.emotions['normal']?.iconUrl

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={character.name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1.5px solid var(--ink)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 0 rgba(40,30,15,0.18), 0 4px 8px -3px rgba(40,30,15,0.30)',
          flexShrink: 0,
        }}
      />
    )
  }

  const initial = character.name.slice(0, 1)

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: character.backgroundColor || '#e6dec9',
        border: '1.5px solid var(--ink)',
        color: 'var(--ink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Caveat', cursive",
        fontWeight: 700,
        fontSize: size * 0.55,
        boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 0 rgba(40,30,15,0.18), 0 4px 8px -3px rgba(40,30,15,0.30)',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initial}
    </div>
  )
}
