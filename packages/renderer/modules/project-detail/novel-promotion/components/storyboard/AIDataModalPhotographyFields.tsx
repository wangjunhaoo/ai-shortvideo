'use client'

import type {
  AIDataModalPhotographySectionLabels,
  AIDataModalPhotographySectionProps,
} from './AIDataModalFormPane.types'

type AIDataModalPhotographyFieldsProps = Pick<
  AIDataModalPhotographySectionProps,
  'photographyRules' | 'onPhotographyFieldChange'
> & {
  labels: Pick<
    AIDataModalPhotographySectionLabels,
    | 'summary'
    | 'lightingDirection'
    | 'lightingQuality'
    | 'depthOfField'
    | 'colorTone'
  >
}

export default function AIDataModalPhotographyFields({
  labels,
  photographyRules,
  onPhotographyFieldChange,
}: AIDataModalPhotographyFieldsProps) {
  if (!photographyRules) {
    return null
  }

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">
          {labels.summary}
        </label>
        <input
          type="text"
          value={photographyRules.scene_summary || ''}
          onChange={(event) =>
            onPhotographyFieldChange('scene_summary', event.target.value)
          }
          className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--glass-tone-info-fg)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">
            {labels.lightingDirection}
          </label>
          <input
            type="text"
            value={photographyRules.lighting?.direction || ''}
            onChange={(event) =>
              onPhotographyFieldChange('lighting.direction', event.target.value)
            }
            className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--glass-tone-info-fg)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">
            {labels.lightingQuality}
          </label>
          <input
            type="text"
            value={photographyRules.lighting?.quality || ''}
            onChange={(event) =>
              onPhotographyFieldChange('lighting.quality', event.target.value)
            }
            className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--glass-tone-info-fg)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">
          {labels.depthOfField}
        </label>
        <input
          type="text"
          value={photographyRules.depth_of_field || ''}
          onChange={(event) =>
            onPhotographyFieldChange('depth_of_field', event.target.value)
          }
          className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--glass-tone-info-fg)]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">
          {labels.colorTone}
        </label>
        <input
          type="text"
          value={photographyRules.color_tone || ''}
          onChange={(event) =>
            onPhotographyFieldChange('color_tone', event.target.value)
          }
          className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--glass-tone-info-fg)]"
        />
      </div>
    </>
  )
}
