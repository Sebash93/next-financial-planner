import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GridCellEdit } from './grid-cell-edit'
import { ColumnDef } from '@tanstack/react-table'

// Mock column for tests
const mockColumn: ColumnDef<unknown, unknown> = {
  header: 'Interes Mensual',
}

describe('GridCellEdit', () => {
  describe('interestRate accessor (percentage input)', () => {
    it('renders percentage input for interestRate accessor', () => {
      render(
        <GridCellEdit
          column={mockColumn}
          value={1.5}
          accessor="interestRate"
          onChange={() => {}}
        />
      )

      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('displays value with comma as decimal separator', () => {
      render(
        <GridCellEdit
          column={mockColumn}
          value={1.5}
          accessor="interestRate"
          onChange={() => {}}
        />
      )

      expect(screen.getByRole('textbox')).toHaveValue('1,5')
    })

    it('displays empty when value is null', () => {
      render(
        <GridCellEdit
          column={mockColumn}
          value={null}
          accessor="interestRate"
          onChange={() => {}}
        />
      )

      expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('outputs valid float when user types with dot', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()

      render(
        <GridCellEdit
          column={mockColumn}
          value={null}
          accessor="interestRate"
          onChange={onChange}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, '2.5')

      expect(onChange).toHaveBeenLastCalledWith(2.5)
    })

    it('outputs valid float when user types with comma', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()

      render(
        <GridCellEdit
          column={mockColumn}
          value={null}
          accessor="interestRate"
          onChange={onChange}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, '3,75')

      expect(onChange).toHaveBeenLastCalledWith(3.75)
    })

    it('outputs null when input is cleared', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()

      render(
        <GridCellEdit
          column={mockColumn}
          value={1.5}
          accessor="interestRate"
          onChange={onChange}
        />
      )

      const input = screen.getByRole('textbox')
      await user.clear(input)

      expect(onChange).toHaveBeenLastCalledWith(null)
    })

    it('limits input to 2 decimal places', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()

      render(
        <GridCellEdit
          column={mockColumn}
          value={null}
          accessor="interestRate"
          onChange={onChange}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, '1,999')

      // Should only allow 2 decimals
      expect(input).toHaveValue('1,99')
      expect(onChange).toHaveBeenLastCalledWith(1.99)
    })

    it('converts dot to comma in display while typing', async () => {
      const user = userEvent.setup()

      render(
        <GridCellEdit
          column={mockColumn}
          value={null}
          accessor="interestRate"
          onChange={() => {}}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, '1.5')

      expect(input).toHaveValue('1,5')
    })
  })

  describe('accessor routing', () => {
    it('renders text input for name accessor', () => {
      render(
        <GridCellEdit
          column={{ header: 'Nombre' }}
          value="Test"
          accessor="name"
          onChange={() => {}}
        />
      )

      expect(screen.getByRole('textbox')).toHaveValue('Test')
    })

    it('renders currency input for amount accessor', () => {
      render(
        <GridCellEdit
          column={{ header: 'Valor' }}
          value={1000}
          accessor="amount"
          onChange={() => {}}
        />
      )

      // Currency input formats as COP (may have special chars)
      const input = screen.getByRole('textbox')
      expect(input.getAttribute('value')).toMatch(/1\.000/)
    })

    it('renders currency input for currentBalance accessor', () => {
      render(
        <GridCellEdit
          column={{ header: 'Saldo Actual' }}
          value={5000}
          accessor="currentBalance"
          onChange={() => {}}
        />
      )

      const input = screen.getByRole('textbox')
      expect(input.getAttribute('value')).toMatch(/5\.000/)
    })

    it('renders currency input for monthlyPayment accessor', () => {
      render(
        <GridCellEdit
          column={{ header: 'Pago Mensual' }}
          value={200}
          accessor="monthlyPayment"
          onChange={() => {}}
        />
      )

      const input = screen.getByRole('textbox')
      expect(input.getAttribute('value')).toMatch(/200/)
    })
  })
})
