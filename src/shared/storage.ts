import { AppState, Profile, DEFAULT_PROFILE, PRESETS } from './settings.js';

const STORAGE_KEYS = {
  APP_STATE: 'appState',
  PER_SITE_PREFIX: 'perSite_'
} as const;

export class StorageManager {
  static async getAppState(): Promise<AppState> {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.APP_STATE);
    return result[STORAGE_KEYS.APP_STATE] || this.getDefaultAppState();
  }

  static async saveAppState(state: AppState): Promise<void> {
    await chrome.storage.sync.set({ [STORAGE_KEYS.APP_STATE]: state });
  }

  static async getPerSiteSettings(domain: string): Promise<Partial<AppState> | null> {
    const key = `${STORAGE_KEYS.PER_SITE_PREFIX}${domain}`;
    const result = await chrome.storage.local.get(key);
    return result[key] || null;
  }

  static async savePerSiteSettings(domain: string, settings: Partial<AppState>): Promise<void> {
    const key = `${STORAGE_KEYS.PER_SITE_PREFIX}${domain}`;
    await chrome.storage.local.set({ [key]: settings });
  }

  static async removePerSiteSettings(domain: string): Promise<void> {
    const key = `${STORAGE_KEYS.PER_SITE_PREFIX}${domain}`;
    await chrome.storage.local.remove(key);
  }

  static async getEffectiveState(domain: string): Promise<AppState> {
    const globalState = await this.getAppState();
    const perSiteSettings = await this.getPerSiteSettings(domain);
    
    if (!perSiteSettings) {
      return globalState;
    }

    // Merge global state with per-site overrides
    return this.mergeStates(globalState, perSiteSettings);
  }

  static async updateProfile(profile: Profile): Promise<void> {
    const state = await this.getAppState();
    state.profiles[profile.id] = profile;
    await this.saveAppState(state);
  }

  static async createProfile(profile: Profile): Promise<void> {
    const state = await this.getAppState();
    state.profiles[profile.id] = profile;
    await this.saveAppState(state);
  }

  static async deleteProfile(profileId: string): Promise<void> {
    const state = await this.getAppState();
    delete state.profiles[profileId];
    
    // If we deleted the active profile, switch to default
    if (state.activeProfileId === profileId) {
      state.activeProfileId = 'default';
    }
    
    await this.saveAppState(state);
  }

  static async setActiveProfile(profileId: string): Promise<void> {
    const state = await this.getAppState();
    if (state.profiles[profileId]) {
      state.activeProfileId = profileId;
      await this.saveAppState(state);
    }
  }

  static async exportProfiles(): Promise<string> {
    const state = await this.getAppState();
    return JSON.stringify(state.profiles, null, 2);
  }

  static async importProfiles(jsonData: string): Promise<void> {
    try {
      const profiles = JSON.parse(jsonData);
      const state = await this.getAppState();
      
      // Validate and merge profiles
      for (const [id, profile] of Object.entries(profiles)) {
        if (this.isValidProfile(profile)) {
          state.profiles[id] = profile as Profile;
        }
      }
      
      await this.saveAppState(state);
    } catch (error) {
      throw new Error('Invalid profile data');
    }
  }

  static async applyPreset(presetName: string): Promise<void> {
    const preset = PRESETS[presetName];
    if (!preset) return;

    const state = await this.getAppState();
    const activeProfile = state.profiles[state.activeProfileId];
    
    if (activeProfile) {
      const updatedProfile = { ...activeProfile, ...preset };
      state.profiles[state.activeProfileId] = updatedProfile;
      await this.saveAppState(state);
    }
  }

  private static getDefaultAppState(): AppState {
    const profiles: Record<string, Profile> = {
      default: DEFAULT_PROFILE
    };

    // Add preset profiles
    Object.entries(PRESETS).forEach(([key, preset]) => {
      profiles[key] = {
        ...DEFAULT_PROFILE,
        id: key,
        ...preset
      } as Profile;
    });

    return {
      enabled: false,
      activeProfileId: 'default',
      profiles,
      perSite: {}
    };
  }

  private static mergeStates(global: AppState, perSite: Partial<AppState>): AppState {
    const merged = { ...global };
    
    if (perSite.enabled !== undefined) merged.enabled = perSite.enabled;
    if (perSite.activeProfileId) merged.activeProfileId = perSite.activeProfileId;
    if (perSite.profiles) {
      merged.profiles = { ...global.profiles, ...perSite.profiles };
    }
    
    return merged;
  }

  private static isValidProfile(profile: any): boolean {
    return profile && 
           typeof profile.id === 'string' && 
           typeof profile.name === 'string' &&
           profile.typography &&
           profile.theme &&
           profile.focus &&
           profile.tts &&
           profile.readability;
  }
}
