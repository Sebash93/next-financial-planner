import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputPercentage } from './input-percentage'

describe('InputPercentage', () => {
  describe('display', () => {
    it('displays empty when value is null', () => {
      render(<InputPercentage value={null} onChange={() => {}} />)
      expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('displays empty when value is undefined', () => {
      render(<InputPercentage value={undefined} onChange={() => {}} />)
      expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('displays value with comma as decimal separator', () => {
      render(<InputPercentage value={1.5} onChange={() => {}} />)
      expect(screen.getByRole('textbox')).toHaveValue('1,5')
    })

    it('displays integer without decimal separator', () => {
      render(<InputPercentage value={5} onChange={() => {}} />)
      expect(screen.getByRole('textbox')).toHaveValue('5')
    })

    it('displays max 2 decimal places', () => {
      render(<InputPercentage value={1.567} onChange={() => {}} />)
      expect(screen.getByRole('textbox')).toHaveValue('1,57')
    })
  })

  describe('input with dot', () => {
    it('converts dot to comma while typing', async () => {
      const user = userEvent.setup()
      render(<InputPercentage value={null} onChange={() => {}} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '1.5')

      expect(input).toHaveValue('1,5')
    })
  })

  describe('input with comma', () => {
    it('accepts comma as decimal separator', async () => {
      const user = userEvent.setup()
      render(<InputPercentage value={null} onChange={() => {}} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '1,5')

      expect(input).toHaveValue('1,5')
    })
  })

  describe('onChange output', () => {
    it('outputs valid float number when using dot', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputPercentage value={null} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '1.5')

      expect(onChange).toHaveBeenLastCalledWith(1.5)
    })

    it('outputs valid float number when using comma', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputPercentage value={null} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '2,75')

      expect(onChange).toHaveBeenLastCalledWith(2.75)
    })

    it('outputs null when input is cleared', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputPercentage value={1.5} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.clear(input)

      expect(onChange).toHaveBeenLastCalledWith(null)
    })

    it('outputs integer when no decimals', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputPercentage value={null} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '5')

      expect(onChange).toHaveBeenLastCalledWith(5)
    })
  })

  describe('decimal limits', () => {
    it('limits input to 2 decimal places', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputPercentage value={null} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '1,567')

      // Should only allow 1,56 (2 decimals max)
      expect(input).toHaveValue('1,56')
      expect(onChange).toHaveBeenLastCalledWith(1.56)
    })

    it('allows typing decimal separator after integer', async () => {
      const user = userEvent.setup()
      render(<InputPercentage value={null} onChange={() => {}} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '5,')

      expect(input).toHaveValue('5,')
    })
  })

  describe('invalid input', () => {
    it('rejects non-numeric characters', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputPercentage value={null} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'abc')

      expect(input).toHaveValue('')
    })

    it('rejects multiple decimal separators', async () => {
      const user = userEvent.setup()
      render(<InputPercentage value={null} onChange={() => {}} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '1,,5')

      expect(input).toHaveValue('1,5')
    })
  })
})
