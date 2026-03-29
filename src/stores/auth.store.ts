import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser } from "@/types";

interface AuthState {
  user: SessionUser | null;
  refreshToken: string | null;
  setUser: (user: SessionUser) => void;
  setRefreshToken: (token: string) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      refreshToken: null,

      setUser: (user) => set({ user }),

      setRefreshToken: (refreshToken) => set({ refreshToken }),

      clearAuth: () => set({ user: null, refreshToken: null }),

      logout: async () => {
        const { refreshToken } = get();
        try {
          await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "logout", refreshToken }),
          });
        } finally {
          set({ user: null, refreshToken: null });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
