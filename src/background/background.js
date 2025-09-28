import { StorageManager } from '../shared/storage.js';
import { MessageHandler } from '../shared/messaging.js';

class BackgroundService {
  constructor() {
    this.initialized = false;
    this.initialize();
    this.setupMessageHandlers();
    this.setupCommandHandlers();
    this.setupTabHandlers();
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Ensure we have a default app state
      const state = await StorageManager.getAppState();
      if (!state.profiles.default) {
        await StorageManager.saveAppState(state);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize background service:', error);
    }
  }

  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'GET_CURRENT_STATE':
          const state = await StorageManager.getAppState();
          sendResponse(state);
          break;

        case 'SET_PER_SITE_OVERRIDE':
          await StorageManager.savePerSiteSettings(message.data.domain, message.data.settings);
          sendResponse({ success: true });
          break;

        case 'REMOVE_PER_SITE_OVERRIDE':
          await StorageManager.removePerSiteSettings(message.data.domain);
          sendResponse({ success: true });
          break;

        case 'UPDATE_PROFILE':
          await StorageManager.updateProfile(message.data);
          // Notify all content scripts of the update
          await this.notifyAllTabs({ type: 'UPDATE_PROFILE', data: message.data });
          sendResponse({ success: true });
          break;

        default:
          // Forward other messages to active tab
          if (sender.tab?.id) {
            const response = await MessageHandler.sendToContentScript(sender.tab.id, message);
            sendResponse(response);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  setupCommandHandlers() {
    chrome.commands.onCommand.addListener(async (command) => {
      console.log('CleanRead: Command received:', command);
      const tab = await MessageHandler.getActiveTab();
      console.log('CleanRead: Active tab:', tab);
      if (!tab?.id) {
        console.log('CleanRead: No active tab found');
        return;
      }

      switch (command) {
        case 'toggle_mode':
          console.log('CleanRead: Toggling dyslexia mode for tab:', tab.id);
          await this.toggleDyslexiaMode(tab.id);
          break;
      }
    });
  }

  setupTabHandlers() {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        await this.handleTabUpdate(tabId, tab);
      }
    });
  }

  async handleTabUpdate(tabId, tab) {
    try {
      const domain = new URL(tab.url).hostname;
      const effectiveState = await StorageManager.getEffectiveState(domain);
      
      // Apply settings to the tab
      if (effectiveState.enabled) {
        await MessageHandler.sendToContentScript(tabId, {
          type: 'APPLY_STATE',
          data: effectiveState
        });
      }
    } catch (error) {
      // Ignore errors for invalid URLs (e.g., chrome://, extension://)
      if (!tab.url?.startsWith('chrome://') && !tab.url?.startsWith('moz-extension://')) {
        console.error('Error handling tab update:', error);
      }
    }
  }

  async toggleDyslexiaMode(tabId) {
    console.log('CleanRead: Getting current state...');
    const state = await StorageManager.getAppState();
    console.log('CleanRead: Current state:', state);
    
    const newState = { ...state, enabled: !state.enabled };
    console.log('CleanRead: New state:', newState);
    
    await StorageManager.saveAppState(newState);
    console.log('CleanRead: State saved');
    
    console.log('CleanRead: Sending message to content script...');
    await MessageHandler.sendToContentScript(tabId, {
      type: 'TOGGLE_MODE',
      data: { enabled: newState.enabled }
    });
    console.log('CleanRead: Message sent to content script');
    
    // Notify popup if it's open
    console.log('CleanRead: Notifying popup of state change...');
    await this.notifyPopup(newState);
  }

  async notifyPopup(newState) {
    try {
      // Send message to popup if it's open
      chrome.runtime.sendMessage({
        type: 'STATE_CHANGED',
        data: newState
      }).catch(error => {
        // Popup might not be open, which is fine
        console.log('CleanRead: Popup not open or error sending message:', error.message);
      });
    } catch (error) {
      console.error('Error notifying popup:', error);
    }
  }

  async notifyAllTabs(message) {
    try {
      const tabs = await chrome.tabs.query({});
      const promises = tabs.map(tab => 
        tab.id ? MessageHandler.sendToContentScript(tab.id, message) : Promise.resolve()
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error notifying tabs:', error);
    }
  }
}

// Initialize the background service
new BackgroundService();
