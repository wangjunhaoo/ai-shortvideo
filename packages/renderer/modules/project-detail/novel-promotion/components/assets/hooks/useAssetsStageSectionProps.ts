import type { ComponentProps } from 'react'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import AssetToolbar from '../AssetToolbar'
import AssetsStageModals from '../AssetsStageModals'
import AssetsStageStatusOverlays from '../AssetsStageStatusOverlays'
import CharacterSection from '../CharacterSection'
import LocationSection from '../LocationSection'
import UnconfirmedProfilesSection from '../UnconfirmedProfilesSection'

interface UseAssetsStageSectionPropsInput {
  projectId: string
  focusCharacterId: string | null
  focusCharacterRequestId: number
  isAnalyzingAssets: boolean
  t: (key: string, values?: Record<string, string | number>) => string
  totalAssets: number
  totalAppearances: number
  totalLocations: number
  toast: ComponentProps<typeof AssetsStageStatusOverlays>['toast']
  closeToast: () => void
  isGlobalAnalyzing: boolean
  globalAnalyzingState: ComponentProps<typeof AssetsStageStatusOverlays>['globalAnalyzingState']
  isBatchSubmitting: boolean
  batchProgress: ComponentProps<typeof AssetToolbar>['batchProgress']
  handleGenerateAllImages: () => void
  handleRegenerateAllImages: () => void
  handleGlobalAnalyze?: () => void
  unconfirmedCharacters: ComponentProps<typeof UnconfirmedProfilesSection>['unconfirmedCharacters']
  batchConfirming: boolean
  deletingCharacterId: string | null
  isConfirmingCharacter: (characterId: string) => boolean
  handleBatchConfirm: () => void
  handleEditProfile: ComponentProps<typeof UnconfirmedProfilesSection>['onEditProfile']
  handleConfirmProfile: ComponentProps<typeof AssetsStageModals>['handleConfirmProfile']
  handleCopyFromGlobal: ComponentProps<typeof UnconfirmedProfilesSection>['onUseExistingProfile']
  handleDeleteProfile: ComponentProps<typeof UnconfirmedProfilesSection>['onDeleteProfile']
  activeTaskKeys: ComponentProps<typeof CharacterSection>['activeTaskKeys']
  clearTransientTaskKey: ComponentProps<typeof CharacterSection>['onClearTaskKey']
  registerTransientTaskKey: ComponentProps<typeof CharacterSection>['onRegisterTransientTaskKey']
  setShowAddCharacter: (open: boolean) => void
  handleDeleteCharacter: ComponentProps<typeof CharacterSection>['onDeleteCharacter']
  handleDeleteAppearance: ComponentProps<typeof CharacterSection>['onDeleteAppearance']
  handleEditAppearance: ComponentProps<typeof CharacterSection>['onEditAppearance']
  handleGenerateImage: ComponentProps<typeof CharacterSection>['handleGenerateImage']
  handleSelectCharacterImage: ComponentProps<typeof CharacterSection>['onSelectImage']
  handleConfirmSelection: ComponentProps<typeof CharacterSection>['onConfirmSelection']
  handleRegenerateSingleCharacter: ComponentProps<typeof CharacterSection>['onRegenerateSingle']
  handleRegenerateCharacterGroup: ComponentProps<typeof CharacterSection>['onRegenerateGroup']
  handleUndoCharacter: ComponentProps<typeof CharacterSection>['onUndo']
  setPreviewImage: (imageUrl: string | null) => void
  handleOpenCharacterImageEdit: ComponentProps<typeof CharacterSection>['onImageEdit']
  handleVoiceChange: (characterId: string, mode: 'custom', voiceId: string, customVoiceUrl?: string) => void
  handleOpenVoiceDesign: ComponentProps<typeof CharacterSection>['onVoiceDesign']
  handleVoiceSelectFromHub: ComponentProps<typeof CharacterSection>['onVoiceSelectFromHub']
  getAppearances: ComponentProps<typeof CharacterSection>['getAppearances']
  setShowAddLocation: (open: boolean) => void
  handleDeleteLocation: ComponentProps<typeof LocationSection>['onDeleteLocation']
  handleEditLocation: ComponentProps<typeof LocationSection>['onEditLocation']
  handleSelectLocationImage: ComponentProps<typeof LocationSection>['onSelectImage']
  handleConfirmLocationSelection: ComponentProps<typeof LocationSection>['onConfirmSelection']
  handleRegenerateSingleLocation: ComponentProps<typeof LocationSection>['onRegenerateSingle']
  handleRegenerateLocationGroup: ComponentProps<typeof LocationSection>['onRegenerateGroup']
  handleUndoLocation: ComponentProps<typeof LocationSection>['onUndo']
  handleOpenLocationImageEdit: ComponentProps<typeof LocationSection>['onImageEdit']
  handleCopyLocationFromGlobal: ComponentProps<typeof LocationSection>['onCopyFromGlobal']
  onRefresh: () => void
  closePreviewImage: () => void
  handleUpdateAppearanceDescription: ComponentProps<typeof AssetsStageModals>['handleUpdateAppearanceDescription']
  handleUpdateLocationDescription: ComponentProps<typeof AssetsStageModals>['handleUpdateLocationDescription']
  handleLocationImageEdit: ComponentProps<typeof AssetsStageModals>['handleLocationImageEdit']
  handleCharacterImageEdit: ComponentProps<typeof AssetsStageModals>['handleCharacterImageEdit']
  handleCloseVoiceDesign: ComponentProps<typeof AssetsStageModals>['handleCloseVoiceDesign']
  handleVoiceDesignSave: ComponentProps<typeof AssetsStageModals>['handleVoiceDesignSave']
  handleCloseCopyPicker: ComponentProps<typeof AssetsStageModals>['handleCloseCopyPicker']
  handleConfirmCopyFromGlobal: ComponentProps<typeof AssetsStageModals>['handleConfirmCopyFromGlobal']
  closeEditingAppearance: ComponentProps<typeof AssetsStageModals>['closeEditingAppearance']
  closeEditingLocation: ComponentProps<typeof AssetsStageModals>['closeEditingLocation']
  closeAddCharacter: ComponentProps<typeof AssetsStageModals>['closeAddCharacter']
  closeAddLocation: ComponentProps<typeof AssetsStageModals>['closeAddLocation']
  closeImageEditModal: ComponentProps<typeof AssetsStageModals>['closeImageEditModal']
  closeCharacterImageEditModal: ComponentProps<typeof AssetsStageModals>['closeCharacterImageEditModal']
  setEditingProfile: ComponentProps<typeof AssetsStageModals>['setEditingProfile']
  previewImage: ComponentProps<typeof AssetsStageModals>['previewImage']
  imageEditModal: ComponentProps<typeof AssetsStageModals>['imageEditModal']
  characterImageEditModal: ComponentProps<typeof AssetsStageModals>['characterImageEditModal']
  editingAppearance: ComponentProps<typeof AssetsStageModals>['editingAppearance']
  editingLocation: ComponentProps<typeof AssetsStageModals>['editingLocation']
  showAddCharacter: ComponentProps<typeof AssetsStageModals>['showAddCharacter']
  showAddLocation: ComponentProps<typeof AssetsStageModals>['showAddLocation']
  voiceDesignCharacter: ComponentProps<typeof AssetsStageModals>['voiceDesignCharacter']
  editingProfile: ComponentProps<typeof AssetsStageModals>['editingProfile']
  copyFromGlobalTarget: ComponentProps<typeof AssetsStageModals>['copyFromGlobalTarget']
  isGlobalCopyInFlight: ComponentProps<typeof AssetsStageModals>['isGlobalCopyInFlight']
}

