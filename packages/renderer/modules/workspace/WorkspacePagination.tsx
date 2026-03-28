'use client'

import { AppIcon } from '@/components/ui/icons'
import type { Pagination } from './types'

type WorkspacePaginationProps = {
  loading: boolean
  pagination: Pagination
  onPageChange: (page: number) => void
  t: (key: string, values?: Record<string, string | number | Date>) => string
}

export function WorkspacePagination({
  loading,
  pagination,
  onPageChange,
  t,
}: WorkspacePaginationProps) {
  if (loading || pagination.totalPages <= 1) return null

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page <= 1}
        className="glass-btn-base glass-btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <AppIcon name="chevronLeft" className="w-5 h-5" />
      </button>

      {Array.from({ length: pagination.totalPages }, (_, index) => index + 1)
        .filter((page) => page === 1
          || page === pagination.totalPages
          || Math.abs(page - pagination.page) <= 2)
        .map((page, index, pages) => (
          <span key={page} className="flex items-center">
            {index > 0 && pages[index - 1] !== page - 1 && (
              <span className="px-2 text-[var(--glass-text-tertiary)]">...</span>
            )}
            <button
              onClick={() => onPageChange(page)}
              className={`glass-btn-base px-4 py-2 ${page === pagination.page
                ? 'glass-btn-primary'
                : 'glass-btn-secondary'
                }`}
            >
              {page}
            </button>
          </span>
        ))}

      <button
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page >= pagination.totalPages}
        className="glass-btn-base glass-btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <AppIcon name="chevronRight" className="w-5 h-5" />
      </button>

      <span className="ml-4 text-sm text-[var(--glass-text-tertiary)]">
        {t('totalProjects', { count: pagination.total })}
      </span>
    </div>
  )
}
