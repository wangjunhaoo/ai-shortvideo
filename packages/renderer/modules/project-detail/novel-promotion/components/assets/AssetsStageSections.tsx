import type { ComponentProps } from 'react'
import AssetsStageModals from './AssetsStageModals'
import AssetsStageStatusOverlays from './AssetsStageStatusOverlays'
import AssetToolbar from './AssetToolbar'
import CharacterSection from './CharacterSection'
import LocationSection from './LocationSection'
import UnconfirmedProfilesSection from './UnconfirmedProfilesSection'

interface AssetsStageSectionsProps {
  statusOverlayProps: ComponentProps<typeof AssetsStageStatusOverlays>
  toolbarProps: ComponentProps<typeof AssetToolbar>
  unconfirmedProfilesProps: ComponentProps<typeof UnconfirmedProfilesSection>
  characterSectionProps: ComponentProps<typeof CharacterSection>
  locationSectionProps: ComponentProps<typeof LocationSection>
  modalsProps: ComponentProps<typeof AssetsStageModals>
}

export default function AssetsStageSections({
  statusOverlayProps,
  toolbarProps,
  unconfirmedProfilesProps,
  characterSectionProps,
  locationSectionProps,
  modalsProps,
}: AssetsStageSectionsProps) {
  return (
    <div className="space-y-4">
      <AssetsStageStatusOverlays {...statusOverlayProps} />
      <AssetToolbar {...toolbarProps} />
      <UnconfirmedProfilesSection {...unconfirmedProfilesProps} />
      <CharacterSection {...characterSectionProps} />
      <LocationSection {...locationSectionProps} />
      <AssetsStageModals {...modalsProps} />
    </div>
  )
}
