'use client'

interface ImageSectionBadgesProps {
  globalPanelNumber: number
  shotType: string
}

export default function ImageSectionBadges({
  globalPanelNumber,
  shotType,
}: ImageSectionBadgesProps) {
  return (
    <>
      <div className="absolute top-2 left-2">
        <span className="glass-chip glass-chip-neutral px-2 py-0.5 text-xs font-medium">
          {globalPanelNumber}
        </span>
      </div>

      <div className="absolute top-2 right-2">
        <span className="glass-chip glass-chip-info px-2 py-0.5 text-xs">
          {shotType}
        </span>
      </div>
    </>
  )
}
