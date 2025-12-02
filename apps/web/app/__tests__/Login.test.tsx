// app/__tests__/Login.test.tsx

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/(auth)/login/page';
import { useAuthStore } from '@/stores/authStore';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// We'll get the original implementation of the store
const originalState = useAuthStore.getState();

describe('Login Page', () => {
  // Reset the store's state before each test
  beforeEach(() => {
    act(() => {
      useAuthStore.setState(originalState);
    });
  });

  it('should allow a user to fill out the form and attempt to log in successfully', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // Mock the login function from our Zustand store to simulate a successful login
    act(() => {
        useAuthStore.setState({
            login: async () => {
                // Simulate the state change that happens on successful login
                useAuthStore.setState({
                    user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'STUDENT' },
                    isLoading: false,
                    error: null,
                });
                return true;
            },
        });
    });


    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    // Simulate user input
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Verify the input
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');

    // Simulate clicking the sign-in button
    await user.click(signInButton);

    // Assert that the login function was called and the UI reflects a loading state (optional)
    // For this example, we focus on the successful state change.
    expect(useAuthStore.getState().user?.email).toBe('test@example.com');
  });

  it('should show an error if login fails', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // Mock the login function to simulate a failed login
     act(() => {
        useAuthStore.setState({
            login: async () => {
                // Simulate the state change that happens on a failed login
                useAuthStore.setState({
                    user: null,
                    isLoading: false,
                    error: 'Invalid email or password',
                });
                return false;
            },
        });
     });


    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    // Simulate user input
    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(signInButton);

    // Assert that the user state is null and an error is set
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().error).toBe('Invalid email or password');
  });
});

