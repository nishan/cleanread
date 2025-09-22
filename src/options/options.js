import { StorageManager } from '../shared/storage.js';
import { MessageHandler } from '../shared/messaging.js';

class OptionsController {
  constructor() {
    this.currentState = null;
    this.currentDomain = null;
    this.isPerSiteEnabled = false;
    this.initialize();
    this.setupEventListeners();
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
      
    } catch (error) {
      console.error('Failed to initialize options:', error);
      this.showError('Failed to load settings');
    }
  }

  setupEventListeners() {
    // Add event listeners for all the detailed settings controls
    // This would include sliders, color pickers, etc.
    console.log('Options event listeners setup');
  }

  async updateUI() {
    if (!this.currentState) return;

    const profile = this.getActiveProfile();
    
    // Update all the detailed settings controls
    // This would populate all the form fields with current values
    console.log('Options UI updated');
  }

  getActiveProfile() {
    if (!this.currentState) {
      throw new Error('No current state');
    }
    return this.currentState.profiles[this.currentState.activeProfileId] || this.currentState.profiles.default;
  }

  showError(message) {
    console.error(message);
    // You could add a toast notification here
  }
}

// Initialize options when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
