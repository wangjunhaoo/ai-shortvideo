'use client'

interface AIDataModalActingHeaderProps {
  title: string
}

export default function AIDataModalActingHeader({
  title,
}: AIDataModalActingHeaderProps) {
  return (
    <div className="border-t border-[var(--glass-stroke-base)] pt-4 mt-4">
      <div className="text-sm font-medium text-[var(--glass-text-secondary)] mb-3">
        {title}
      </div>
    </div>
  )
}
