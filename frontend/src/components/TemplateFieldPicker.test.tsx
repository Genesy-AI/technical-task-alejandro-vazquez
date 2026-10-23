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

  const toggle = () => container.querySelector('button[aria-haspopup]') as HTMLButtonElement

  const open = () => {
    act(() => toggle().click())
  }

  const panel = () => container.querySelector('[role="dialog"]')

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

  it('should only show the Insert field button until it is clicked', () => {
    render()

    expect(toggle().textContent).toContain('Insert field')
    expect(toggle().getAttribute('aria-expanded')).toBe('false')
    expect(panel()).toBeNull()

    open()

    expect(toggle().getAttribute('aria-expanded')).toBe('true')
    expect(panel()).not.toBeNull()
    expect(document.activeElement).toBe(container.querySelector('input'))
  })

  it('should close the panel when the button is clicked again', () => {
    render()

    open()
    open()

    expect(panel()).toBeNull()
  })

  it('should render fields grouped by category', () => {
    render()
    open()

    const groups = Array.from(container.querySelectorAll('[role="group"]'))
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual(['Person', 'Company', 'Contact'])
    expect(groups[1].textContent).toContain('{companyName}')
    expect(groups[1].textContent).toContain('{yearsAtCompany}')
    expect(groups[2].textContent).toContain('{linkedinUrl}')
  })

  it('should filter fields by label or key', () => {
    render()
    open()

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
    open()

    search('zzz')
    expect(fieldButtons()).toHaveLength(0)
    expect(container.textContent).toContain('No fields match "zzz"')
  })

  it('should call onInsert and close the panel when a field is clicked', () => {
    const { onInsert } = render()
    open()

    const phoneButton = fieldButtons().find((button) => button.textContent?.includes('{phoneNumber}'))!
    act(() => phoneButton.click())

    expect(onInsert).toHaveBeenCalledWith('phoneNumber')
    expect(panel()).toBeNull()
  })

  it('should insert the first match on Enter, close the panel and reset the search', () => {
    const { onInsert } = render()
    open()

    const input = search('phone')
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    expect(onInsert).toHaveBeenCalledWith('phoneNumber')
    expect(panel()).toBeNull()

    open()
    expect((container.querySelector('input') as HTMLInputElement).value).toBe('')
  })

  it('should close the panel on Escape without letting the event reach the document', () => {
    render()
    open()
    const documentListener = vi.fn()
    document.addEventListener('keydown', documentListener)

    act(() => {
      container
        .querySelector('input')!
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    document.removeEventListener('keydown', documentListener)
    expect(panel()).toBeNull()
    expect(documentListener).not.toHaveBeenCalled()
  })

  it('should close the panel when clicking outside of it', () => {
    render()
    open()

    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    expect(panel()).toBeNull()
  })

  it('should show a retry action inside the panel when loading fields fails', () => {
    const { onRetry } = render({ fields: undefined, isError: true })
    open()

    const retry = panel()!.querySelector('button') as HTMLButtonElement
    expect(retry.textContent).toBe('Retry')
    act(() => retry.click())
    expect(onRetry).toHaveBeenCalled()
  })
})
