import { StorageManager } from '../shared/storage.js';
import { MessageHandler, AllMessages } from '../shared/messaging.js';
import { AppState } from '../shared/settings.js';

class BackgroundService {
  private initialized = false;

  constructor() {
    this.initialize();
    this.setupMessageHandlers();
    this.setupCommandHandlers();
    this.setupTabHandlers();
  }

  private async initialize(): Promise<void> {
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

  private setupMessageHandlers(): void {
    chrome.runtime.onMessage.addListener((message: AllMessages, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  private async handleMessage(
    message: AllMessages, 
    sender: chrome.runtime.MessageSender, 
    sendResponse: (response?: any) => void
  ): Promise<void> {
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

  private setupCommandHandlers(): void {
    chrome.commands.onCommand.addListener(async (command) => {
      const tab = await MessageHandler.getActiveTab();
      if (!tab?.id) return;

      switch (command) {
        case 'toggle_mode':
          await this.toggleDyslexiaMode(tab.id);
          break;
        case 'toggle_focus':
          await this.toggleLineFocus(tab.id);
          break;
        case 'speak_selection':
          await this.speakSelection(tab.id);
          break;
      }
    });
  }

  private setupTabHandlers(): void {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        await this.handleTabUpdate(tabId, tab);
      }
    });
  }

  private async handleTabUpdate(tabId: number, tab: chrome.tabs.Tab): Promise<void> {
    try {
      const domain = new URL(tab.url!).hostname;
      const effectiveState = await StorageManager.getEffectiveState(domain);
      
      // Apply settings to the tab
      await MessageHandler.sendToContentScript(tabId, {
        type: 'APPLY_STATE',
        data: effectiveState
      });
    } catch (error) {
      // Ignore errors for invalid URLs (e.g., chrome://, extension://)
      if (!tab.url?.startsWith('chrome://') && !tab.url?.startsWith('moz-extension://')) {
        console.error('Error handling tab update:', error);
      }
    }
  }

  private async toggleDyslexiaMode(tabId: number): Promise<void> {
    const state = await StorageManager.getAppState();
    const newState = { ...state, enabled: !state.enabled };
    await StorageManager.saveAppState(newState);
    
    await MessageHandler.sendToContentScript(tabId, {
      type: 'TOGGLE_MODE',
      data: { enabled: newState.enabled }
    });
  }

  private async toggleLineFocus(tabId: number): Promise<void> {
    await MessageHandler.sendToContentScript(tabId, {
      type: 'TOGGLE_FOCUS',
      data: { enabled: true } // This will toggle in the content script
    });
  }

  private async speakSelection(tabId: number): Promise<void> {
    await MessageHandler.sendToContentScript(tabId, {
      type: 'READ_SELECTION'
    });
  }

  private async notifyAllTabs(message: AllMessages): Promise<void> {
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