export function useAssetsStageSectionProps({
  projectId,
  focusCharacterId,
  focusCharacterRequestId,
  isAnalyzingAssets,
  t,
  totalAssets,
  totalAppearances,
  totalLocations,
  toast,
  closeToast,
  isGlobalAnalyzing,
  globalAnalyzingState,
  isBatchSubmitting,
  batchProgress,
  handleGenerateAllImages,
  handleRegenerateAllImages,
  handleGlobalAnalyze,
  unconfirmedCharacters,
  batchConfirming,
  deletingCharacterId,
  isConfirmingCharacter,
  handleBatchConfirm,
  handleEditProfile,
  handleConfirmProfile,
  handleCopyFromGlobal,
  handleDeleteProfile,
  activeTaskKeys,
  clearTransientTaskKey,
  registerTransientTaskKey,
  setShowAddCharacter,
  handleDeleteCharacter,
  handleDeleteAppearance,
  handleEditAppearance,
  handleGenerateImage,
  handleSelectCharacterImage,
  handleConfirmSelection,
  handleRegenerateSingleCharacter,
  handleRegenerateCharacterGroup,
  handleUndoCharacter,
  setPreviewImage,
  handleOpenCharacterImageEdit,
  handleVoiceChange,
  handleOpenVoiceDesign,
  handleVoiceSelectFromHub,
  getAppearances,
  setShowAddLocation,
  handleDeleteLocation,
  handleEditLocation,
  handleSelectLocationImage,
  handleConfirmLocationSelection,
  handleRegenerateSingleLocation,
  handleRegenerateLocationGroup,
  handleUndoLocation,
  handleOpenLocationImageEdit,
  handleCopyLocationFromGlobal,
  onRefresh,
  closePreviewImage,
  handleUpdateAppearanceDescription,
  handleUpdateLocationDescription,
  handleLocationImageEdit,
  handleCharacterImageEdit,
  handleCloseVoiceDesign,
  handleVoiceDesignSave,
  handleCloseCopyPicker,
  handleConfirmCopyFromGlobal,
  closeEditingAppearance,
  closeEditingLocation,
  closeAddCharacter,
  closeAddLocation,
  closeImageEditModal,
  closeCharacterImageEditModal,
  setEditingProfile,
  previewImage,
  imageEditModal,
  characterImageEditModal,
  editingAppearance,
  editingLocation,
  showAddCharacter,
  showAddLocation,
  voiceDesignCharacter,
  editingProfile,
  copyFromGlobalTarget,
  isGlobalCopyInFlight,
}: UseAssetsStageSectionPropsInput) {
  const batchConfirmingState = batchConfirming
    ? resolveTaskPresentationState({
        phase: 'processing',
        intent: 'modify',
        resource: 'image',
        hasOutput: false,
      })
    : null

  return {
    statusOverlayProps: {
      toast,
      onCloseToast: closeToast,
      isGlobalAnalyzing,
      globalAnalyzingState,
      globalAnalyzingTitle: t('toolbar.globalAnalyzing'),
      globalAnalyzingHint: t('toolbar.globalAnalyzingHint'),
      globalAnalyzingTip: t('toolbar.globalAnalyzingTip'),
    } satisfies ComponentProps<typeof AssetsStageStatusOverlays>,
    toolbarProps: {
      projectId,
      totalAssets,
      totalAppearances,
      totalLocations,
      isBatchSubmitting,
      isAnalyzingAssets,
      isGlobalAnalyzing,
      batchProgress,
      onGenerateAll: handleGenerateAllImages,
      onRegenerateAll: handleRegenerateAllImages,
      onGlobalAnalyze: handleGlobalAnalyze,
      labels: {
        assetManagementLabel: t('toolbar.assetManagement'),
        assetCountLabel: (total, appearances, locations) => t('toolbar.assetCount', { total, appearances, locations }),
        globalAnalyzeHint: t('toolbar.globalAnalyzeHint'),
        globalAnalyzeLabel: t('toolbar.globalAnalyze'),
        generateAllLabel: t('toolbar.generateAll'),
        regenerateAllHint: t('toolbar.regenerateAllHint'),
        regenerateAllLabel: t('toolbar.regenerateAll'),
        refreshLabel: t('common.refresh'),
        downloadAllTitle: t('toolbar.downloadAll'),
        downloadEmptyMessage: t('assetLibrary.downloadEmpty'),
        downloadFailedMessage: t('assetLibrary.downloadFailed'),
      },
    } satisfies ComponentProps<typeof AssetToolbar>,
    unconfirmedProfilesProps: {
      unconfirmedCharacters,
      confirmTitle: t('stage.confirmProfiles'),
      confirmHint: t('stage.confirmHint'),
      confirmAllLabel: t('stage.confirmAll', { count: unconfirmedCharacters.length }),
      batchConfirming,
      batchConfirmingState,
      deletingCharacterId,
      isConfirmingCharacter,
      onBatchConfirm: handleBatchConfirm,
      onEditProfile: handleEditProfile,
      onConfirmProfile: handleConfirmProfile,
      onUseExistingProfile: handleCopyFromGlobal,
      onDeleteProfile: handleDeleteProfile,
      labels: {
        profileCard: {
          roleLevelLabel: (roleLevel) => t(`characterProfile.importance.${roleLevel}` as never),
          deleteTitle: t('characterProfile.delete'),
          genderLabel: t('characterProfile.summary.gender'),
          ageLabel: t('characterProfile.summary.age'),
          eraLabel: t('characterProfile.summary.era'),
          classLabel: t('characterProfile.summary.class'),
          occupationLabel: t('characterProfile.summary.occupation'),
          personalityLabel: t('characterProfile.summary.personality'),
          costumeLabel: t('characterProfile.summary.costume'),
          identifierLabel: t('characterProfile.summary.identifier'),
          editProfileLabel: t('characterProfile.editProfile'),
          useExistingLabel: t('characterProfile.useExisting'),
          confirmAndGenerateLabel: t('characterProfile.confirmAndGenerate'),
        },
      },
    } satisfies ComponentProps<typeof UnconfirmedProfilesSection>,
    characterSectionProps: {
      projectId,
      focusCharacterId,
      focusCharacterRequestId,
      activeTaskKeys,
      onClearTaskKey: clearTransientTaskKey,
      onRegisterTransientTaskKey: registerTransientTaskKey,
      isAnalyzingAssets,
      onAddCharacter: () => setShowAddCharacter(true),
      onDeleteCharacter: handleDeleteCharacter,
      onDeleteAppearance: handleDeleteAppearance,
      onEditAppearance: handleEditAppearance,
      handleGenerateImage,
      onSelectImage: handleSelectCharacterImage,
      onConfirmSelection: handleConfirmSelection,
      onRegenerateSingle: handleRegenerateSingleCharacter,
      onRegenerateGroup: handleRegenerateCharacterGroup,
      onUndo: handleUndoCharacter,
      onImageClick: setPreviewImage,
      onImageEdit: handleOpenCharacterImageEdit,
      onVoiceChange: (characterId, customVoiceUrl) => handleVoiceChange(characterId, 'custom', characterId, customVoiceUrl),
      onVoiceDesign: handleOpenVoiceDesign,
      onVoiceSelectFromHub: handleVoiceSelectFromHub,
      onCopyFromGlobal: handleCopyFromGlobal,
      getAppearances,
      labels: {
        header: {
          sectionTitle: t('stage.characterAssets'),
          sectionCountLabel: (characterCount, appearanceCount) => t('stage.counts', { characterCount, appearanceCount }),
          addCharacterLabel: t('character.add'),
        },
        group: {
          assetCountLabel: (count) => t('character.assetCount', { count }),
          copyFromGlobalLabel: t('character.copyFromGlobal'),
          deleteLabel: t('character.delete'),
          card: {
            stateMessages: {
              uploadSuccess: t('image.uploadSuccess'),
              uploadFailed: (error) => `${t('image.uploadFailed')}: ${error}`,
            },
            header: {
              primaryLabel: t('character.primary'),
              secondaryLabel: t('character.secondary'),
              optionSelectedLabel: (number) => t('image.optionSelected', { number }),
              selectFirstLabel: t('image.selectFirst'),
            },
            gallery: {
              optionNumberLabel: (number) => t('image.optionNumber', { number }),
              optionAltLabel: (characterName, number) => `${characterName} - ${t('image.optionNumber', { number })}`,
              cancelSelectionLabel: t('image.cancelSelection'),
              useThisLabel: t('image.useThis'),
              generateFailedLabel: t('common.generateFailed'),
            },
            actions: {
              selectionTipLabel: t('image.selectTip'),
              confirmOptionLabel: (number) => t('image.confirmOption', { number }),
              selectPrimaryFirstLabel: t('character.selectPrimaryFirst'),
              generateCountPrefix: t('image.generateCountPrefix'),
              generateFromPrimary: t('character.generateFromPrimary'),
              generateCountSuffix: t('image.generateCountSuffix'),
              selectCountAriaLabel: t('image.selectCount'),
            },
            selection: {
              regenCountPrefix: t('image.regenCountPrefix'),
              regenCountSuffix: t('image.regenCountSuffix'),
              regenCountAriaLabel: t('image.regenCountAriaLabel'),
              undoTitle: t('image.undo'),
              deleteTitle: t('character.delete'),
            },
            overlay: {
              uploadTitle: t('image.upload'),
              uploadReplaceTitle: t('image.uploadReplace'),
              editTitle: t('image.edit'),
              regenerateTitle: t('location.regenerateImage'),
              regenerateRunningTitle: t('image.regenerateStuck'),
              undoTitle: t('image.undo'),
            },
            compact: {
              editPromptTitle: t('video.panelCard.editPrompt'),
              deleteTitle: t('character.delete'),
              deleteOptionsTitle: t('character.deleteOptions'),
              deleteThisLabel: t('image.deleteThis'),
              deleteWholeLabel: t('character.deleteWhole'),
            },
            voiceSettings: {
              title: t('tts.title'),
              noVoice: t('tts.noVoice'),
              uploadConfirm: t('tts.uploadQwenHint'),
              previewFailed: (error) => t('tts.previewFailed', { error }),
              uploadFailed: (error) => t('tts.uploadFailed', { error }),
              uploading: t('tts.uploading'),
              uploaded: t('tts.uploaded'),
              uploadAudio: t('tts.uploadAudio'),
              assetLibraryButton: t('assetLibrary.button'),
              aiDesign: t('modal.aiDesign'),
              pause: t('tts.pause'),
              preview: t('tts.preview'),
              unknownError: t('common.unknownError'),
            },
          },
        },
      },
    } satisfies ComponentProps<typeof CharacterSection>,
    locationSectionProps: {
      projectId,
      activeTaskKeys,
      onClearTaskKey: clearTransientTaskKey,
      onRegisterTransientTaskKey: registerTransientTaskKey,
      onAddLocation: () => setShowAddLocation(true),
      onDeleteLocation: handleDeleteLocation,
      onEditLocation: handleEditLocation,
      handleGenerateImage,
      onSelectImage: handleSelectLocationImage,
      onConfirmSelection: handleConfirmLocationSelection,
      onRegenerateSingle: handleRegenerateSingleLocation,
      onRegenerateGroup: handleRegenerateLocationGroup,
      onUndo: handleUndoLocation,
      onImageClick: setPreviewImage,
      onImageEdit: handleOpenLocationImageEdit,
      onCopyFromGlobal: handleCopyLocationFromGlobal,
      labels: {
        header: {
          sectionTitle: t('stage.locationAssets'),
          sectionCountLabel: (count) => t('stage.locationCounts', { count }),
          addLocationLabel: t('location.add'),
        },
        card: {
          stateMessages: {
            uploadSuccess: t('image.uploadSuccess'),
            uploadFailedError: (error) => t('image.uploadFailedError', { error }),
          },
          header: {
            optionSelectedLabel: (number) => t('image.optionSelected', { number }),
            selectFirstLabel: t('image.selectFirst'),
          },
          imageList: {
            optionAltLabel: (locationName, number) => t('image.optionAlt', { name: locationName, number }),
            optionNumberLabel: (number) => t('image.optionNumber', { number }),
            cancelSelectionLabel: t('image.cancelSelection'),
            useThisLabel: t('image.useThis'),
            generateFailedLabel: t('common.generateFailed'),
            generatingPlaceholderLabel: t('image.generatingPlaceholder'),
            generatingLabel: t('image.generating'),
            regeneratingLabel: t('image.regenerating'),
          },
          actions: {
            selectionTipLabel: t('image.selectTip'),
            confirmOptionLabel: (number) => t('image.confirmOption', { number }),
            deleteOthersHintLabel: t('image.deleteOthersHint'),
            generateCountPrefix: t('image.generateCountPrefix'),
            generateCountSuffix: t('image.generateCountSuffix'),
            selectCountAriaLabel: t('image.selectCount'),
          },
          selection: {
            generatedProgressLabel: (generated, total) => t('image.generatedProgress', { generated, total }),
            regenCountPrefix: t('image.regenCountPrefix'),
            regenCountSuffix: t('image.regenCountSuffix'),
            regenCountAriaLabel: t('image.regenCountAriaLabel'),
            undoTitle: t('image.undo'),
            deleteTitle: t('location.delete'),
          },
          overlay: {
            uploadTitle: t('image.upload'),
            uploadReplaceTitle: t('image.uploadReplace'),
            editTitle: t('image.edit'),
            regenerateTitle: t('location.regenerateImage'),
            regenerateRunningTitle: t('image.regenerateStuck'),
            undoTitle: t('image.undo'),
            copyFromGlobalTitle: t('character.copyFromGlobal'),
            editLocationTitle: t('location.edit'),
            deleteLocationTitle: t('location.delete'),
          },
        },
      },
    } satisfies ComponentProps<typeof LocationSection>,
    modalsProps: {
      projectId,
      onRefresh,
      onClosePreview: closePreviewImage,
      handleGenerateImage,
      handleUpdateAppearanceDescription,
      handleUpdateLocationDescription,
      handleLocationImageEdit,
      handleCharacterImageEdit,
      handleCloseVoiceDesign,
      handleVoiceDesignSave,
      handleCloseCopyPicker,
      handleConfirmCopyFromGlobal,
      handleConfirmProfile,
      closeEditingAppearance,
      closeEditingLocation,
      closeAddCharacter,
      closeAddLocation,
      closeImageEditModal,
      closeCharacterImageEditModal,
      isConfirmingCharacter,
      setEditingProfile,
      previewImage,
      imageEditModal,
      characterImageEditModal,
      editingAppearance,
      editingLocation,
      showAddCharacter,
      showAddLocation,
      voiceDesignCharacter,
      editingProfile,
      copyFromGlobalTarget,
      isGlobalCopyInFlight,
      getImageEditModalLabels: (type, name) => ({
        title: type === 'character' ? t('imageEdit.editCharacterImage') : t('imageEdit.editLocationImage'),
        subtitle: type === 'character'
          ? `${t('imageEdit.characterLabel', { name })} · ${t('imageEdit.subtitle')}`
          : `${t('imageEdit.locationLabel', { name })} · ${t('imageEdit.subtitle')}`,
        designInstructionRequired: t('modal.designInstruction'),
        editInstruction: t('imageEdit.editInstruction'),
        promptPlaceholder: type === 'character'
          ? t('imageEdit.characterPlaceholder')
          : t('imageEdit.locationPlaceholder'),
        referenceImages: t('imageEdit.referenceImages'),
        referenceImagesHint: t('imageEdit.referenceImagesHint'),
        cancel: t('common.cancel'),
        startEditing: t('imageEdit.startEditing'),
      }),
      supportLabels: {
        profileDialog: {
          editDialogTitle: (name) => t('characterProfile.editDialogTitle', { name }),
          importanceLevel: t('characterProfile.importanceLevel'),
          importanceOptionLabel: (level) => t(`characterProfile.importance.${level}` as never),
          characterArchetype: t('characterProfile.characterArchetype'),
          archetypePlaceholder: t('characterProfile.archetypePlaceholder'),
          personalityTags: t('characterProfile.personalityTags'),
          addTagPlaceholder: t('characterProfile.addTagPlaceholder'),
          addLabel: t('common.add'),
          costumeLevelLabel: t('characterProfile.costumeLevelLabel'),
          costumeLevelOptionLabel: (tier) => t(`characterProfile.costumeLevel.${tier}` as never),
          suggestedColors: t('characterProfile.suggestedColors'),
          colorPlaceholder: t('characterProfile.colorPlaceholder'),
          primaryMarker: t('characterProfile.primaryMarker'),
          markerNote: t('characterProfile.markerNote'),
          markingsPlaceholder: t('characterProfile.markingsPlaceholder'),
          visualKeywords: t('characterProfile.visualKeywords'),
          keywordsPlaceholder: t('characterProfile.keywordsPlaceholder'),
          cancel: t('common.cancel'),
          confirmAndGenerate: t('characterProfile.confirmAndGenerate'),
        },
      },
    } satisfies ComponentProps<typeof AssetsStageModals>,
  }
}
