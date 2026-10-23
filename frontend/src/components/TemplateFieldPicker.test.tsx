import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { TemplateFieldPicker } from './TemplateFieldPicker'
import { TemplateField } from '../api/types/leads/getTemplateFields'

const fields: TemplateField[] = [
  { key: 'firstName', label: 'First name', group: 'Person', example: 'Ada' },
  { key: 'companyName', label: 'Company', group: 'Company', example: 'Acme' },
  { key: 'yearsAtCompany', label: 'Years at company', group: 'Company', example: '3' },
  { key: 'phoneNumber', label: 'Phone number', group: 'Contact', example: '+1 555' },
  { key: 'linkedinUrl', label: 'LinkedIn URL', group: 'Contact', example: 'https://linkedin.com/in/ada' },
]

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('TemplateFieldPicker', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const render = (props: Partial<React.ComponentProps<typeof TemplateFieldPicker>> = {}) => {
    const onInsert = vi.fn()
    const onRetry = vi.fn()
    act(() => {
      root.render(
        <TemplateFieldPicker
          fields={fields}
          isLoading={false}
          isError={false}
          onRetry={onRetry}
          onInsert={onInsert}
          {...props}
        />
      )
    })
    return { onInsert, onRetry }
  }

  const search = (value: string) => {
    const input = container.querySelector('input') as HTMLInputElement
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    act(() => {
      setValue.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    return input
  }

  const fieldButtons = () =>
    Array.from(container.querySelectorAll<HTMLButtonElement>('[role="group"] button'))

  it('should render fields grouped by category', () => {
    render()

    const groups = Array.from(container.querySelectorAll('[role="group"]'))
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual(['Person', 'Company', 'Contact'])
    expect(groups[1].textContent).toContain('{companyName}')
    expect(groups[1].textContent).toContain('{yearsAtCompany}')
    expect(groups[2].textContent).toContain('{linkedinUrl}')
  })

  it('should filter fields by label or key', () => {
    render()

    search('link')
    expect(fieldButtons().map((button) => button.textContent)).toEqual([
      expect.stringContaining('{linkedinUrl}'),
    ])

    search('yearsat')
    expect(fieldButtons()).toHaveLength(1)
    expect(fieldButtons()[0].textContent).toContain('{yearsAtCompany}')
  })

  it('should show an empty state when nothing matches', () => {
    render()

    search('zzz')
    expect(fieldButtons()).toHaveLength(0)
    expect(container.textContent).toContain('No fields match "zzz"')
  })

  it('should call onInsert with the field key when a field is clicked', () => {
    const { onInsert } = render()

    const phoneButton = fieldButtons().find((button) => button.textContent?.includes('{phoneNumber}'))!
    act(() => phoneButton.click())

    expect(onInsert).toHaveBeenCalledWith('phoneNumber')
  })

  it('should insert the first match on Enter and clear the search', () => {
    const { onInsert } = render()

    const input = search('phone')
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    expect(onInsert).toHaveBeenCalledWith('phoneNumber')
    expect(input.value).toBe('')
  })

  it('should show a retry action when loading fields fails', () => {
    const { onRetry } = render({ fields: undefined, isError: true })

    const retry = container.querySelector('button') as HTMLButtonElement
    expect(retry.textContent).toBe('Retry')
    act(() => retry.click())
    expect(onRetry).toHaveBeenCalled()
  })
})
