'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { AppIcon, RatioPreviewIcon } from '@/components/ui/icons'

const VIEWPORT_EDGE_GAP = 16
const DEFAULT_PANEL_MAX_HEIGHT = 240

interface RatioIconProps {
  ratio: string
  size?: number
  selected?: boolean
}

interface RatioSelectorProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}

interface StyleSelectorProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}

function useFloatingDropdownPanel(isOpen: boolean, minWidth = 280) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  const updatePanelPlacement = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth
    const spaceAbove = Math.max(0, rect.top - VIEWPORT_EDGE_GAP)
    const spaceBelow = Math.max(0, viewportHeight - rect.bottom - VIEWPORT_EDGE_GAP)
    const shouldOpenUpward = spaceBelow < DEFAULT_PANEL_MAX_HEIGHT && spaceAbove > spaceBelow
    const availableSpace = shouldOpenUpward ? spaceAbove : spaceBelow
    const clampedMaxHeight = Math.max(0, Math.min(DEFAULT_PANEL_MAX_HEIGHT, Math.floor(availableSpace)))
    const panelWidth = Math.max(minWidth, rect.width)
    const maxLeft = viewportWidth - panelWidth - VIEWPORT_EDGE_GAP
    const panelLeft = Math.max(VIEWPORT_EDGE_GAP, Math.min(rect.left, maxLeft))

    setPanelStyle({
      position: 'fixed',
      left: `${panelLeft}px`,
      width: `${panelWidth}px`,
      maxHeight: `${clampedMaxHeight}px`,
      zIndex: 9999,
      ...(shouldOpenUpward
        ? { bottom: `${viewportHeight - rect.top + 4}px` }
        : { top: `${rect.bottom + 4}px` }),
    })
  }, [minWidth])

  useLayoutEffect(() => {
    if (!isOpen) return

    updatePanelPlacement()
    window.addEventListener('resize', updatePanelPlacement)
    window.addEventListener('scroll', updatePanelPlacement, true)

    return () => {
      window.removeEventListener('resize', updatePanelPlacement)
      window.removeEventListener('scroll', updatePanelPlacement, true)
    }
  }, [isOpen, updatePanelPlacement])

  return {
    triggerRef,
    panelRef,
    panelStyle,
    updatePanelPlacement,
  }
}

function RatioIcon({ ratio, size = 24, selected = false }: RatioIconProps) {
  // 始终以选中态渲染图标，保证所有比例选项的图标统一为蓝色
  return (
    <RatioPreviewIcon
      ratio={ratio}
      size={size}
      selected={selected || true}
      variant="surface"
    />
  )
}

export function RatioSelector({ value, onChange, options }: RatioSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { triggerRef, panelRef, panelStyle, updatePanelPlacement } = useFloatingDropdownPanel(isOpen)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [panelRef, triggerRef])

  const selectedOption = options.find((option) => option.value === value)

  return (
    <>
      <div className="relative" ref={triggerRef}>
        <button
          type="button"
          onClick={() => {
            if (!isOpen) updatePanelPlacement()
            setIsOpen(!isOpen)
          }}
          className="glass-input-base h-11 px-3 flex items-center justify-between gap-2 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <RatioIcon ratio={value} size={20} selected />
            <span className="text-sm text-[var(--glass-text-primary)] font-medium">
              {selectedOption?.label || value}
            </span>
          </div>
          <AppIcon name="chevronDown" className={`w-4 h-4 text-[var(--glass-text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          className="glass-surface-modal p-3 overflow-y-auto custom-scrollbar shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
          style={panelStyle}
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
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-[var(--glass-bg-muted)] transition-colors ${
                  value === option.value
                    ? 'bg-[var(--glass-tone-info-bg)] shadow-[0_0_0_1px_rgba(79,128,255,0.35)]'
                    : ''
                }`}
              >
                <RatioIcon ratio={option.value} size={28} selected={value === option.value} />
                <span
                  className={`text-xs ${
                    value === option.value
                      ? 'text-[var(--glass-tone-info-fg)] font-medium'
                      : 'text-[var(--glass-text-secondary)]'
                  }`}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

export function StyleSelector({ value, onChange, options }: StyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { triggerRef, panelRef, panelStyle, updatePanelPlacement } = useFloatingDropdownPanel(isOpen)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [panelRef, triggerRef])

  const selectedOption = options.find((option) => option.value === value) || options[0]

  return (
    <>
      <div className="relative" ref={triggerRef}>
        <button
          type="button"
          onClick={() => {
            if (!isOpen) updatePanelPlacement()
            setIsOpen(!isOpen)
          }}
          className="glass-input-base h-11 px-3 flex items-center justify-between gap-2 cursor-pointer transition-colors"
        >
          <div className="flex items-center">
            <span className="text-sm text-[var(--glass-text-primary)] font-medium">{selectedOption.label}</span>
          </div>
          <AppIcon name="chevronDown" className={`w-4 h-4 text-[var(--glass-text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          className="glass-surface-modal overflow-y-auto custom-scrollbar p-3 shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
          style={panelStyle}
        >
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
                <span className="font-medium text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
