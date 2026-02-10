import { render, screen } from '@testing-library/react'
import CryptoTable from './CryptoTable'
import { expect, test } from 'vitest'

import { MarketUpdate } from './CryptoTable'

const mockData: MarketUpdate[] = [
  { Symbol: 'BTCUSD', Exchange: 'BINANCE', Price: 50000, 'Change %': 2.5 },
  { Symbol: 'ETHUSD', Exchange: 'BINANCE', Price: 3000, 'Change %': -1.2 }
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
