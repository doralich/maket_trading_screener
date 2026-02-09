import { render, screen } from '@testing-library/react'
import CryptoTable from './CryptoTable'
import { expect, test } from 'vitest'

const mockData = [
  { ticker: 'BTCUSD', last: 50000, change: 2.5, volume: '10B' },
  { ticker: 'ETHUSD', last: 3000, change: -1.2, volume: '5B' }
]

test('renders crypto table with data', () => {
  render(<CryptoTable data={mockData} />)
  expect(screen.getByText('BTCUSD')).toBeInTheDocument()
  expect(screen.getByText('ETHUSD')).toBeInTheDocument()
})

test('renders no data message', () => {
  render(<CryptoTable data={[]} />)
  expect(screen.getByText(/NO_MATCHING_DATA_FOUND/i)).toBeInTheDocument()
})
