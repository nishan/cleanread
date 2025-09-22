export class DOMUtils {
  static createElement(tagName, attributes = {}, textContent) {
    const element = document.createElement(tagName);
    
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    if (textContent) {
      element.textContent = textContent;
    }
    
    return element;
  }

  static createStyleElement(id, css) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    return style;
  }

  static ensureStyleElement(id, css) {
    let style = document.getElementById(id);
    if (!style) {
      style = this.createStyleElement(id, css);
      document.head.appendChild(style);
    } else {
      style.textContent = css;
    }
    return style;
  }

  static removeElement(id) {
    const element = document.getElementById(id);
    if (element) {
      element.remove();
    }
  }

  static getTextNodeAtPoint(x, y) {
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(x, y);
      return range?.startContainer?.nodeType === Node.TEXT_NODE 
        ? range.startContainer 
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
        range.selectNode(node);
        const rect = range.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom && x >= rect.left && x <= rect.right) {
          return node;
        }
      }
    }
    
    return null;
  }

  static getLineRectAtPoint(x, y) {
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

  static getSelectionText() {
    const selection = window.getSelection();
    return selection ? selection.toString().trim() : '';
  }

  static clearSelection() {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }

  static addClassToElements(selector, className) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.add(className));
  }

  static removeClassFromElements(selector, className) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.remove(className));
  }

  static isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  static scrollIntoViewIfNeeded(element) {
    if (!this.isElementVisible(element)) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  static debounce(func, wait) {
    let timeout = null;
    
    return (...args) => {
      if (timeout) clearTimeout(timeout);
      timeout = window.setTimeout(() => func(...args), wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle = false;
    
    return (...args) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}
