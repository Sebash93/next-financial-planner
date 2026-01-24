import { describe, it, expect } from 'vitest'
import { numberToCurrency, currencyToNumber } from './currencies'

describe('currencies', () => {
  describe('numberToCurrency', () => {
    it('formats a number as Colombian peso currency', () => {
      const result = numberToCurrency(1000)
      expect(result).toContain('1.000')
    })

    it('formats zero correctly', () => {
      const result = numberToCurrency(0)
      expect(result).toContain('0')
    })
  })

  describe('currencyToNumber', () => {
    it('converts currency string to number', () => {
      expect(currencyToNumber('$1.000')).toBe(1000)
    })

    it('handles string with only digits', () => {
      expect(currencyToNumber('5000')).toBe(5000)
    })

    it('returns 0 for empty string', () => {
      expect(currencyToNumber('')).toBe(0)
    })
  })
})
