import { describe, it, expect } from 'vitest'
import { COUNTRY_CODES, isValidCountryCode } from './countryCodes'

describe('isValidCountryCode', () => {
  it('should contain all 249 ISO 3166-1 alpha-2 codes', () => {
    expect(COUNTRY_CODES.size).toBe(249)
  })

  it('should accept valid codes regardless of case and whitespace', () => {
    expect(isValidCountryCode('US')).toBe(true)
    expect(isValidCountryCode('gb')).toBe(true)
    expect(isValidCountryCode(' ES ')).toBe(true)
  })

  it('should reject invalid codes', () => {
    expect(isValidCountryCode('')).toBe(false)
    expect(isValidCountryCode('XXX')).toBe(false)
    expect(isValidCountryCode('12')).toBe(false)
    expect(isValidCountryCode('ZZ')).toBe(false)
    expect(isValidCountryCode('UK')).toBe(false)
    expect(isValidCountryCode('EU')).toBe(false)
  })
})
