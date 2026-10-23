import { FC, useMemo, useState } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { TemplateField } from '../api/types/leads/getTemplateFields'

interface TemplateFieldPickerProps {
  fields: TemplateField[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onInsert: (key: string) => void
}

export const TemplateFieldPicker: FC<TemplateFieldPickerProps> = ({
  fields,
  isLoading,
  isError,
  onRetry,
  onInsert,
}) => {
  const [search, setSearch] = useState('')

  const filteredFields = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return fields ?? []
    return (fields ?? []).filter(
      (field) => field.label.toLowerCase().includes(query) || field.key.toLowerCase().includes(query)
    )
  }, [fields, search])

  const groups = useMemo(() => {
    const byGroup = new Map<string, TemplateField[]>()
    filteredFields.forEach((field) => {
      byGroup.set(field.group, [...(byGroup.get(field.group) ?? []), field])
    })
    return Array.from(byGroup.entries())
  }, [filteredFields])

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredFields.length > 0) {
        onInsert(filteredFields[0].key)
        setSearch('')
      }
    }
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading fields…</div>
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-700">
        Couldn't load fields. You can still type {'{fieldName}'} manually.
        <button type="button" onClick={onRetry} className="font-medium underline hover:text-red-900">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-md">
      <div className="relative border-b border-gray-200">
        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search fields to insert…"
          aria-label="Search fields"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-t-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="max-h-48 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500">No fields match "{search.trim()}"</div>
        ) : (
          groups.map(([group, groupFields]) => (
            <div key={group} role="group" aria-label={group}>
              <div className="sticky top-0 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {group}
              </div>
              {groupFields.map((field) => (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => onInsert(field.key)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                >
                  <span className="text-gray-900">{field.label}</span>
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-xs text-gray-400">{field.example}</span>
                    <code className="shrink-0 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                      {`{${field.key}}`}
                    </code>
                  </span>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
