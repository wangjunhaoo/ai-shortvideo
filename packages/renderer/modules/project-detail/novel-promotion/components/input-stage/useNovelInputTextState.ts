import { useEffect, useRef, useState } from 'react'

interface UseNovelInputTextStateInput {
  novelText: string
  onNovelTextChange: (value: string) => void
}

export function useNovelInputTextState({
  novelText,
  onNovelTextChange,
}: UseNovelInputTextStateInput) {
  const isComposingRef = useRef(false)
  const [localText, setLocalText] = useState(novelText)

  useEffect(() => {
    if (!isComposingRef.current) {
      setLocalText(novelText)
    }
  }, [novelText])

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value
    setLocalText(newValue)

    if (!isComposingRef.current) {
      onNovelTextChange(newValue)
    }
  }

  const handleCompositionStart = () => {
    isComposingRef.current = true
  }

  const handleCompositionEnd = (event: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false
    onNovelTextChange(event.currentTarget.value)
  }

  return {
    localText,
    hasContent: localText.trim().length > 0,
    handleTextChange,
    handleCompositionStart,
    handleCompositionEnd,
  }
}
