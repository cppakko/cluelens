import type { TextSelectionOptions, TextSelectionHandler } from './types';

class TextSelectionListener {
  private lastSelectedText = '';
  private options: Required<TextSelectionOptions>;
  private handler: TextSelectionHandler;
  private isListening = false;

  constructor(handler: TextSelectionHandler, options: TextSelectionOptions = {}) {
    this.handler = handler;
    this.options = {
      enableDeduplication: true,
      delay: 0,
      minTextLength: 1,
      ...options,
    };
  }

  public startListening(): void {
    if (this.isListening) {
      return;
    }

    document.addEventListener('mouseup', this.handleMouseUp);

    document.addEventListener('keyup', this.handleKeyUp);

    this.isListening = true;
  }

  public stopListening(): void {
    if (!this.isListening) {
      return;
    }

    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('keyup', this.handleKeyUp);

    this.isListening = false;
    this.lastSelectedText = '';
  }

  private handleTextSelection = (event?: MouseEvent): void => {
    const selectionInfo = getSelectionInfo(event);

    if (!selectionInfo) {
      this.lastSelectedText = '';
      this.handler(undefined);
      return;
    }

    const { text } = selectionInfo;

    if (!isValidSelection(text, this.options.minTextLength)) {
      return;
    }

    if (this.options.enableDeduplication && text === this.lastSelectedText) {
      return;
    }

    this.lastSelectedText = text;

    try {
      this.handler(selectionInfo);
    } catch (error) {
      console.error('Error in text selection handler:', error);
    }
  };

  private handleMouseUp = (event: MouseEvent): void => {
    const delay = this.options.delay > 0 ? this.options.delay : 0;
    setTimeout(() => this.handleTextSelection(event), delay);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      if (this.options.delay > 0) {
        setTimeout(() => this.handleTextSelection(), this.options.delay);
      } else {
        this.handleTextSelection();
      }
    }
  };

  public get listening(): boolean {
    return this.isListening;
  }

  public get currentOptions(): Required<TextSelectionOptions> {
    return { ...this.options };
  }
}

export function createTextSelectionListener(
  handler: TextSelectionHandler,
  options?: TextSelectionOptions
): TextSelectionListener {
  return new TextSelectionListener(handler, options);
}

export function getSelectionInfo(event?: MouseEvent): SelectionInfo | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const selectedText = selection.toString().trim();

  if (!selectedText) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  const selectionInfo: SelectionInfo = {
    text: selectedText,
    rect,
  };

  if (event) {
    selectionInfo.mousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
    selectionInfo.eventTarget = event.target;
    selectionInfo.triggerEvent = event;
  }

  return selectionInfo;
}

export function isValidSelection(text: string, minLength = 1): boolean {
  const trimmed = text.trim();
  if (trimmed.length < minLength) {
    return false;
  }
  try {
    return /\p{L}/u.test(trimmed);
  } catch (err) {
    console.warn('Unicode property escapes not supported, falling back to basic regex', err);
    return /[A-Za-z\u00C0-\u017F\u0400-\u04FF\u1100-\u11FF\u2E80-\u9FFF\uAC00-\uD7AF]/.test(trimmed);
  }
}