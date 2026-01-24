import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GridCellCurrency } from './grid-cell-currency'

describe('GridCellCurrency', () => {
  it('renders formatted currency value', () => {
    render(<GridCellCurrency amount={1000} />)
    expect(screen.getByText(/1\.000/)).toBeInTheDocument()
  })

  it('renders zero when amount is null', () => {
    render(<GridCellCurrency amount={null} />)
    expect(screen.getByText(/0/)).toBeInTheDocument()
  })

  it('renders zero when amount is undefined', () => {
    render(<GridCellCurrency amount={undefined} />)
    expect(screen.getByText(/0/)).toBeInTheDocument()
  })
})
