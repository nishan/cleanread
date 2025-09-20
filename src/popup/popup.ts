import { StorageManager } from '../shared/storage.js';
import { MessageHandler } from '../shared/messaging.js';
import { AppState, Profile } from '../shared/settings.js';

class PopupController {
  private currentState: AppState | null = null;
  private currentDomain: string | null = null;
  private isPerSiteEnabled = false;

  constructor() {
    this.initialize();
    this.setupEventListeners();
  }

  private async initialize(): Promise<void> {
    try {
      // Get current domain
      this.currentDomain = await MessageHandler.getCurrentDomain();
      
      // Load current state
      this.currentState = await StorageManager.getAppState();
      
      // Check if per-site settings exist
      if (this.currentDomain) {
        const perSiteSettings = await StorageManager.getPerSiteSettings(this.currentDomain);
        this.isPerSiteEnabled = !!perSiteSettings;
      }
      
      // Update UI
      await this.updateUI();
      
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showError('Failed to load settings');
    }
  }

  private setupEventListeners(): void {
    // Master toggle
    const masterToggle = document.getElementById('masterToggle') as HTMLInputElement;
    masterToggle?.addEventListener('change', this.handleMasterToggle.bind(this));

    // Font selector
    const fontSelect = document.getElementById('fontSelect') as HTMLSelectElement;
    fontSelect?.addEventListener('change', this.handleFontChange.bind(this));

    // Theme selector
    const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
    themeSelect?.addEventListener('change', this.handleThemeChange.bind(this));

    // Line focus toggle
    const lineFocusToggle = document.getElementById('lineFocusToggle') as HTMLInputElement;
    lineFocusToggle?.addEventListener('change', this.handleLineFocusToggle.bind(this));

    // Reader view toggle
    const readerViewToggle = document.getElementById('readerViewToggle') as HTMLInputElement;
    readerViewToggle?.addEventListener('change', this.handleReaderViewToggle.bind(this));

    // Per-site toggle
    const perSiteToggle = document.getElementById('perSiteToggle') as HTMLInputElement;
    perSiteToggle?.addEventListener('change', this.handlePerSiteToggle.bind(this));

    // Action buttons
    const moreSettingsBtn = document.getElementById('moreSettingsBtn');
    moreSettingsBtn?.addEventListener('click', this.openOptionsPage.bind(this));

    const speakSelectionBtn = document.getElementById('speakSelectionBtn');
    speakSelectionBtn?.addEventListener('click', this.speakSelection.bind(this));
  }

  private async updateUI(): Promise<void> {
    if (!this.currentState) return;

    const profile = this.getActiveProfile();
    
    // Update master toggle
    const masterToggle = document.getElementById('masterToggle') as HTMLInputElement;
    if (masterToggle) {
      masterToggle.checked = this.currentState.enabled;
    }

    // Update status indicator
    const statusIndicator = document.getElementById('statusIndicator');
    if (statusIndicator) {
      statusIndicator.classList.toggle('active', this.currentState.enabled);
    }

    // Update quick controls
    await this.updateQuickControls(profile);

    // Update site info
    await this.updateSiteInfo();

    // Enable/disable controls based on master toggle
    this.toggleControls(this.currentState.enabled);
  }

  private async updateQuickControls(profile: Profile): Promise<void> {
    // Font selector
    const fontSelect = document.getElementById('fontSelect') as HTMLSelectElement;
    if (fontSelect) {
      fontSelect.value = profile.typography.font;
    }

    // Theme selector
    const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
    if (themeSelect) {
      themeSelect.value = profile.theme.theme;
    }

    // Line focus toggle
    const lineFocusToggle = document.getElementById('lineFocusToggle') as HTMLInputElement;
    if (lineFocusToggle) {
      lineFocusToggle.checked = profile.focus.enabled;
    }

    // Reader view toggle
    const readerViewToggle = document.getElementById('readerViewToggle') as HTMLInputElement;
    if (readerViewToggle) {
      readerViewToggle.checked = profile.readability.enabled;
    }
  }

  private async updateSiteInfo(): Promise<void> {
    const siteName = document.getElementById('siteName');
    if (siteName && this.currentDomain) {
      siteName.textContent = this.currentDomain;
    }

    const perSiteToggle = document.getElementById('perSiteToggle') as HTMLInputElement;
    if (perSiteToggle) {
      perSiteToggle.checked = this.isPerSiteEnabled;
    }
  }

