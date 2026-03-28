'use client'

import { AppIcon } from '@/components/ui/icons'
import { ScreenplaySceneCard } from './ScreenplaySceneCard'
import { parseScreenplay } from './screenplay'

interface Clip {
  id: string
  clipIndex?: number
  summary: string
  content: string
  screenplay?: string | null
  characters: string | null
  location: string | null
}

interface ScriptViewScriptPanelProps {
  clips: Clip[]
  selectedClipId: string | null
  onSelectClip: (clipId: string) => void
  savingClips: Set<string>
  onClipEdit?: (clipId: string) => void
  onClipDelete?: (clipId: string) => void
  onClipUpdate?: (clipId: string, data: Partial<Clip>) => void
  t: (key: string, values?: Record<string, unknown>) => string
  tScript: (key: string, values?: Record<string, unknown>) => string
}

export default function ScriptViewScriptPanel({
  clips,
  selectedClipId,
  onSelectClip,
  savingClips,
  onClipEdit,
  onClipDelete,
  onClipUpdate,
  t,
  tScript,
}: ScriptViewScriptPanelProps) {
  const handleScriptSave = async (clipId: string, newContent: string) => {
    if (!onClipUpdate) return
    await onClipUpdate(clipId, { screenplay: newContent })
  }

  return (
    <div className="col-span-12 lg:col-span-8 flex flex-col min-h-[400px] lg:h-full gap-4">
      <div className="flex justify-between items-end px-2">
        <h2 className="text-xl font-bold text-[var(--glass-text-primary)] flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[var(--glass-accent-from)] rounded-full" /> {tScript('scriptBreakdown')}
        </h2>
        <span className="text-sm text-[var(--glass-text-tertiary)]">
          {tScript('splitCount', { count: clips.length })}
        </span>
      </div>

      <div className="flex-1 glass-surface-elevated overflow-hidden flex flex-col relative w-full min-h-[300px]">
        <div className="lg:absolute lg:inset-0 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {clips.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--glass-text-tertiary)]">
              <AppIcon name="fileFold" className="h-10 w-10 mb-2" />
              <p>{tScript('noClips')}</p>
            </div>
          ) : (
            clips.map((clip, idx) => {
              const screenplay = parseScreenplay(clip.screenplay)

              return (
                <div
                  key={clip.id}
                  onClick={() => onSelectClip(clip.id)}
                  className={`
                    group p-5 border-[1.5px] rounded-2xl transition-all cursor-pointer relative bg-[var(--glass-bg-surface)]
                    ${selectedClipId === clip.id
                      ? 'border-[var(--glass-stroke-focus)] shadow-[0_6px_24px_rgba(0,0,0,0.06)] ring-2 ring-[var(--glass-tone-info-bg)]'
                      : 'border-[var(--glass-stroke-base)] hover:border-[var(--glass-stroke-focus)]/40 hover:shadow-md'
                    }
                  `}
                >
                  {savingClips.has(clip.id) && (
                    <div className="absolute top-2 right-2 text-xs text-[var(--glass-tone-info-fg)] flex items-center gap-1 animate-pulse">
                      <AppIcon name="upload" className="w-3 h-3" />
                      {t('preview.saving')}
                    </div>
                  )}

                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded text-[var(--glass-tone-info-fg)] bg-[var(--glass-tone-info-bg)]">
                      {tScript('segment.title', { index: idx + 1 })} {selectedClipId === clip.id && tScript('segment.selected')}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onClipEdit && (
                        <button
                          onClick={() => onClipEdit(clip.id)}
                          className="text-[var(--glass-text-tertiary)] text-xs cursor-pointer hover:text-[var(--glass-tone-info-fg)]"
                        >
                          {t('common.edit')}
                        </button>
                      )}
                      {onClipDelete && (
                        <button
                          onClick={() => onClipDelete(clip.id)}
                          className="text-[var(--glass-text-tertiary)] text-xs cursor-pointer hover:text-[var(--glass-tone-danger-fg)]"
                        >
                          {t('common.delete')}
                        </button>
                      )}
                    </div>
                  </div>

                  {screenplay && screenplay.scenes ? (
                    <div className="space-y-3">
                      {screenplay.scenes.map((scene, sceneIdx: number) => (
                        <ScreenplaySceneCard
                          key={sceneIdx}
                          clipId={clip.id}
                          scene={scene}
                          sceneIdx={sceneIdx}
                          screenplay={screenplay}
                          onSaveScreenplay={handleScriptSave}
                          tScript={tScript}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-[var(--glass-text-secondary)] text-sm leading-relaxed">{clip.summary || clip.content}</p>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
