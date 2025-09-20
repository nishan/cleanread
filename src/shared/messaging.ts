import { AppState, Profile } from './settings.js';

export type MessageType = 
  | "APPLY_STATE"
  | "TOGGLE_MODE"
  | "UPDATE_PROFILE"
  | "TOGGLE_FOCUS"
  | "READ_SELECTION"
  | "STOP_TTS"
  | "TOGGLE_READER_VIEW"
  | "GET_CURRENT_STATE"
  | "SET_PER_SITE_OVERRIDE"
  | "REMOVE_PER_SITE_OVERRIDE";

export interface Message {
  type: MessageType;
  data?: any;
}

export interface ApplyStateMessage extends Message {
  type: "APPLY_STATE";
  data: AppState;
}

export interface ToggleModeMessage extends Message {
  type: "TOGGLE_MODE";
  data: { enabled: boolean };
}

export interface UpdateProfileMessage extends Message {
  type: "UPDATE_PROFILE";
  data: Profile;
}

export interface ToggleFocusMessage extends Message {
  type: "TOGGLE_FOCUS";
  data: { enabled: boolean };
}

export interface ReadSelectionMessage extends Message {
  type: "READ_SELECTION";
}

export interface StopTTSMessage extends Message {
  type: "STOP_TTS";
}

export interface ToggleReaderViewMessage extends Message {
  type: "TOGGLE_READER_VIEW";
  data: { enabled: boolean };
}

export interface GetCurrentStateMessage extends Message {
  type: "GET_CURRENT_STATE";
}

export interface SetPerSiteOverrideMessage extends Message {
  type: "SET_PER_SITE_OVERRIDE";
  data: { domain: string; settings: Partial<AppState> };
}

export interface RemovePerSiteOverrideMessage extends Message {
  type: "REMOVE_PER_SITE_OVERRIDE";
  data: { domain: string };
}

export type AllMessages = 
  | ApplyStateMessage
  | ToggleModeMessage
  | UpdateProfileMessage
  | ToggleFocusMessage
  | ReadSelectionMessage
  | StopTTSMessage
  | ToggleReaderViewMessage
  | GetCurrentStateMessage
  | SetPerSiteOverrideMessage
  | RemovePerSiteOverrideMessage;

export class MessageHandler {
  static async sendToContentScript(tabId: number, message: AllMessages): Promise<any> {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error('Failed to send message to content script:', error);
      return null;
    }
  }

  static async sendToBackground(message: AllMessages): Promise<any> {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message to background:', error);
      return null;
    }
  }

  static async getActiveTab(): Promise<chrome.tabs.Tab | null> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab || null;
    } catch (error) {
      console.error('Failed to get active tab:', error);
      return null;
    }
  }

  static async getCurrentDomain(): Promise<string | null> {
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
