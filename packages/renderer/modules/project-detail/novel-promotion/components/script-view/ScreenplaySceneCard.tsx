'use client'

import { AppIcon } from '@/components/ui/icons'
import { EditableText } from './EditableText'
import { cloneScreenplay, type ScreenplayData, type ScreenplayScene } from './screenplay'

interface ScreenplaySceneCardProps {
  clipId: string
  scene: ScreenplayScene
  sceneIdx: number
  screenplay: ScreenplayData
  onSaveScreenplay: (clipId: string, screenplayJson: string) => Promise<void>
  tScript: (key: string, values?: Record<string, unknown>) => string
}

export function ScreenplaySceneCard({
  clipId,
  scene,
  sceneIdx,
  screenplay,
  onSaveScreenplay,
  tScript,
}: ScreenplaySceneCardProps) {
  const saveUpdatedScreenplay = (updater: (draft: ScreenplayData) => void) => {
    const nextScreenplay = cloneScreenplay(screenplay)
    updater(nextScreenplay)
    void onSaveScreenplay(clipId, JSON.stringify(nextScreenplay))
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs mb-2 flex-wrap">
        <span className="font-bold text-[var(--glass-tone-info-fg)] bg-[var(--glass-tone-info-bg)] px-2 py-0.5 rounded">
          {tScript('screenplay.scene', { number: scene.scene_number })}
        </span>
        <span className="text-[var(--glass-text-tertiary)] flex items-center gap-1">
          {scene.heading?.int_ext} ·
          <EditableText
            text={scene.heading?.location || ''}
            onSave={(value) => {
              saveUpdatedScreenplay((draft) => {
                draft.scenes[sceneIdx].heading = {
                  ...draft.scenes[sceneIdx].heading,
                  location: value,
                }
              })
            }}
            className="inline"
            tScript={tScript}
          />
          ·
          <EditableText
            text={scene.heading?.time || ''}
            onSave={(value) => {
              saveUpdatedScreenplay((draft) => {
                draft.scenes[sceneIdx].heading = {
                  ...draft.scenes[sceneIdx].heading,
                  time: value,
                }
              })
            }}
            className="inline"
            tScript={tScript}
          />
        </span>
      </div>

      {scene.description && (
        <div className="text-xs text-[var(--glass-text-secondary)] bg-[var(--glass-bg-muted)] border-l-2 border-[var(--glass-stroke-base)] px-2 py-1 rounded mb-2">
          <EditableText
            text={scene.description}
            onSave={(value) => {
              saveUpdatedScreenplay((draft) => {
                draft.scenes[sceneIdx].description = value
              })
            }}
            tScript={tScript}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {scene.content?.map((item, itemIdx: number) => {
          if (item.type === 'action') {
            return (
              <div
                key={itemIdx}
                className="text-sm text-[var(--glass-text-secondary)] bg-[var(--glass-bg-muted)]/60 border border-[var(--glass-stroke-base)] px-2.5 py-1 rounded-lg flex items-start gap-2 w-fit max-w-full leading-[1.5]"
              >
                <AppIcon name="clapperboard" className="w-3.5 h-3.5 text-[var(--glass-text-tertiary)] shrink-0 mt-[2px]" />
                <EditableText
                  text={item.text}
                  onSave={(value) => {
                    saveUpdatedScreenplay((draft) => {
                      const targetItem = draft.scenes[sceneIdx].content?.[itemIdx]
                      if (targetItem?.type === 'action') {
                        targetItem.text = value
                      }
                    })
                  }}
                  tScript={tScript}
                />
              </div>
            )
          }

          if (item.type === 'dialogue') {
            return (
              <div key={itemIdx} className="flex flex-wrap items-baseline gap-2">
                <span className="inline-flex items-center text-[13px] font-bold text-[var(--glass-tone-info-fg)] bg-[var(--glass-tone-info-bg)] border border-[var(--glass-stroke-focus)]/40 px-2.5 py-0.5 rounded-full shrink-0">
                  {item.character}
                </span>
                <div className="text-[15px] text-[var(--glass-text-primary)] font-medium leading-[1.5] flex-1 min-w-0">
                  <EditableText
                    text={item.lines}
                    onSave={(value) => {
                      saveUpdatedScreenplay((draft) => {
                        const targetItem = draft.scenes[sceneIdx].content?.[itemIdx]
                        if (targetItem?.type === 'dialogue') {
                          targetItem.lines = value
                        }
                      })
                    }}
                    tScript={tScript}
                  />
                </div>
              </div>
            )
          }

          if (item.type === 'voiceover') {
            return (
              <div key={itemIdx} className="flex flex-wrap items-baseline gap-2">
                <span className="inline-flex items-center text-[13px] font-bold text-[var(--glass-tone-info-fg)]/80 bg-[var(--glass-tone-info-bg)]/50 border border-[var(--glass-stroke-focus)]/20 px-2.5 py-0.5 rounded-full shrink-0 italic">
                  {tScript('screenplay.narration')}
                </span>
                <p className="text-[15px] text-[var(--glass-text-secondary)] font-medium italic leading-[1.5] flex-1">
                  {item.text}
                </p>
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
