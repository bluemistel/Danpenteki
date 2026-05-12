'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface BlockTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
  style?: React.CSSProperties
}

export function BlockTextarea({ value, onChange, placeholder, rows = 2, className, style }: BlockTextareaProps) {
  const [localValue, setLocalValue] = useState(value)
  const composingRef = useRef(false)
  const focusedRef = useRef(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!focusedRef.current) {
      setLocalValue(value)
    }
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value)
    if (!composingRef.current) {
      onChange(e.target.value)
    }
  }, [onChange])

  const handleCompositionStart = useCallback(() => {
    composingRef.current = true
  }, [])

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = false
    onChange((e.target as HTMLTextAreaElement).value)
  }, [onChange])

  const handleFocus = useCallback(() => {
    focusedRef.current = true
  }, [])

  const handleBlur = useCallback(() => {
    focusedRef.current = false
    if (localValue !== value) {
      onChange(localValue)
    }
  }, [localValue, value, onChange])

  return (
    <textarea
      ref={ref}
      value={localValue}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseDown={e => e.stopPropagation()}
      placeholder={placeholder}
      rows={rows}
      className={className}
      style={style}
    />
  )
}
