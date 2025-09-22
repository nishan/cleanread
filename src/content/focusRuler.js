import { DOMUtils } from '../shared/dom.js';

export class FocusRuler {
  constructor() {
    this.ruler = null;
    this.settings = null;
    this.enabled = false;
    this.currentY = 0;
    this.lineHeight = 24;
    this.setupEventListeners();
  }

  enable(settings) {
    this.settings = settings;
    this.enabled = true;
    this.createRuler();
    this.updateRulerStyle();
  }

  disable() {
    this.enabled = false;
    this.removeRuler();
  }

  createRuler() {
    if (this.ruler) return;

    this.ruler = DOMUtils.createElement('div', {
      id: 'dr-focus',
      class: 'dr-focus'
    });

    document.body.appendChild(this.ruler);
  }

  removeRuler() {
    if (this.ruler) {
      this.ruler.remove();
      this.ruler = null;
    }
  }

  updateRulerStyle() {
    if (!this.ruler || !this.settings) return;

    this.ruler.style.height = `${this.settings.lineHeightPx}px`;
    this.ruler.style.opacity = this.settings.opacity.toString();
    this.ruler.style.backgroundColor = this.settings.color;
  }

  setupEventListeners() {
    // Mouse tracking
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // Keyboard navigation
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Scroll handling
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  handleMouseMove(event) {
    if (!this.enabled || !this.ruler || !this.settings) return;
    
    if (this.settings.followMode === 'cursor') {
      this.updateRulerPosition(event.clientX, event.clientY);
    }
  }

  handleKeyDown(event) {
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

  handleScroll() {
    if (!this.enabled || !this.ruler) return;
    
    // Adjust ruler position based on scroll
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.ruler.style.top = `${this.currentY + scrollTop}px`;
  }

  updateRulerPosition(x, y) {
    if (!this.ruler) return;

    const rect = DOMUtils.getLineRectAtPoint(x, y);
    if (rect) {
      this.positionRuler(rect);
    }
  }

  positionRuler(rect) {
    if (!this.ruler) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.currentY = rect.top - scrollTop;
    
    this.ruler.style.top = `${rect.top}px`;
    this.ruler.style.left = '0px';
    this.ruler.style.width = '100%';
    this.ruler.style.height = `${rect.height}px`;
  }

  moveRulerUp() {
    this.currentY = Math.max(0, this.currentY - this.lineHeight);
    this.updateRulerFromCurrentY();
  }

  moveRulerDown() {
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    this.currentY = Math.min(maxY, this.currentY + this.lineHeight);
    this.updateRulerFromCurrentY();
  }

  updateRulerFromCurrentY() {
    if (!this.ruler) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.ruler.style.top = `${this.currentY + scrollTop}px`;
    this.ruler.style.left = '0px';
    this.ruler.style.width = '100%';
    this.ruler.style.height = `${this.lineHeight}px`;
  }

  // Public methods for external control
  setFollowMode(mode) {
    if (this.settings) {
      this.settings.followMode = mode;
    }
  }

  setLineHeight(height) {
    this.lineHeight = height;
    if (this.settings) {
      this.settings.lineHeightPx = height;
    }
    this.updateRulerStyle();
  }

  setOpacity(opacity) {
    if (this.settings) {
      this.settings.opacity = opacity;
    }
    this.updateRulerStyle();
  }

  setColor(color) {
    if (this.settings) {
      this.settings.color = color;
    }
    this.updateRulerStyle();
  }
}
