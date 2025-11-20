// app/__tests__/Home.test.tsx

import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// We no longer need jest.mock(...) here because it's handled in jest.config.mjs

describe('Home Page', () => {
  it('should render the main heading', () => {
    render(<Home />)

    const heading = screen.getByRole('heading', {
      name: /The Modern Interview Platform/i,
    })

    expect(heading).toBeInTheDocument()
  })
})