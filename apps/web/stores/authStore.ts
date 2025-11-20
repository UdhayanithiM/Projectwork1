// stores/authStore.ts
import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  // ✅ CHANGED: isLoading now tracks the initial authentication check
  isLoading: boolean; 
  error: string | null;
  login: (loginData: any) => Promise<boolean>;
  register: (registerData: any) => Promise<boolean>;
  logout: () => Promise<void>; // ✅ CHANGED: Logout should be async
  clearError: () => void;
  // ✅ ADDED: A new action to check auth status on app load
  checkAuthStatus: () => Promise<void>; 
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  // ✅ CHANGED: Start in a loading state to wait for the initial check
  isLoading: true, 
  error: null,

  clearError: () => set({ error: null }),

  // ✅ ADDED: The new action to verify the user's cookie
  checkAuthStatus: async () => {
    try {
      const response = await fetch('/api/auth/me'); // New endpoint
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      const result = await response.json();
      set({ user: result.user, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  },

  login: async (loginData) => {
    // This action now only needs to set loading for the login action itself
    set({ isLoading: true, error: null }); 
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Login failed.');
      }

      set({ user: result.user, isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },
  
  // ✅ CHANGED: Logout needs to call an API to clear the server cookie
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    set({ user: null, isLoading: false });
  },

  register: async (registerData) => {
    // This function is well-written and does not need changes.
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      const result = await response.json();
      if (!response.ok) {
        if (result.details) {
          const firstError = Object.values(result.details)[0];
          throw new Error(firstError as string);
        }
        throw new Error(result.error || 'Registration failed.');
      }
      
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },
}));