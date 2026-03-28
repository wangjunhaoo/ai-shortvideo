'use client'

export async function copyPreviewJsonToClipboard(previewText: string) {
  if (
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    await navigator.clipboard.writeText(previewText)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = previewText
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
