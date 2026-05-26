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
      floorRange: { min: -3, max: 0 }, // min: -3 (B3), max: 2 (2F). 0 means B1 is highest or 1F is highest? Let's use negative for B, positive for F. So min -3, max 1 => B3 ~ 1F. Wait, let's just keep min: -3, max: -1 for B3~B1 default.
      setFloorRange: (range) => set({ floorRange: range }),
      subZones: ['위', '아래'], // default sub-zones
      setSubZones: (zones) => set({ subZones: zones }),

      // Parking State
      parkingInfo: null, // { mode: 'home'|'external', location: string, timestamp: number, photo: string, memo: string }
      setParkingInfo: (info) => set({ parkingInfo: { ...info, timestamp: Date.now() } }),
      clearParkingInfo: () => set({ parkingInfo: null }),
      
      // Current Mode (home | external)
      currentMode: 'home',
      setCurrentMode: (mode) => set({ currentMode: mode }),

      // GPS automatic tracking preference
      useGpsTracking: 'prompt', // 'prompt' | 'always' | 'never'
      setUseGpsTracking: (value) => set({ useGpsTracking: value }),
    }),
    {
      name: 'parking-master-storage', // saves to localStorage
    }
  )
)
