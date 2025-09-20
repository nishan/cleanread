export class DOMUtils {
  static createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    attributes: Record<string, string> = {},
    textContent?: string
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);
    
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    if (textContent) {
      element.textContent = textContent;
    }
    
    return element;
  }

  static createStyleElement(id: string, css: string): HTMLStyleElement {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    return style;
  }

  static ensureStyleElement(id: string, css: string): HTMLStyleElement {
    let style = document.getElementById(id) as HTMLStyleElement;
    if (!style) {
      style = this.createStyleElement(id, css);
      document.head.appendChild(style);
    } else {
      style.textContent = css;
    }
    return style;
  }

  static removeElement(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.remove();
    }
  }

  static getTextNodeAtPoint(x: number, y: number): Text | null {
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(x, y);
      return range?.startContainer?.nodeType === Node.TEXT_NODE 
        ? range.startContainer as Text 
        : null;
    }
    
    // Fallback for browsers without caretRangeFromPoint
    const elements = document.elementsFromPoint(x, y);
    for (const element of elements) {
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node;
      while (node = walker.nextNode()) {
        const range = document.createRange();
        range.selectNode(node as Text);
        const rect = range.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom && x >= rect.left && x <= rect.right) {
          return node as Text;
        }
      }
    }
    
    return null;
  }

  static getLineRectAtPoint(x: number, y: number): DOMRect | null {
    const textNode = this.getTextNodeAtPoint(x, y);
    if (!textNode) return null;

    const range = document.createRange();
    range.selectNode(textNode);
    const rects = range.getClientRects();
    
    if (rects.length === 0) return null;
    
    // Find the rect that best matches the y coordinate
    let bestRect = rects[0];
    let minDistance = Math.abs(rects[0].top - y);
    
    for (let i = 1; i < rects.length; i++) {
      const distance = Math.abs(rects[i].top - y);
      if (distance < minDistance) {
        minDistance = distance;
        bestRect = rects[i];
      }
    }
    
    return bestRect;
  }

  static getSelectionText(): string {
    const selection = window.getSelection();
    return selection ? selection.toString().trim() : '';
  }

  static clearSelection(): void {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }

  static addClassToElements(selector: string, className: string): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.add(className));
  }

  static removeClassFromElements(selector: string, className: string): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.remove(className));
  }

  static isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  static scrollIntoViewIfNeeded(element: HTMLElement): void {
    if (!this.isElementVisible(element)) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: number | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = window.setTimeout(() => func(...args), wait);
    };
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}
