import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * This build has no accounts (no register / login / refresh).
 *
 * The app starts authenticated so the dashboard, project, editor and
 * render pages work without a sign-in wall. The shape is intentionally
 * kept close to the previous auth store so the rest of the client code
 * (api interceptor, render page SSE token, navbar) keeps working.
 */
interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  /** Always populated in this build. */
  user: User | null;
  /** Stays empty — there is no token issuance in this build. */
  accessToken: string | null;
  /** Stays empty — there is no token issuance in this build. */
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateToken: (accessToken: string) => void;
}

const devUser: User = {
  id: 'clipforge-user',
  email: 'user@clipforge.local',
  name: 'ClipForge User',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: devUser,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: true,

      setAuth: (_user: User, _accessToken: string, _refreshToken: string) =>
        set({ user: devUser, accessToken: null, refreshToken: null, isAuthenticated: true }),

      logout: () =>
        set({ user: devUser, accessToken: null, refreshToken: null, isAuthenticated: true }),

      updateToken: (_accessToken: string) => set({ accessToken: null }),
    }),
    {
      name: 'clipforge-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
// Explicit safe navigation for consumers that read nested user fields.
(useAuthStore.getState().user ?? {}).name;
