import { prisma } from '@engine/prisma'

export type AssetHubGlobalCharacterAppearanceRecord = {
  id: string
  appearanceIndex: number
  changeReason: string | null
  description: string | null
  descriptions: string | null
  imageUrl: string | null
  imageUrls: string | null
  selectedIndex: number | null
  previousDescription: string | null
  previousDescriptions: string | null
}

export type AssetHubGlobalCharacterRecord = {
  id: string
  name: string
  appearances: AssetHubGlobalCharacterAppearanceRecord[]
}

export type AssetHubGlobalLocationImageRecord = {
  id: string
  imageIndex: number
  description: string | null
  imageUrl: string | null
  isSelected: boolean | null
  previousDescription: string | null
  previousImageUrl?: string | null
}

export type AssetHubGlobalLocationRecord = {
  id: string
  name: string
  images: AssetHubGlobalLocationImageRecord[]
}

export interface AssetHubRepository {
  getGlobalCharacterWithAppearances(
    characterId: string,
    userId: string,
  ): Promise<AssetHubGlobalCharacterRecord | null>
  updateGlobalCharacterAppearance(
    appearanceId: string,
    data: {
      imageUrl?: string | null
      imageUrls?: string | null
      selectedIndex?: number | null
      description?: string
      previousImageUrl?: string | null
      previousImageUrls?: string | null
      previousDescription?: string | null
      previousDescriptions?: string | null
    },
  ): Promise<void>
  getGlobalLocationWithImages(
    locationId: string,
    userId: string,
  ): Promise<AssetHubGlobalLocationRecord | null>
  updateGlobalLocationImage(
    imageId: string,
    data: {
      imageUrl?: string | null
      description?: string
      previousImageUrl?: string | null
      previousDescription?: string | null
    },
  ): Promise<void>
}

export const defaultAssetHubRepository: AssetHubRepository = {
  async getGlobalCharacterWithAppearances(characterId, userId) {
    return await prisma.globalCharacter.findFirst({
      where: { id: characterId, userId },
      select: {
        id: true,
        name: true,
        appearances: {
          orderBy: { appearanceIndex: 'asc' },
          select: {
            id: true,
            appearanceIndex: true,
            changeReason: true,
            description: true,
            descriptions: true,
            imageUrl: true,
            imageUrls: true,
            selectedIndex: true,
            previousDescription: true,
            previousDescriptions: true,
          },
        },
      },
    })
  },
  async updateGlobalCharacterAppearance(appearanceId, data) {
    await prisma.globalCharacterAppearance.update({
      where: { id: appearanceId },
      data,
    })
  },
  async getGlobalLocationWithImages(locationId, userId) {
    return await prisma.globalLocation.findFirst({
      where: { id: locationId, userId },
      select: {
        id: true,
        name: true,
        images: {
          orderBy: { imageIndex: 'asc' },
          select: {
            id: true,
            imageIndex: true,
            description: true,
            imageUrl: true,
            isSelected: true,
            previousDescription: true,
            previousImageUrl: true,
          },
        },
      },
    })
  },
  async updateGlobalLocationImage(imageId, data) {
    await prisma.globalLocationImage.update({
      where: { id: imageId },
      data,
    })
  },
}

