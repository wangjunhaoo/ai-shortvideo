import { useEffect, useRef, useState } from 'react'
import type { Character } from '@/types/project'

interface UseFocusedCharacterScrollInput {
  characters: Character[]
  focusCharacterId?: string | null
  focusCharacterRequestId?: number
}

export function useFocusedCharacterScroll({
  characters,
  focusCharacterId = null,
  focusCharacterRequestId = 0,
}: UseFocusedCharacterScrollInput) {
  const [highlightedCharacterId, setHighlightedCharacterId] = useState<string | null>(null)
  const scrollAnimationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!focusCharacterId) return
    if (!characters.some((character) => character.id === focusCharacterId)) return

    const element = document.getElementById(`project-character-${focusCharacterId}`)
    if (!element) return

    const scrollContainer = (
      element.closest('[data-asset-scroll-container="1"]') ||
      document.querySelector('[data-asset-scroll-container="1"]') ||
      element.closest('.custom-scrollbar')
    ) as HTMLElement | null

    if (scrollAnimationRef.current !== null) {
      window.cancelAnimationFrame(scrollAnimationRef.current)
      scrollAnimationRef.current = null
    }

    if (scrollContainer) {
      const startTop = scrollContainer.scrollTop
      const elementTop =
        element.getBoundingClientRect().top -
        scrollContainer.getBoundingClientRect().top +
        scrollContainer.scrollTop
      const targetTop = Math.max(
        0,
        elementTop - (scrollContainer.clientHeight - element.clientHeight) / 2,
      )
      const duration = 650
      const startTime = performance.now()
      const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3)

      const animate = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1)
        const eased = easeOutCubic(progress)
        scrollContainer.scrollTop = startTop + (targetTop - startTop) * eased

        if (progress < 1) {
          scrollAnimationRef.current = window.requestAnimationFrame(animate)
        } else {
          scrollAnimationRef.current = null
        }
      }

      scrollAnimationRef.current = window.requestAnimationFrame(animate)
    } else {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    setHighlightedCharacterId(focusCharacterId)

    const timer = window.setTimeout(() => {
      setHighlightedCharacterId((current) =>
        current === focusCharacterId ? null : current,
      )
    }, 2200)

    return () => {
      window.clearTimeout(timer)
      if (scrollAnimationRef.current !== null) {
        window.cancelAnimationFrame(scrollAnimationRef.current)
        scrollAnimationRef.current = null
      }
    }
  }, [characters, focusCharacterId, focusCharacterRequestId])

  return {
    highlightedCharacterId,
  }
}
