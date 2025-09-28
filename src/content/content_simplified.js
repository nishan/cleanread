import { StorageManager } from '../shared/storage.js';
import { MessageHandler } from '../shared/messaging.js';
import { DOMUtils } from '../shared/dom.js';

class ContentScript {
  constructor() {
    this.state = null;
    this.styleElement = null;
    this.isInitialized = false;
    
    this.initialize();
    this.setupMessageHandlers();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      const domain = window.location.hostname;
      this.state = await StorageManager.getEffectiveState(domain);
      console.log('CLEANREAD State:', this.state);
      if (this.state.enabled) {
        await this.applyState(this.state);
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize content script:', error);
    }
  }

  async applyState(state) {
    this.state = state;
    const profile = this.getActiveProfile(state);
    
    // Print profile to console for debugging
    this.printProfile(profile);
    
    // Apply dyslexia mode
    document.documentElement.setAttribute('data-dyslexia', 'on');
    
    // Inject CSS styles
    await this.injectStyles(profile);
  }

  async removeState() {
    // Remove dyslexia mode
    document.documentElement.removeAttribute('data-dyslexia');
    
    // Remove injected styles
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
    
    this.state = null;
  }

  getActiveProfile(state) {
    return state.profiles[state.activeProfileId] || state.profiles.default;
  }

  printProfile(profile) {
    console.log('=== CleanRead Profile ===');
    console.log('Profile ID:', profile.id);
    console.log('Profile Name:', profile.name);
    console.log('Typography:', profile.typography);
    console.log('Theme:', profile.theme);
    console.log('========================');
  }

  async injectStyles(profile) {
    // First, ensure fonts are loaded
    await this.loadFonts();
    
    const css = this.generateCSS(profile);
    this.styleElement = DOMUtils.ensureStyleElement('dyslexia-styles', css);
  }

  async loadFonts() {
    // Check if fonts are already loaded
    if (document.getElementById('dyslexia-fonts')) {
      console.log('Fonts already loaded');
      return;
    }
    
    try {
      const fontsUrl = chrome.runtime.getURL('content/fonts/fonts.css');
      console.log('Loading fonts from:', fontsUrl);
      
      // Add a small delay to ensure the extension is fully loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch(fontsUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch fonts: ${response.status} ${response.statusText}`);
      }
      
      const fontsCSS = await response.text();
      console.log('Fonts CSS loaded, length:', fontsCSS.length);
      
      if (!fontsCSS || fontsCSS.length === 0) {
        throw new Error('Fonts CSS is empty');
      }
      
      // Replace the extension ID placeholder with actual extension ID
      const extensionId = chrome.runtime.id;
      console.log('Extension ID:', extensionId);
      const processedCSS = fontsCSS.replace(/__MSG_@@extension_id__/g, extensionId);
      
      const style = DOMUtils.createStyleElement('dyslexia-fonts', processedCSS);
      document.head.appendChild(style);
      console.log('Fonts injected into page');
      
    } catch (error) {
      console.error('Failed to load fonts:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        fontsUrl: chrome.runtime.getURL('content/fonts/fonts.css')
      });
      
      // Fallback: try to load fonts with a different approach
      this.loadFontsFallback();
    }
  }

  loadFontsFallback() {
    console.log('Attempting fallback font loading...');
    try {
      // Create a simple font loading approach
      const extensionId = chrome.runtime.id;
      const fontCSS = `
        @font-face {
          font-family: "OpenDyslexic";
          src: url("chrome-extension://${extensionId}/content/fonts/opendyslexic/OpenDyslexic-Regular.woff2") format("woff2");
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: "Lexend";
          src: url("chrome-extension://${extensionId}/content/fonts/lexend/Lexend-Regular.woff2") format("woff2");
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
      
      const style = DOMUtils.createStyleElement('dyslexia-fonts-fallback', fontCSS);
      document.head.appendChild(style);
      console.log('Fallback fonts loaded');
    } catch (error) {
      console.error('Fallback font loading also failed:', error);
    }
  }

  generateCSS(profile) {
    const { typography, theme } = profile;
    
    // Font family mapping
    const fontFamilies = {
      default: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
      opendyslexic: '"OpenDyslexic", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
      lexend: '"Lexend", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
      sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'
    };

    console.log('Generating CSS for font:', typography.font);
    console.log('Font family will be:', fontFamilies[typography.font]);

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
    `;
  }

  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  async handleMessage(message, sendResponse) {
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

// Export main function for content_loader.js
export function main() {
  new ContentScript();
}
