'use client'

export interface ProjectStats {
  episodes: number
  images: number
  videos: number
  panels: number
  firstEpisodePreview: string | null
}

export interface Project {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  stats?: ProjectStats
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type TranslationValues = Record<string, string | number | Date>
export type TranslationFn = (key: string, values?: TranslationValues) => string

export const PAGE_SIZE = 7
