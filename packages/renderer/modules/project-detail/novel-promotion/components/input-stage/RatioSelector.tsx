'use client'

import { useEffect, useRef, useState } from 'react'
import { AppIcon, RatioPreviewIcon } from '@/components/ui/icons'

function RatioIcon({
  ratio,
  size = 24,
  selected = false,
}: {
  ratio: string
  size?: number
  selected?: boolean
}) {
  // 始终以选中态渲染图标，保持比例图标的统一视觉记忆。
  return <RatioPreviewIcon ratio={ratio} size={size} selected={selected || true} />
}

interface RatioOption {
  value: string
  label: string
  recommended?: boolean
}

interface RatioSelectorProps {
  value: string
  onChange: (value: string) => void
  options: RatioOption[]
  getUsage?: (ratio: string) => string
  recommendedLabel: string
}

export function RatioSelector({
  value,
  onChange,
  options,
  getUsage,
  recommendedLabel,
}: RatioSelectorProps) {
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

  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="glass-input-base h-11 px-3 flex w-full items-center justify-between gap-2 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3">
          <RatioIcon ratio={value} size={20} selected />
          <span className="text-sm text-[var(--glass-text-primary)] font-medium">
            {selectedOption?.label || value}
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
        <div
          className="glass-surface-modal absolute z-50 mt-1 left-0 right-0 p-3 max-h-60 overflow-y-auto custom-scrollbar"
          style={{ minWidth: '280px' }}
        >
          <div className="grid grid-cols-5 gap-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-[var(--glass-bg-muted)]/70 transition-colors ${
                  value === option.value
                    ? 'bg-[var(--glass-tone-info-bg)] shadow-[0_0_0_1px_rgba(79,128,255,0.35)]'
                    : ''
                }`}
              >
                <RatioIcon ratio={option.value} size={28} selected={value === option.value} />
                <span
                  className={`flex flex-col items-center gap-1 text-xs ${
                    value === option.value
                      ? 'text-[var(--glass-tone-info-fg)] font-medium'
                      : 'text-[var(--glass-text-secondary)]'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span>{option.label}</span>
                    {option.recommended && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[var(--glass-tone-info-bg)] text-[10px] text-[var(--glass-tone-info-fg)] font-semibold">
                        {recommendedLabel}
                      </span>
                    )}
                  </span>
                  {getUsage && (
                    <span className="text-[10px] font-normal text-[var(--glass-text-tertiary)] leading-snug text-center">
                      {getUsage(option.value)}
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
