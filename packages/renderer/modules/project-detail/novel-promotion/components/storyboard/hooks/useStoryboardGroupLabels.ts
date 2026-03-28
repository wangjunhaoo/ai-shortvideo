'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

export function useStoryboardGroupLabels() {
  const t = useTranslations('storyboard')

  return useMemo(() => ({
    chrome: {
      status: {
        failedTitle: `警告 ${t('group.failed')}`,
        closeTitle: t('common.cancel'),
      },
      mainRow: {
        header: {
          moveUpTitle: t('panel.moveUp'),
          moveDownTitle: t('panel.moveDown'),
          segmentLabel: t('group.segment'),
        },
        actions: {
          regenerateTextLabel: t('group.regenerateText'),
          generateMissingImagesTitle: t('group.generateMissingImages'),
          generateAllLabel: t('group.generateAll'),
          addPanelLabel: t('group.addPanel'),
          deleteLabel: t('common.delete'),
        },
      },
    },
    clipSection: {
      stylePromptLabel: t('panel.stylePrompt'),
      sourceTextLabel: t('panel.sourceText'),
      screenplay: {
        tabs: {
          formatted: t('screenplay.tabs.formatted'),
          original: t('screenplay.tabs.original'),
        },
        scene: {
          formatSceneLabel: (number: number) => t('screenplay.scene', { number }),
          charactersLabel: t('screenplay.characters'),
          voiceoverLabel: t('screenplay.voiceover'),
        },
        parseFailedTitle: t('screenplay.parseFailedTitle'),
        parseFailedDescription: t('screenplay.parseFailedDescription'),
      },
    },
    dialogs: {
      insertDialogLabels: {
        formatTitle: (before: number, after: number | '') =>
          t('insertModal.insertBetween', { before, after }),
        placeholder: t('insertModal.placeholder'),
        preview: {
          noImageFallback: t('insertModal.noImage'),
          insertLabel: t('insertModal.insert'),
          insertAtEndFallback: t('insertModal.insertAtEnd'),
        },
        actions: {
          aiAnalyzeLabel: t('insertModal.aiAnalyze'),
          insertLabel: t('insertModal.insert'),
        },
      },
      variantDialogLabels: {
        header: {
          formatTitle: (number: number | '') => t('variant.shotTitle', { number }),
        },
        footer: {
          cancelLabel: t('candidate.cancel'),
          submitLabel: t('variant.useCustomGenerate'),
        },
        panelInfo: {
          formatImageAlt: (number: number | '') => t('variant.shotNum', { number }),
          noImageLabel: t('variant.noImage'),
          originalDescriptionLabel: t('variant.originalDescription'),
          noDescriptionLabel: t('variant.noDescription'),
        },
        customOptions: {
          title: t('variant.customInstruction'),
          placeholder: t('variant.customPlaceholder'),
          includeCharacterLabel: t('variant.includeCharacter'),
          includeLocationLabel: t('variant.includeLocation'),
        },
        suggestionList: {
          title: t('variant.aiRecommend'),
          reanalyzeLabel: t('variant.reanalyze'),
          emptyMessage: t('variant.clickToAnalyze'),
          item: {
            formatCreativeScore: (score: number) => t('variant.creativeScore', { score }),
            shotTypeLabel: t('variant.shotType'),
            cameraMoveLabel: t('variant.cameraMove'),
            selectLabel: t('candidate.select'),
          },
        },
      },
      variantDialogMessages: {
        analyzeFailed: t('variant.analyzeFailed'),
        customVariantTitle: t('variant.customVariant'),
        defaultShotType: t('variant.defaultShotType'),
        defaultCameraMove: t('variant.defaultCameraMove'),
      },
    },
    panelCard: {
      deleteTitle: t('panelActions.deleteShot'),
      imageSection: {
        content: {
          formatShotNumberLabel: (number: number) => t('variant.shotNum', { number }),
          previewTitle: t('image.clickToPreview'),
          status: {
            loadingAlt: t('image.clickToPreview'),
            failedLabel: t('image.failed'),
            closeLabel: t('variant.close'),
            emptyLabel: t('video.toolbar.showPending'),
            generateLabel: t('panel.generateImage'),
          },
          candidate: {
            previewTitle: t('image.clickToPreview'),
            enlargePreviewTitle: t('image.enlargePreview'),
            cancelLabel: t('candidate.cancel'),
            confirmLabel: t('common.confirm'),
            formatCandidateCountLabel: (count: number) => t('image.candidateCount', { count }),
            formatPendingCandidateLabel: (count: number) => t('image.candidateGenerating', { count }),
          },
        },
        actions: {
          regenerateLabel: t('panel.regenerate'),
          forceRegenerateLabel: t('image.forceRegenerate'),
          generateCountSuffix: t('image.generateCountSuffix'),
          selectCountAriaLabel: t('image.selectCount'),
          viewDataLabel: t('aiData.viewData'),
          editImageLabel: t('image.editImage'),
          undoLabel: t('assets.image.undo'),
        },
      },
      sideActions: {
        insertTitle: t('panelActions.insertHere'),
        insertTooltip: t('panelActions.insertPanel'),
        variantTitle: t('panelActions.generateVariant'),
        variantDisabledTitle: t('panelActions.needImage'),
        variantTooltip: t('panelActions.panelVariant'),
      },
    },
  }), [t])
}
