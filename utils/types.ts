export interface SelectionInfo {
  text: string;
  rect: DOMRect;
  mousePosition?: { x: number; y: number };
  eventTarget?: EventTarget | null;
  triggerEvent?: Event;
}

export interface TextSelectionOptions {
  enableDeduplication?: boolean;
  delay?: number;
  minTextLength?: number;
}

export type TextSelectionHandler = (selectionInfo?: SelectionInfo) => void;
