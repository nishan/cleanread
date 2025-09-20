import { StorageManager } from '../shared/storage.js';
import { MessageHandler, AllMessages } from '../shared/messaging.js';
import { AppState, Profile } from '../shared/settings.js';
import { DOMUtils } from '../shared/dom.js';
import { FocusRuler } from './focusRuler.js';
import { TTSSystem } from './tts.js';
import { ReadabilityView } from './readability.js';

class ContentScript {
  private state: AppState | null = null;
  private focusRuler: FocusRuler;
  private ttsSystem: TTSSystem;
  private readabilityView: ReadabilityView;
  private styleElement: HTMLStyleElement | null = null;
  private isInitialized = false;

  constructor() {
    this.focusRuler = new FocusRuler();
    this.ttsSystem = new TTSSystem();
    this.readabilityView = new ReadabilityView();
    
    this.initialize();
    this.setupMessageHandlers();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const domain = window.location.hostname;
      this.state = await StorageManager.getEffectiveState(domain);
      
      if (this.state.enabled) {
        await this.applyState(this.state);
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize content script:', error);
    }
  }

  private async applyState(state: AppState): Promise<void> {
    this.state = state;
    const profile = this.getActiveProfile(state);
    
    // Apply dyslexia mode
    document.documentElement.setAttribute('data-dyslexia', 'on');
    
    // Inject CSS styles
    await this.injectStyles(profile);
    
    // Initialize features
    if (profile.focus.enabled) {
      this.focusRuler.enable(profile.focus);
    }
    
    if (profile.tts.enabled) {
      this.ttsSystem.enable(profile.tts);
    }
    
    if (profile.readability.enabled) {
      this.readabilityView.enable();
    }
  }

  private async removeState(): Promise<void> {
    // Remove dyslexia mode
    document.documentElement.removeAttribute('data-dyslexia');
    
    // Remove injected styles
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
    
    // Disable features
    this.focusRuler.disable();
    this.ttsSystem.disable();
    this.readabilityView.disable();
    
    this.state = null;
  }

  private getActiveProfile(state: AppState): Profile {
    return state.profiles[state.activeProfileId] || state.profiles.default;
  }

  private async injectStyles(profile: Profile): Promise<void> {
    const css = this.generateCSS(profile);
    this.styleElement = DOMUtils.ensureStyleElement('dyslexia-styles', css);
  }

