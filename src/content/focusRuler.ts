import { FocusSettings } from '../shared/settings.js';
import { DOMUtils } from '../shared/dom.js';

export class FocusRuler {
  private ruler: HTMLElement | null = null;
  private settings: FocusSettings | null = null;
  private enabled = false;
  private currentY = 0;
  private lineHeight = 24;

  constructor() {
    this.setupEventListeners();
  }

  enable(settings: FocusSettings): void {
    this.settings = settings;
    this.enabled = true;
    this.createRuler();
    this.updateRulerStyle();
  }

  disable(): void {
    this.enabled = false;
    this.removeRuler();
  }

  private createRuler(): void {
    if (this.ruler) return;

    this.ruler = DOMUtils.createElement('div', {
      id: 'dr-focus',
      class: 'dr-focus'
    });

    document.body.appendChild(this.ruler);
  }

  private removeRuler(): void {
    if (this.ruler) {
      this.ruler.remove();
      this.ruler = null;
    }
  }

  private updateRulerStyle(): void {
    if (!this.ruler || !this.settings) return;

    this.ruler.style.height = `${this.settings.lineHeightPx}px`;
    this.ruler.style.opacity = this.settings.opacity.toString();
    this.ruler.style.backgroundColor = this.settings.color;
  }

  private setupEventListeners(): void {
    // Mouse tracking
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // Keyboard navigation
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Scroll handling
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.enabled || !this.ruler || !this.settings) return;
    
    if (this.settings.followMode === 'cursor') {
      this.updateRulerPosition(event.clientX, event.clientY);
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled || !this.ruler || !this.settings) return;
    
    if (this.settings.followMode === 'keyboard') {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          this.moveRulerUp();
          break;
        case 'ArrowDown':
          event.preventDefault();
          this.moveRulerDown();
          break;
      }
    }
  }

  private handleScroll(): void {
    if (!this.enabled || !this.ruler) return;
    
    // Adjust ruler position based on scroll
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.ruler.style.top = `${this.currentY + scrollTop}px`;
  }

  private updateRulerPosition(x: number, y: number): void {
    if (!this.ruler) return;

    const rect = DOMUtils.getLineRectAtPoint(x, y);
    if (rect) {
      this.positionRuler(rect);
    }
  }

  private positionRuler(rect: DOMRect): void {
    if (!this.ruler) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.currentY = rect.top - scrollTop;
    
    this.ruler.style.top = `${rect.top}px`;
    this.ruler.style.left = '0px';
    this.ruler.style.width = '100%';
    this.ruler.style.height = `${rect.height}px`;
  }

  private moveRulerUp(): void {
    this.currentY = Math.max(0, this.currentY - this.lineHeight);
    this.updateRulerFromCurrentY();
  }

  private moveRulerDown(): void {
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    this.currentY = Math.min(maxY, this.currentY + this.lineHeight);
    this.updateRulerFromCurrentY();
  }

  private updateRulerFromCurrentY(): void {
    if (!this.ruler) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.ruler.style.top = `${this.currentY + scrollTop}px`;
    this.ruler.style.left = '0px';
    this.ruler.style.width = '100%';
    this.ruler.style.height = `${this.lineHeight}px`;
  }

  // Public methods for external control
  setFollowMode(mode: 'cursor' | 'keyboard'): void {
    if (this.settings) {
      this.settings.followMode = mode;
    }
  }

  setLineHeight(height: number): void {
    this.lineHeight = height;
    if (this.settings) {
      this.settings.lineHeightPx = height;
    }
    this.updateRulerStyle();
  }

  setOpacity(opacity: number): void {
    if (this.settings) {
      this.settings.opacity = opacity;
    }
    this.updateRulerStyle();
  }

  setColor(color: string): void {
    if (this.settings) {
      this.settings.color = color;
    }
    this.updateRulerStyle();
  }
}
