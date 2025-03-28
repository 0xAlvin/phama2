import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: string) => void;
}

export const useAppStore = create<UserPreferences>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language })
    }),
    {
      name: 'app-preferences',
      storage: typeof window !== 'undefined' 
        ? {
            getItem: (name) => {
              const str = localStorage.getItem(name);
              return str ? JSON.parse(str) : null;
            },
            setItem: (name, value) => {
              localStorage.setItem(name, JSON.stringify(value));
            },
            removeItem: (name) => localStorage.removeItem(name),
          }
        : undefined
    }
  )
);


