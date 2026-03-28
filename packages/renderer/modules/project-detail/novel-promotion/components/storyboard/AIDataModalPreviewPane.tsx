'use client'

import AIDataModalPreviewHeader from './AIDataModalPreviewHeader'
import type { AIDataModalPreviewPaneProps } from './AIDataModalPreviewPane.types'
import { copyPreviewJsonToClipboard } from './copyPreviewJsonToClipboard'

export default function AIDataModalPreviewPane({
  title,
  copyLabel,
  previewJson,
}: AIDataModalPreviewPaneProps) {
  const previewText = JSON.stringify(previewJson, null, 2)

  return (
    <div className="w-1/2 bg-[var(--glass-text-primary)] overflow-y-auto p-4">
      <AIDataModalPreviewHeader
        title={title}
        copyLabel={copyLabel}
        onCopy={() => {
          copyPreviewJsonToClipboard(previewText).catch(() => {})
        }}
      />
      <pre className="text-xs text-[var(--glass-tone-success-fg)] font-mono whitespace-pre-wrap break-all">
        {previewText}
      </pre>
    </div>
  )
}
