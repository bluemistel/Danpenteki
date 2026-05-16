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
  autoFocus?: boolean
}

export function BlockTextarea({ value, onChange, placeholder, rows = 2, className, style, onCtrlEnter, onAltUp, onAltDown, autoFocus }: BlockTextareaProps) {
  const [localValue, setLocalValue] = useState(value)
  const composingRef = useRef(false)
  const focusedRef = useRef(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const localValueRef = useRef(localValue)
  const callbackRefs = useRef({ onCtrlEnter, onAltUp, onAltDown, onChange })
  callbackRefs.current = { onCtrlEnter, onAltUp, onAltDown, onChange }

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    if (!focusedRef.current) {
      setLocalValue(value)
      localValueRef.current = value
    }
  }, [value])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const stop = (e: KeyboardEvent) => {
      if (e.type === 'keydown') {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.stopPropagation()
          e.preventDefault()
          flushDebounce()
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

  const flushDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
      callbackRefs.current.onChange(localValueRef.current)
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setLocalValue(val)
    localValueRef.current = val
    if (!composingRef.current) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        callbackRefs.current.onChange(localValueRef.current)
      }, 300)
    }
  }, [])

  const handleCompositionStart = useCallback(() => {
    composingRef.current = true
  }, [])

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = false
    const val = (e.target as HTMLTextAreaElement).value
    setLocalValue(val)
    localValueRef.current = val
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      callbackRefs.current.onChange(localValueRef.current)
    }, 300)
  }, [])

  const handleFocus = useCallback(() => {
    focusedRef.current = true
  }, [])

  const handleBlur = useCallback(() => {
    focusedRef.current = false
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (localValueRef.current !== value) {
      onChange(localValueRef.current)
    }
  }, [value, onChange])

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
