'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface BlockTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
  style?: React.CSSProperties
  onCtrlEnter?: () => void
  onAltUp?: () => void
  onAltDown?: () => void
}

export function BlockTextarea({ value, onChange, placeholder, rows = 2, className, style, onCtrlEnter, onAltUp, onAltDown }: BlockTextareaProps) {
  const [localValue, setLocalValue] = useState(value)
  const composingRef = useRef(false)
  const focusedRef = useRef(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const callbackRefs = useRef({ onCtrlEnter, onAltUp, onAltDown })
  callbackRefs.current = { onCtrlEnter, onAltUp, onAltDown }

  useEffect(() => {
    if (!focusedRef.current) {
      setLocalValue(value)
    }
  }, [value])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const stop = (e: KeyboardEvent) => {
      if (e.type === 'keydown') {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.stopPropagation()
          e.preventDefault()
          callbackRefs.current.onCtrlEnter?.()
          return
        }
        if (e.altKey && e.key === 'ArrowUp') {
          e.stopPropagation()
          e.preventDefault()
          callbackRefs.current.onAltUp?.()
          return
        }
        if (e.altKey && e.key === 'ArrowDown') {
          e.stopPropagation()
          e.preventDefault()
          callbackRefs.current.onAltDown?.()
          return
        }
      }
      e.stopPropagation()
    }
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
    const val = (e.target as HTMLTextAreaElement).value
    setLocalValue(val)
    onChange(val)
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
