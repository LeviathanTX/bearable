/**
 * Voice Preferences Manager
 *
 * Manages persistent storage of user voice preferences across sessions.
 * Integrates with ElevenLabs voice service to remember user's favorite
 * specialist and voice combinations.
 */

export interface VoicePreferences {
  defaultSpecialistId: string;
  specialistVoiceMap: Record<string, string>; // specialist ID -> voice ID
  voiceSettings: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  conversationPacing: {
    maxTurnDuration?: number;
    silenceTimeoutUser?: number;
    enableInterruptions?: boolean;
    adaptivePacing?: boolean;
  };
  lastUpdated: string;
}

const STORAGE_KEY = 'bearable_voice_preferences';

const DEFAULT_PREFERENCES: VoicePreferences = {
  defaultSpecialistId: 'dr-maya-wellness',
  specialistVoiceMap: {
    'host-bearable': 'pNInz6obpgDQGcFmaJgB', // Adam
    'dr-maya-wellness': 'pNInz6obpgDQGcFmaJgB', // Adam
    'coach-alex-fitness': 'TxGEqnHWrfWFTfGW9XjX', // Josh
    'nutritionist-sarah': 'jsCqWAovK2LkecY7zXl4', // Freya
    'therapist-david': 'onwK4e9ZLuTAKqWW03F9', // Daniel
    'dr-lisa-relationships': 'XB0fDUnXU5powFXDhCwa', // Charlotte
    'dr-chen-purpose': 'AZnzlk1XvdvUeBnXmlld' // Domi
  },
  voiceSettings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.2,
    use_speaker_boost: false
  },
  conversationPacing: {
    maxTurnDuration: 30000,
    silenceTimeoutUser: 2000,
    enableInterruptions: true,
    adaptivePacing: true
  },
  lastUpdated: new Date().toISOString()
};

export class VoicePreferencesManager {
  /**
   * Load voice preferences from localStorage
   */
  static load(): VoicePreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all fields exist
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          voiceSettings: {
            ...DEFAULT_PREFERENCES.voiceSettings,
            ...parsed.voiceSettings
          },
          conversationPacing: {
            ...DEFAULT_PREFERENCES.conversationPacing,
            ...parsed.conversationPacing
          }
        };
      }
    } catch (error) {
      console.warn('Failed to load voice preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  }

  /**
   * Save voice preferences to localStorage
   */
  static save(preferences: Partial<VoicePreferences>): void {
    try {
      const current = this.load();
      const updated: VoicePreferences = {
        ...current,
        ...preferences,
        voiceSettings: {
          ...current.voiceSettings,
          ...(preferences.voiceSettings || {})
        },
        conversationPacing: {
          ...current.conversationPacing,
          ...(preferences.conversationPacing || {})
        },
        specialistVoiceMap: {
          ...current.specialistVoiceMap,
          ...(preferences.specialistVoiceMap || {})
        },
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log('✅ Voice preferences saved successfully');
    } catch (error) {
      console.error('Failed to save voice preferences:', error);
    }
  }

  /**
   * Get preferred voice for a specific specialist
   */
  static getPreferredVoiceForSpecialist(specialistId: string): string | null {
    const preferences = this.load();
    return preferences.specialistVoiceMap[specialistId] || null;
  }

  /**
   * Set preferred voice for a specific specialist
   */
  static setPreferredVoiceForSpecialist(specialistId: string, voiceId: string): void {
    const preferences = this.load();
    preferences.specialistVoiceMap[specialistId] = voiceId;
    this.save({ specialistVoiceMap: preferences.specialistVoiceMap });
  }

  /**
   * Get default specialist ID
   */
  static getDefaultSpecialist(): string {
    const preferences = this.load();
    return preferences.defaultSpecialistId;
  }

  /**
   * Set default specialist
   */
  static setDefaultSpecialist(specialistId: string): void {
    this.save({ defaultSpecialistId: specialistId });
  }

  /**
   * Update voice settings
   */
  static updateVoiceSettings(settings: Partial<VoicePreferences['voiceSettings']>): void {
    const preferences = this.load();
    this.save({
      voiceSettings: {
        ...preferences.voiceSettings,
        ...settings
      }
    });
  }

  /**
   * Update conversation pacing settings
   */
  static updateConversationPacing(pacing: Partial<VoicePreferences['conversationPacing']>): void {
    const preferences = this.load();
    this.save({
      conversationPacing: {
        ...preferences.conversationPacing,
        ...pacing
      }
    });
  }

  /**
   * Get voice settings
   */
  static getVoiceSettings(): VoicePreferences['voiceSettings'] {
    const preferences = this.load();
    return preferences.voiceSettings;
  }

  /**
   * Get conversation pacing settings
   */
  static getConversationPacing(): VoicePreferences['conversationPacing'] {
    const preferences = this.load();
    return preferences.conversationPacing;
  }

  /**
   * Reset to default preferences
   */
  static reset(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('🔄 Voice preferences reset to defaults');
    } catch (error) {
      console.error('Failed to reset voice preferences:', error);
    }
  }

  /**
   * Export preferences as JSON
   */
  static export(): string {
    const preferences = this.load();
    return JSON.stringify(preferences, null, 2);
  }

  /**
   * Import preferences from JSON
   */
  static import(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      this.save(parsed);
      return true;
    } catch (error) {
      console.error('Failed to import voice preferences:', error);
      return false;
    }
  }

  /**
   * Get preferences summary for display
   */
  static getSummary(): string {
    const preferences = this.load();
    const specialists = Object.keys(preferences.specialistVoiceMap).length;
    const lastUpdated = new Date(preferences.lastUpdated).toLocaleDateString();

    return `
Default Specialist: ${preferences.defaultSpecialistId}
Configured Specialists: ${specialists}
Last Updated: ${lastUpdated}
Interruptions: ${preferences.conversationPacing.enableInterruptions ? 'Enabled' : 'Disabled'}
Adaptive Pacing: ${preferences.conversationPacing.adaptivePacing ? 'Enabled' : 'Disabled'}
    `.trim();
  }
}

// Export singleton-style utility functions
export const voicePreferences = {
  load: VoicePreferencesManager.load.bind(VoicePreferencesManager),
  save: VoicePreferencesManager.save.bind(VoicePreferencesManager),
  getPreferredVoiceForSpecialist: VoicePreferencesManager.getPreferredVoiceForSpecialist.bind(VoicePreferencesManager),
  setPreferredVoiceForSpecialist: VoicePreferencesManager.setPreferredVoiceForSpecialist.bind(VoicePreferencesManager),
  getDefaultSpecialist: VoicePreferencesManager.getDefaultSpecialist.bind(VoicePreferencesManager),
  setDefaultSpecialist: VoicePreferencesManager.setDefaultSpecialist.bind(VoicePreferencesManager),
  updateVoiceSettings: VoicePreferencesManager.updateVoiceSettings.bind(VoicePreferencesManager),
  updateConversationPacing: VoicePreferencesManager.updateConversationPacing.bind(VoicePreferencesManager),
  getVoiceSettings: VoicePreferencesManager.getVoiceSettings.bind(VoicePreferencesManager),
  getConversationPacing: VoicePreferencesManager.getConversationPacing.bind(VoicePreferencesManager),
  reset: VoicePreferencesManager.reset.bind(VoicePreferencesManager),
  export: VoicePreferencesManager.export.bind(VoicePreferencesManager),
  import: VoicePreferencesManager.import.bind(VoicePreferencesManager),
  getSummary: VoicePreferencesManager.getSummary.bind(VoicePreferencesManager)
};
