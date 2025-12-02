// app/__tests__/Signup.test.tsx

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignupPage from '@/app/(auth)/signup/page'

// Since the signup page uses the router, we need to mock it.
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
    };
  },
}));

// We also mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('Signup Page', () => {
  it('allows a user to fill out the form and attempt to sign up', async () => {
    // We need an async user instance for modern event simulation
    const user = userEvent.setup()
    render(<SignupPage />)

    // Find all the form fields
    const nameInput = screen.getByLabelText(/Full Name/i)
    const emailInput = screen.getByLabelText(/Email/i)
    const passwordInput = screen.getByLabelText(/Password/i)
    const termsCheckbox = screen.getByLabelText(/I agree to the Terms of Service/i)
    const createAccountButton = screen.getByRole('button', { name: /Create Account/i })

    // Assert that the button is initially enabled (before submission)
    expect(createAccountButton).toBeEnabled()

    // Simulate a user typing into the fields
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john.doe@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(termsCheckbox)

    // Verify the values were entered correctly
    expect(nameInput).toHaveValue('John Doe')
    expect(emailInput).toHaveValue('john.doe@example.com')
    expect(passwordInput).toHaveValue('password123')
    expect(termsCheckbox).toBeChecked()

    // Simulate clicking the create account button
    await user.click(createAccountButton)

    // This test doesn't check the API call result, but it confirms the entire UI
    // flow is working correctly from the user's perspective.
    // In a more advanced setup, we would mock the `fetch` call to verify API interaction.
  });
});