  private generateCSS(profile: Profile): string {
    const { typography, theme } = profile;
    
    // Font family mapping
    const fontFamilies = {
      default: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
      opendyslexic: '"OpenDyslexic", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
      lexend: '"Lexend", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
      sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'
    };

    // Theme color mapping
    const themeColors = {
      cream: {
        text: '#1a1a1a',
        bg: '#fff8e6',
        overlay: 'rgba(255, 240, 200, 0.2)'
      },
      dark: {
        text: '#ffffff',
        bg: '#1a1a1a',
        overlay: 'rgba(0, 0, 0, 0.3)'
      },
      high_contrast: {
        text: '#000000',
        bg: '#ffffff',
        overlay: 'transparent'
      },
      custom: {
        text: theme.textColor || '#1a1a1a',
        bg: theme.backgroundColor || '#ffffff',
        overlay: theme.overlayTint || 'transparent'
      }
    };

    const colors = themeColors[theme.theme] || themeColors.cream;
    const textColor = theme.textColor || colors.text;
    const bgColor = theme.backgroundColor || colors.bg;
    const overlayColor = theme.overlayTint || colors.overlay;

    return `
      :root[data-dyslexia="on"] {
        --dr-font: ${fontFamilies[typography.font]};
        --dr-font-size: ${typography.fontSize}px;
        --dr-line-height: ${typography.lineHeight};
        --dr-letter-spacing: ${typography.letterSpacing}em;
        --dr-word-spacing: ${typography.wordSpacing}px;
        --dr-text-color: ${textColor};
        --dr-bg-color: ${bgColor};
        --dr-overlay: ${overlayColor};
        --dr-max-width: ${typography.maxColumnWidth}px;
        --dr-paragraph-spacing: ${typography.paragraphSpacing}px;
      }

      :root[data-dyslexia="on"] body,
      :root[data-dyslexia="on"] article,
      :root[data-dyslexia="on"] main,
      :root[data-dyslexia="on"] p,
      :root[data-dyslexia="on"] li,
      :root[data-dyslexia="on"] div:not(.dr-focus):not(.dr-readable) {
        font-family: var(--dr-font) !important;
        font-size: var(--dr-font-size) !important;
        line-height: var(--dr-line-height) !important;
        letter-spacing: var(--dr-letter-spacing) !important;
        word-spacing: var(--dr-word-spacing) !important;
        color: var(--dr-text-color) !important;
        ${typography.leftAlign ? 'text-align: left !important;' : ''}
        ${typography.disableJustify ? 'text-align: left !important;' : ''}
      }

      :root[data-dyslexia="on"] p {
        margin-bottom: var(--dr-paragraph-spacing) !important;
      }

      :root[data-dyslexia="on"] article,
      :root[data-dyslexia="on"] main,
      :root[data-dyslexia="on"] .dr-readable {
        max-width: var(--dr-max-width) !important;
        margin-inline: auto !important;
      }

      :root[data-dyslexia="on"] body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background: var(--dr-overlay);
        z-index: 2147483646;
      }

      :root[data-dyslexia="on"] a {
        ${theme.linkEmphasis ? 'font-weight: bold !important; text-decoration: underline !important;' : ''}
      }

      /* Focus ruler styles */
      .dr-focus {
        position: fixed;
        background: rgba(0, 123, 255, 0.3);
        pointer-events: none;
        z-index: 2147483647;
        transition: all 0.1s ease;
      }

      /* TTS highlight styles */
      .dr-tts-highlight {
        background: rgba(255, 255, 0, 0.5) !important;
        transition: background 0.2s ease;
      }

      /* Reader view styles */
      .dr-readable {
        background: var(--dr-bg-color) !important;
        color: var(--dr-text-color) !important;
        padding: 20px !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
        margin: 20px auto !important;
        max-width: var(--dr-max-width) !important;
      }

      .dr-reader-controls {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483648;
        background: white;
        padding: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .dr-reader-controls button {
        margin-left: 5px;
        padding: 5px 10px;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
        border-radius: 3px;
      }

      .dr-reader-controls button:hover {
        background: #f0f0f0;
      }
    `;
  }

  private setupMessageHandlers(): void {
    chrome.runtime.onMessage.addListener((message: AllMessages, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  private async handleMessage(message: AllMessages, sendResponse: (response?: any) => void): Promise<void> {
    try {
      switch (message.type) {
        case 'APPLY_STATE':
          await this.applyState(message.data);
          sendResponse({ success: true });
          break;

        case 'TOGGLE_MODE':
          if (message.data.enabled) {
            if (!this.state) {
              const domain = window.location.hostname;
              this.state = await StorageManager.getEffectiveState(domain);
            }
            await this.applyState(this.state);
          } else {
            await this.removeState();
          }
          sendResponse({ success: true });
          break;

        case 'UPDATE_PROFILE':
          if (this.state) {
            this.state.profiles[message.data.id] = message.data;
            await this.injectStyles(message.data);
          }
          sendResponse({ success: true });
          break;

        case 'TOGGLE_FOCUS':
          if (this.state) {
            const profile = this.getActiveProfile(this.state);
            if (message.data.enabled) {
              this.focusRuler.enable(profile.focus);
            } else {
              this.focusRuler.disable();
            }
          }
          sendResponse({ success: true });
          break;

        case 'READ_SELECTION':
          await this.ttsSystem.readCurrentSelection();
          sendResponse({ success: true });
          break;

        case 'STOP_TTS':
          this.ttsSystem.stop();
          sendResponse({ success: true });
          break;

        case 'TOGGLE_READER_VIEW':
          if (message.data.enabled) {
            this.readabilityView.enable();
          } else {
            this.readabilityView.disable();
          }
          sendResponse({ success: true });
          break;

        case 'GET_CURRENT_STATE':
          sendResponse(this.state);
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

// Initialize the content script
new ContentScript();
