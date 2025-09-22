export class MessageHandler {
  static async sendToContentScript(tabId, message) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error('Failed to send message to content script:', error);
      return null;
    }
  }

  static async sendToBackground(message) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message to background:', error);
      return null;
    }
  }

  static async getActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab || null;
    } catch (error) {
      console.error('Failed to get active tab:', error);
      return null;
    }
  }

  static async getCurrentDomain() {
    const tab = await this.getActiveTab();
    if (!tab?.url) return null;
    
    try {
      const url = new URL(tab.url);
      return url.hostname;
    } catch {
      return null;
    }
  }
}
