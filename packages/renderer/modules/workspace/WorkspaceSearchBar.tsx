'use client'

type WorkspaceSearchBarProps = {
  searchInput: string
  hasActiveSearch: boolean
  onSearchInputChange: (value: string) => void
  onSearch: () => void
  onClear: () => void
  t: (key: string, values?: Record<string, string | number | Date>) => string
}

export function WorkspaceSearchBar({
  searchInput,
  hasActiveSearch,
  onSearchInputChange,
  onSearch,
  onClear,
  t,
}: WorkspaceSearchBarProps) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={searchInput}
        onChange={(event) => onSearchInputChange(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && onSearch()}
        placeholder={t('searchPlaceholder')}
        className="glass-input-base w-64 px-3 py-2"
      />
      <button
        onClick={onSearch}
        className="glass-btn-base glass-btn-primary px-4 py-2"
      >
        {t('searchButton')}
      </button>
      {hasActiveSearch && (
        <button
          onClick={onClear}
          className="glass-btn-base glass-btn-secondary px-4 py-2"
        >
          {t('clearButton')}
        </button>
      )}
    </div>
  )
}