  private toggleControls(enabled: boolean): void {
    const quickControls = document.getElementById('quickControls');
    if (quickControls) {
      quickControls.classList.toggle('disabled', !enabled);
    }
  }

  private getActiveProfile(): Profile {
    if (!this.currentState) {
      throw new Error('No current state');
    }
    return this.currentState.profiles[this.currentState.activeProfileId] || this.currentState.profiles.default;
  }

  private async handleMasterToggle(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const enabled = target.checked;

    try {
      // Update global state
      if (this.currentState) {
        this.currentState.enabled = enabled;
        await StorageManager.saveAppState(this.currentState);
      }

      // Apply to current tab
      const tab = await MessageHandler.getActiveTab();
      if (tab?.id) {
        await MessageHandler.sendToContentScript(tab.id, {
          type: 'TOGGLE_MODE',
          data: { enabled }
        });
      }

      // Update UI
      this.toggleControls(enabled);
      const statusIndicator = document.getElementById('statusIndicator');
      if (statusIndicator) {
        statusIndicator.classList.toggle('active', enabled);
      }

    } catch (error) {
      console.error('Failed to toggle mode:', error);
      target.checked = !enabled; // Revert UI
      this.showError('Failed to toggle dyslexia mode');
    }
  }

  private async handleFontChange(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement;
    const font = target.value as any;

    await this.updateProfileSetting('typography', { font });
  }

  private async handleThemeChange(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement;
    const theme = target.value as any;

    await this.updateProfileSetting('theme', { theme });
  }

  private async handleLineFocusToggle(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const enabled = target.checked;

    await this.updateProfileSetting('focus', { enabled });
  }

  private async handleReaderViewToggle(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const enabled = target.checked;

    await this.updateProfileSetting('readability', { enabled });
  }

  private async handlePerSiteToggle(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const enabled = target.checked;

    if (!this.currentDomain) return;

    try {
      if (enabled) {
        // Create per-site settings
        const perSiteSettings = {
          enabled: this.currentState?.enabled || false,
          activeProfileId: this.currentState?.activeProfileId || 'default',
          profiles: this.currentState?.profiles || {}
        };
        await StorageManager.savePerSiteSettings(this.currentDomain, perSiteSettings);
        this.isPerSiteEnabled = true;
      } else {
        // Remove per-site settings
        await StorageManager.removePerSiteSettings(this.currentDomain);
        this.isPerSiteEnabled = false;
      }
    } catch (error) {
      console.error('Failed to toggle per-site settings:', error);
      target.checked = !enabled; // Revert UI
      this.showError('Failed to update per-site settings');
    }
  }

  private async updateProfileSetting(section: keyof Profile, updates: any): Promise<void> {
    if (!this.currentState) return;

    try {
      const profile = this.getActiveProfile();
      const updatedProfile = {
        ...profile,
        [section]: { ...(profile[section] as any), ...updates }
      };

      await StorageManager.updateProfile(updatedProfile);

      // Apply to current tab
      const tab = await MessageHandler.getActiveTab();
      if (tab?.id) {
        await MessageHandler.sendToContentScript(tab.id, {
          type: 'UPDATE_PROFILE',
          data: updatedProfile
        });
      }

    } catch (error) {
      console.error('Failed to update profile setting:', error);
      this.showError('Failed to update setting');
    }
  }

  private async openOptionsPage(): Promise<void> {
    try {
      await chrome.runtime.openOptionsPage();
      window.close();
    } catch (error) {
      console.error('Failed to open options page:', error);
      this.showError('Failed to open settings page');
    }
  }

  private async speakSelection(): Promise<void> {
    try {
      const tab = await MessageHandler.getActiveTab();
      if (tab?.id) {
        await MessageHandler.sendToContentScript(tab.id, {
          type: 'READ_SELECTION'
        });
      }
    } catch (error) {
      console.error('Failed to speak selection:', error);
      this.showError('Failed to speak selection');
    }
  }

  private showError(message: string): void {
    // Simple error display - in a real app you might want a more sophisticated notification system
    console.error(message);
    // You could add a toast notification here
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
