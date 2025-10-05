import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '../lib/supabase';
import type { User, UserPreferences, HealthProfile } from '../types';

interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  updateHealthProfile: (profile: Partial<HealthProfile>) => Promise<void>;
  loadUser: (userId: string) => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    immer((set, get) => ({
      currentUser: null,
      isLoading: false,
      error: null,

      setUser: (user) => {
        set((state) => {
          state.currentUser = user;
          state.error = null;
        });
      },

      updatePreferences: async (preferences) => {
        const { currentUser } = get();
        if (!currentUser) {
          set({ error: 'No user logged in' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .update(preferences)
            .eq('user_id', currentUser.id)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            if (state.currentUser) {
              state.currentUser.preferences = {
                ...state.currentUser.preferences,
                ...preferences,
              };
            }
            state.isLoading = false;
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update preferences',
            isLoading: false
          });
        }
      },

      updateHealthProfile: async (profile) => {
        const { currentUser } = get();
        if (!currentUser) {
          set({ error: 'No user logged in' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const { data, error } = await supabase
            .from('health_profiles')
            .update(profile)
            .eq('user_id', currentUser.id)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            if (state.currentUser) {
              state.currentUser.healthProfile = {
                ...state.currentUser.healthProfile,
                ...profile,
              };
            }
            state.isLoading = false;
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update health profile',
            isLoading: false
          });
        }
      },

      loadUser: async (userId) => {
        set({ isLoading: true, error: null });

        try {
          // Load user data
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (userError) throw userError;

          // Load preferences
          const { data: preferencesData, error: preferencesError } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (preferencesError) throw preferencesError;

          // Load health profile
          const { data: healthData, error: healthError } = await supabase
            .from('health_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (healthError) throw healthError;

          const user: User = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar,
            createdAt: new Date(userData.created_at),
            preferences: {
              language: preferencesData.language,
              timezone: preferencesData.timezone,
              communicationStyle: preferencesData.communication_style,
              preferredTimes: preferencesData.preferred_times,
              privacySettings: preferencesData.privacy_settings,
            },
            healthProfile: {
              age: healthData.age,
              goals: [],
              conditions: healthData.conditions,
              medications: healthData.medications,
              lifestyle: healthData.lifestyle,
            },
          };

          set({ currentUser: user, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load user',
            isLoading: false
          });
        }
      },

      clearUser: () => {
        set({ currentUser: null, error: null });
      },
    })),
    {
      name: 'bearable-user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
