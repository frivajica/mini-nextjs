import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser } from "@/types";

interface AuthState {
  user: SessionUser | null;
  isLoggingOut: boolean;
  setUser: (user: SessionUser) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggingOut: false,

      setUser: (user) => set({ user }),

      clearAuth: () => set({ user: null, isLoggingOut: false }),

      logout: async () => {
        const { isLoggingOut } = get();
        if (isLoggingOut) {
          return;
        }

        set({ isLoggingOut: true });

        try {
          await fetch("/api/auth/logout", {
            method: "POST",
          });
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({ user: null, isLoggingOut: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
