'use client'

import { useEffect, useState } from 'react'

interface EditableTextProps {
  text: string
  onSave: (value: string) => void
  className?: string
  tScript: (key: string, values?: Record<string, unknown>) => string
}

export function EditableText({
  text,
  onSave,
  className = '',
  tScript,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(text)

  useEffect(() => {
    setValue(text)
  }, [text])

  const handleBlur = () => {
    setIsEditing(false)
    if (value !== text) {
      onSave(value)
    }
  }

  if (isEditing) {
    return (
      <textarea
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={handleBlur}
        className={`w-full bg-[var(--glass-bg-surface)] border border-[var(--glass-stroke-focus)] rounded p-1 outline-none focus:ring-2 focus:ring-[var(--glass-focus-ring-strong)] ${className}`}
        style={{ resize: 'none', minHeight: '1.5em' }}
      />
    )
  }

  return (
    <div
      onClick={(event) => {
        event.stopPropagation()
        setIsEditing(true)
      }}
      className={`cursor-text hover:bg-[var(--glass-tone-info-bg)] rounded px-1 -mx-1 transition-colors border border-transparent hover:border-[var(--glass-stroke-focus)] ${className}`}
      title={tScript('screenplay.clickToEdit')}
    >
      {text}
    </div>
  )
}
