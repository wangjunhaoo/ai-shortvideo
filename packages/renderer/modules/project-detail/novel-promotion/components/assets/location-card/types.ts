export interface LocationCardHeaderLabels {
  optionSelectedLabel: (number: number) => string
  selectFirstLabel: string
}

export interface LocationImageListLabels {
  optionAltLabel: (locationName: string, number: number) => string
  optionNumberLabel: (number: number) => string
  cancelSelectionLabel: string
  useThisLabel: string
  generateFailedLabel: string
  generatingPlaceholderLabel: string
  generatingLabel: string
  regeneratingLabel: string
}

export interface LocationCardActionsLabels {
  selectionTipLabel: string
  confirmOptionLabel: (number: number) => string
  deleteOthersHintLabel: string
  generateCountPrefix: string
  generateCountSuffix: string
  selectCountAriaLabel: string
}

export interface LocationCardStateMessages {
  uploadSuccess: string
  uploadFailedError: (error: string) => string
}

export interface LocationCardSelectionLabels {
  generatedProgressLabel: (generated: number, total: number) => string
  regenCountPrefix: string
  regenCountSuffix: string
  regenCountAriaLabel: string
  undoTitle: string
  deleteTitle: string
}

export interface LocationCardOverlayLabels {
  uploadTitle: string
  uploadReplaceTitle: string
  editTitle: string
  regenerateTitle: string
  regenerateRunningTitle: string
  undoTitle: string
  copyFromGlobalTitle: string
  editLocationTitle: string
  deleteLocationTitle: string
}
