export interface CharacterCardHeaderLabels {
  primaryLabel: string
  secondaryLabel: string
  optionSelectedLabel: (number: number) => string
  selectFirstLabel: string
}

export interface CharacterCardGalleryLabels {
  optionNumberLabel: (number: number) => string
  optionAltLabel: (characterName: string, number: number) => string
  cancelSelectionLabel: string
  useThisLabel: string
  generateFailedLabel: string
}

export interface CharacterCardActionsLabels {
  selectionTipLabel: string
  confirmOptionLabel: (number: number) => string
  selectPrimaryFirstLabel: string
  generateCountPrefix: string
  generateFromPrimary: string
  generateCountSuffix: string
  selectCountAriaLabel: string
}

export interface CharacterCardStateMessages {
  uploadSuccess: string
  uploadFailed: (error: string) => string
}

export interface CharacterCardSelectionLabels {
  regenCountPrefix: string
  regenCountSuffix: string
  regenCountAriaLabel: string
  undoTitle: string
  deleteTitle: string
}

export interface CharacterCardOverlayLabels {
  uploadTitle: string
  uploadReplaceTitle: string
  editTitle: string
  regenerateTitle: string
  regenerateRunningTitle: string
  undoTitle: string
}

export interface CharacterCardCompactLabels {
  editPromptTitle: string
  deleteTitle: string
  deleteOptionsTitle: string
  deleteThisLabel: string
  deleteWholeLabel: string
}
