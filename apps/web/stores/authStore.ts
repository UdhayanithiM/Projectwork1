import { create } from 'zustand';

interface ProfileData {
  skills?: string[];
  experience_years?: number;
  seniority?: string;
  suggested_difficulty?: string;
  // Allows for other potential keys from the AI
  [key: string]: any; 
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  // ✅ ADDED: Stores the AI-parsed resume data
  profileData?: ProfileData | null;
}

interface AuthState {
  user: User | null;
  // isLoading tracks the initial authentication check
  isLoading: boolean; 
  error: string | null;
  login: (loginData: any) => Promise<boolean>;
  register: (registerData: any) => Promise<boolean>;
  logout: () => Promise<void>; 
  clearError: () => void;
  // Checks auth status on app load
  checkAuthStatus: () => Promise<void>; 
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  // Start in a loading state to wait for the initial check
  isLoading: true, 
  error: null,

  clearError: () => set({ error: null }),

  // Verify the user's cookie via API
  checkAuthStatus: async () => {
    try {
      const response = await fetch('/api/auth/me'); 
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
  
  // Logout calls API to clear server cookie
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    set({ user: null, isLoading: false });
  },

  register: async (registerData) => {
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