import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { IconBraces, IconChevronDown, IconSearch } from '@tabler/icons-react'
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
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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

  const close = () => {
    setIsOpen(false)
    setSearch('')
  }

  const insert = (key: string) => {
    onInsert(key)
    close()
  }

  useEffect(() => {
    if (!isOpen) return

    searchRef.current?.focus()

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen])

  const handlePanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      close()
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredFields.length > 0) {
        insert(filteredFields[0].key)
      }
    }
  }

  const renderPanelContent = () => {
    if (isLoading) {
      return <div className="px-3 py-2 text-sm text-gray-500">Loading fields…</div>
    }

    if (isError) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-red-700">
          Couldn't load fields. You can still type {'{fieldName}'} manually.
          <button type="button" onClick={onRetry} className="font-medium underline hover:text-red-900">
            Retry
          </button>
        </div>
      )
    }

    return (
      <>
        <div className="relative border-b border-gray-200">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search fields…"
            aria-label="Search fields"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-t-md focus:outline-none"
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
                    onClick={() => insert(field.key)}
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
      </>
    )
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <IconBraces size={16} />
        Insert field
        <IconChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div
          role="dialog"
          aria-label="Insert field"
          onKeyDown={handlePanelKeyDown}
          className="absolute left-0 z-20 mt-1 w-96 max-w-[calc(100vw-4rem)] bg-white border border-gray-200 rounded-md shadow-lg"
        >
          {renderPanelContent()}
        </div>
      )}
    </div>
  )
}
