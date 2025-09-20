import { DOMUtils } from '../shared/dom.js';

export class ReadabilityView {
  private enabled = false;
  private readerContainer: HTMLElement | null = null;
  private originalContent: HTMLElement[] = [];
  private backButton: HTMLElement | null = null;

  constructor() {
    this.loadReadabilityScript();
  }

  enable(): void {
    if (this.enabled) return;
    
    this.enabled = true;
    this.createReaderView();
  }

  disable(): void {
    if (!this.enabled) return;
    
    this.enabled = false;
    this.removeReaderView();
  }

  private async loadReadabilityScript(): Promise<void> {
    // In a real implementation, you would load the bundled Readability.js
    // For now, we'll create a simple text extraction
    return Promise.resolve();
  }

  private createReaderView(): void {
    if (this.readerContainer) return;

    // Store original content
    this.storeOriginalContent();
    
    // Create reader container
    this.readerContainer = DOMUtils.createElement('div', {
      class: 'dr-readable'
    });

    // Create controls
    this.createReaderControls();

    // Extract and display main content
    this.extractMainContent();

    // Hide original content
    this.hideOriginalContent();

    // Add reader container to page
    document.body.appendChild(this.readerContainer);
  }

  private storeOriginalContent(): void {
    // Store references to main content areas
    const mainSelectors = ['main', 'article', '[role="main"]', '.content', '.post', '.entry'];
    
    mainSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        this.originalContent.push(el as HTMLElement);
      });
    });

    // If no main content found, store body children
    if (this.originalContent.length === 0) {
      Array.from(document.body.children).forEach(child => {
        this.originalContent.push(child as HTMLElement);
      });
    }
  }

  private createReaderControls(): void {
    const controls = DOMUtils.createElement('div', {
      class: 'dr-reader-controls'
    });

    this.backButton = DOMUtils.createElement('button', {
      type: 'button'
    }, '← Back to Page');
    
    this.backButton.addEventListener('click', () => {
      this.disable();
    });

    const closeButton = DOMUtils.createElement('button', {
      type: 'button'
    }, '✕ Close');
    
    closeButton.addEventListener('click', () => {
      this.disable();
    });

    controls.appendChild(this.backButton);
    controls.appendChild(closeButton);
    document.body.appendChild(controls);
  }

  private extractMainContent(): void {
    if (!this.readerContainer) return;

    // Try to find the main article content
    let mainContent = this.findMainContent();
    
    if (!mainContent) {
      // Fallback: use the entire body
      mainContent = document.body.cloneNode(true) as HTMLElement;
    }

    // Clean up the content
    this.cleanContent(mainContent);
    
    // Add to reader container
    this.readerContainer.appendChild(mainContent);
  }

  private findMainContent(): HTMLElement | null {
    // Priority order for finding main content
    const selectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.post',
      '.entry',
      '.article',
      '#content',
      '#main'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && this.isSubstantialContent(element)) {
        return element.cloneNode(true) as HTMLElement;
      }
    }

    return null;
  }

  private isSubstantialContent(element: Element): boolean {
    const text = element.textContent || '';
    const wordCount = text.split(/\s+/).length;
    return wordCount > 50; // At least 50 words
  }

  private cleanContent(element: HTMLElement): void {
    // Remove unwanted elements
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      '.advertisement',
      '.ad',
      '.sidebar',
      '.comments',
      '.social-share',
      '.related-posts',
      '[role="banner"]',
      '[role="navigation"]',
      '[role="complementary"]'
    ];

    unwantedSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Clean up classes and attributes
    this.cleanAttributes(element);
  }

  private cleanAttributes(element: HTMLElement): void {
    // Remove most attributes except essential ones
    const allowedAttributes = ['href', 'src', 'alt', 'title'];
    
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      const attributes = Array.from(el.attributes);
      attributes.forEach(attr => {
        if (!allowedAttributes.includes(attr.name)) {
          el.removeAttribute(attr.name);
        }
      });
    });

    // Clean up the element itself
    const attributes = Array.from(element.attributes);
    attributes.forEach(attr => {
      if (!allowedAttributes.includes(attr.name)) {
        element.removeAttribute(attr.name);
      }
    });
  }

  private hideOriginalContent(): void {
    this.originalContent.forEach(element => {
      element.style.display = 'none';
    });
  }

  private showOriginalContent(): void {
    this.originalContent.forEach(element => {
      element.style.display = '';
    });
  }

  private removeReaderView(): void {
    // Show original content
    this.showOriginalContent();
    
    // Remove reader container
    if (this.readerContainer) {
      this.readerContainer.remove();
      this.readerContainer = null;
    }

    // Remove controls
    const controls = document.querySelector('.dr-reader-controls');
    if (controls) {
      controls.remove();
    }

    // Clear stored content
    this.originalContent = [];
  }

  // Public methods
  isEnabled(): boolean {
    return this.enabled;
  }

  toggle(): void {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }
}
