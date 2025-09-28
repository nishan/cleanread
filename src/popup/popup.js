import { StorageManager } from '../shared/storage.js';
import { MessageHandler } from '../shared/messaging.js';

class PopupController {
  constructor() {
    this.currentState = null;
    this.currentDomain = null;
    this.isPerSiteEnabled = false;
    this.initialize();
    this.setupEventListeners();
    this.setupMessageListener();
  }

  async initialize() {
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

      // Set appropriate shortcut text based on OS
      this.updateShortcutText();

    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showError('Failed to load settings');
    }
  }

  setupEventListeners() {
    // Master toggle
    const masterToggle = document.getElementById('masterToggle');
    masterToggle?.addEventListener('change', this.handleMasterToggle.bind(this));

    // Font selector
    const fontSelect = document.getElementById('fontSelect');
    fontSelect?.addEventListener('change', this.handleFontChange.bind(this));

    // Per-site toggle
    const perSiteToggle = document.getElementById('perSiteToggle');
    perSiteToggle?.addEventListener('change', this.handlePerSiteToggle.bind(this));
  }

  setupMessageListener() {
    // Listen for state changes from background script (e.g., keyboard shortcuts)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'STATE_CHANGED') {
        console.log('CleanRead Popup: State changed, updating UI');
        this.handleStateChange(message.data);
        sendResponse({ success: true });
      }
      return true; // Keep message channel open
    });
  }

  async updateUI() {
    if (!this.currentState) return;

    const profile = this.getActiveProfile();

    // Update master toggle
    const masterToggle = document.getElementById('masterToggle');
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

  async updateQuickControls(profile) {
    // Font selector
    const fontSelect = document.getElementById('fontSelect');
    if (fontSelect) {
      fontSelect.value = profile.typography.font;
    }
  }

  async updateSiteInfo() {
    const siteName = document.getElementById('siteName');
    if (siteName && this.currentDomain) {
      siteName.textContent = this.currentDomain;
    }

    const perSiteToggle = document.getElementById('perSiteToggle');
    if (perSiteToggle) {
      perSiteToggle.checked = this.isPerSiteEnabled;
    }
  }

  toggleControls(enabled) {
    const quickControls = document.getElementById('quickControls');
    if (quickControls) {
      quickControls.classList.toggle('disabled', !enabled);
    }
  }

  getActiveProfile() {
    if (!this.currentState) {
      throw new Error('No current state');
    }
    return this.currentState.profiles[this.currentState.activeProfileId] || this.currentState.profiles.default;
  }

  async handleMasterToggle(event) {
    const target = event.target;
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

  async handleFontChange(event) {
    const target = event.target;
    const font = target.value;

    await this.updateProfileSetting('typography', { font });
  }

  async handlePerSiteToggle(event) {
    const target = event.target;
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

  async updateProfileSetting(section, updates) {
    if (!this.currentState) return;

    try {
      const profile = this.getActiveProfile();
      const updatedProfile = {
        ...profile,
        [section]: { ...profile[section], ...updates }
      };

      await StorageManager.updateProfile(updatedProfile);
      this.currentState.profiles[updatedProfile.id] = updatedProfile;

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

  async handleStateChange(newState) {
    console.log('CleanRead Popup: Handling state change:', newState);
    this.currentState = newState;
    await this.updateUI();
  }

  updateShortcutText() {
    const shortcutElement = document.getElementById('shortcutText');
    if (!shortcutElement) return;

    // Detect operating system
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const shortcut = isMac ? 'Command+Shift+D' : 'Alt+Shift+D';
    
    shortcutElement.textContent = `${shortcut}: Toggle Mode`;
  }

  showError(message) {
    // Simple error display - in a real app you might want a more sophisticated notification system
    console.error(message);
    // You could add a toast notification here
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
