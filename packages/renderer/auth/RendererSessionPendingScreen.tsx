'use client'

type RendererSessionPendingScreenProps = {
  label?: string
  mode?: 'text' | 'logo'
}

export function RendererSessionPendingScreen({
  label,
  mode = 'text',
}: RendererSessionPendingScreenProps) {
  return (
    <div className="glass-page min-h-screen flex items-center justify-center">
      {mode === 'logo' ? (
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logo-small.png?v=1"
            alt="waoowaoo"
            width={80}
            height={80}
            className="animate-pulse"
          />
          {label ? (
            <div className="text-[var(--glass-text-secondary)]">{label}</div>
          ) : null}
        </div>
      ) : (
        <div className="text-[var(--glass-text-secondary)]">{label}</div>
      )}
    </div>
  )
}
