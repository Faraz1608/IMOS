import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      inventoryLastUpdated: null, // Add this new state
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      triggerInventoryUpdate: () => set({ inventoryLastUpdated: new Date() }), // Add this action
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;