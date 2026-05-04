import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set) => ({
      // Auth State
      user: null, // { carNumber: string, pin: string }
      login: (carNumber, pin) => set({ user: { carNumber, pin } }),
      logout: () => set({ user: null }),

      // Setup State
      homeLocation: null, // { lat: number, lng: number, address: string }
      setHomeLocation: (location) => set({ homeLocation: location }),
      floorCount: 4, // default B4
      setFloorCount: (count) => set({ floorCount: count }),

      // Parking State
      parkingInfo: null, // { mode: 'home'|'external', location: string, timestamp: number, photo: string, memo: string }
      setParkingInfo: (info) => set({ parkingInfo: { ...info, timestamp: Date.now() } }),
      clearParkingInfo: () => set({ parkingInfo: null }),
      
      // Current Mode (home | external)
      currentMode: 'home',
      setCurrentMode: (mode) => set({ currentMode: mode }),
    }),
    {
      name: 'parking-master-storage', // saves to localStorage
    }
  )
)
