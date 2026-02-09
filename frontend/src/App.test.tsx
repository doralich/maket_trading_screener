import { render, screen } from '@testing-library/react'
import App from './App'
import { expect, test } from 'vitest'

test('renders dashboard title', () => {
  render(<App />)
  const titleElement = screen.getByText(/TV_SCREENER_V1.0/i)
  expect(titleElement).toBeInTheDocument()
})
