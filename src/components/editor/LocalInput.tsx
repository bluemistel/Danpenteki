'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface LocalInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  onEnter?: () => void
  className?: string
  autoFocus?: boolean
}

export function LocalInput({ value, onChange, onBlur, onEnter, className, autoFocus }: LocalInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const composingRef = useRef(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const stop = (e: Event) => { e.stopPropagation() }
    el.addEventListener('keydown', stop, true)
    el.addEventListener('keyup', stop, true)
    el.addEventListener('keypress', stop, true)
    return () => {
      el.removeEventListener('keydown', stop, true)
      el.removeEventListener('keyup', stop, true)
      el.removeEventListener('keypress', stop, true)
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
    if (!composingRef.current) {
      onChange(e.target.value)
    }
  }, [onChange])

  const handleCompositionStart = useCallback(() => {
    composingRef.current = true
  }, [])

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    composingRef.current = false
    onChange((e.target as HTMLInputElement).value)
  }, [onChange])

  const handleBlur = useCallback(() => {
    if (localValue !== value) {
      onChange(localValue)
    }
    onBlur?.()
  }, [localValue, value, onChange, onBlur])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !composingRef.current) {
      onEnter?.()
    }
  }, [onEnter])

  return (
    <input
      ref={ref}
      type="text"
      value={localValue}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onMouseDown={e => e.stopPropagation()}
      className={className}
      autoFocus={autoFocus}
    />
  )
}
