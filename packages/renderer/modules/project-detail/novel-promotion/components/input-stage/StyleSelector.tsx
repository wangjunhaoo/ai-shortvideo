'use client'

import { useEffect, useRef, useState } from 'react'
import { AppIcon } from '@/components/ui/icons'

interface StyleOption {
  value: string
  label: string
  recommended?: boolean
}

interface StyleSelectorProps {
  value: string
  onChange: (value: string) => void
  options: StyleOption[]
  recommendedLabel: string
}

export function StyleSelector({
  value,
  onChange,
  options,
  recommendedLabel,
}: StyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((option) => option.value === value) || options[0]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="glass-input-base h-11 px-3 flex w-full items-center justify-between gap-2 cursor-pointer transition-colors"
      >
        <div className="flex items-center">
          <span className="text-sm text-[var(--glass-text-primary)] font-medium">
            {selectedOption.label}
          </span>
        </div>
        <AppIcon
          name="chevronDown"
          className={`w-4 h-4 text-[var(--glass-text-tertiary)] transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="glass-surface-modal absolute z-50 mt-1 left-0 right-0 p-3">
          <div className="grid grid-cols-2 gap-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`flex items-center p-3 rounded-lg text-left transition-all ${
                  value === option.value
                    ? 'bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] shadow-[0_0_0_1px_rgba(79,128,255,0.35)]'
                    : 'hover:bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)]'
                }`}
              >
                <span className="flex items-center gap-1 font-medium text-sm">
                  <span>{option.label}</span>
                  {option.recommended && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[var(--glass-tone-info-bg)] text-[10px] text-[var(--glass-tone-info-fg)] font-semibold">
                      {recommendedLabel}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
