import { TTSSettings } from '../shared/settings.js';
import { DOMUtils } from '../shared/dom.js';

export class TTSSystem {
  private settings: TTSSettings | null = null;
  private enabled = false;
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private highlightElements: HTMLElement[] = [];

  constructor() {
    this.setupEventListeners();
  }

  enable(settings: TTSSettings): void {
    this.settings = settings;
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
    this.stop();
  }

  private setupEventListeners(): void {
    // Listen for text selection
    document.addEventListener('mouseup', this.handleTextSelection.bind(this));
    
    // Listen for keyboard selection
    document.addEventListener('keyup', this.handleTextSelection.bind(this));
  }

  private handleTextSelection(): void {
    if (!this.enabled || !this.settings) return;
    
    const selectedText = DOMUtils.getSelectionText();
    if (selectedText && selectedText.length > 0) {
      // Auto-read on selection if enabled
      this.readText(selectedText);
    }
  }

  async readCurrentSelection(): Promise<void> {
    if (!this.enabled || !this.settings) return;
    
    const selectedText = DOMUtils.getSelectionText();
    if (selectedText) {
      await this.readText(selectedText);
    }
  }

  async readText(text: string): Promise<void> {
    if (!this.enabled || !this.settings || this.isSpeaking) return;
    
    // Limit text length to prevent performance issues
    const maxLength = 5000;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '...';
    }

    this.stop(); // Stop any current speech
    
    try {
      if (chrome.tts) {
        await this.speakWithChromeTTS(text);
      } else {
        await this.speakWithWebSpeech(text);
      }
    } catch (error) {
      console.error('TTS Error:', error);
    }
  }

  private async speakWithChromeTTS(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.settings) return;

      chrome.tts.stop();
      
      const options: any = {
        rate: this.settings.rate,
        pitch: this.settings.pitch,
        onEvent: (event: any) => {
          if (event.type === 'end' || event.type === 'interrupted') {
            this.isSpeaking = false;
            this.clearHighlights();
            resolve();
          } else if (event.type === 'error') {
            this.isSpeaking = false;
            this.clearHighlights();
            reject(new Error(event.errorMessage));
          } else if (event.type === 'start' && this.settings?.highlight) {
            this.highlightText(text);
          }
        }
      };

      if (this.settings.voice) {
        options.voiceName = this.settings.voice;
      }

      this.isSpeaking = true;
      chrome.tts.speak(text, options);
    });
  }

  private async speakWithWebSpeech(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.settings || !('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;
      
      if (this.settings.voice) {
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v => v.name === this.settings!.voice);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (this.settings?.highlight) {
          this.highlightText(text);
        }
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.clearHighlights();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.clearHighlights();
        reject(new Error(event.error));
      };

      this.currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if (chrome.tts) {
      chrome.tts.stop();
    } else if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    this.isSpeaking = false;
    this.clearHighlights();
  }

  private highlightText(text: string): void {
    if (!this.settings?.highlight) return;
    
    this.clearHighlights();
    
    // Find all text nodes containing the text
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    while (node = walker.nextNode()) {
      const textNode = node as Text;
      const nodeText = textNode.textContent || '';
      
      if (nodeText.includes(text)) {
        const parent = textNode.parentElement;
        if (parent && !parent.classList.contains('dr-tts-highlight')) {
          parent.classList.add('dr-tts-highlight');
          this.highlightElements.push(parent);
        }
      }
    }
  }

  private clearHighlights(): void {
    this.highlightElements.forEach(el => {
      el.classList.remove('dr-tts-highlight');
    });
    this.highlightElements = [];
  }

  // Public methods for external control
  setVoice(voice: string): void {
    if (this.settings) {
      this.settings.voice = voice;
    }
  }

  setRate(rate: number): void {
    if (this.settings) {
      this.settings.rate = rate;
    }
  }

  setPitch(pitch: number): void {
    if (this.settings) {
      this.settings.pitch = pitch;
    }
  }

  setHighlight(highlight: boolean): void {
    if (this.settings) {
      this.settings.highlight = highlight;
    }
  }

  isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    if ('speechSynthesis' in window) {
      return speechSynthesis.getVoices();
    }
    return [];
  }
}
