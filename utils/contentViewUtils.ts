import type { RefObject } from 'react';

/**
 * Clamp a position so the element stays within the viewport.
 */
export function clampToViewport(
  x: number, y: number,
  width: number, height: number,
  padding = 10,
): { x: number; y: number } {
  return {
    x: Math.max(padding, Math.min(x, window.innerWidth - width - padding)),
    y: Math.max(padding, Math.min(y, window.innerHeight - height - padding)),
  };
}

export function getPanelPosition(rect: DOMRect, mousePos: { x: number; y: number } | undefined): { x: number; y: number } {
  const PANEL_WIDTH = 450;
  const PANEL_HEIGHT = 560;
  const GAP = 20;
  const BUFFER = 10;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // DictPanel treats 'x' as 'left'.
  let x = mousePos ? mousePos.x : (rect.left + rect.width / 2);

  if (x + PANEL_WIDTH + BUFFER > viewportWidth) {
    x = viewportWidth - PANEL_WIDTH - BUFFER;
  }
  x = Math.max(BUFFER, x);

  const topPosition = rect.top - GAP - PANEL_HEIGHT;
  const bottomPosition = rect.bottom + GAP;

  // DictPanel clamps to viewport, so y > viewportHeight - PANEL_HEIGHT moves panel UP.
  const fitsBottom = (bottomPosition + PANEL_HEIGHT <= viewportHeight - BUFFER);
  const fitsTop = (topPosition >= BUFFER);

  let y;

  if (fitsBottom) {
    y = bottomPosition;
  } else if (fitsTop) {
    y = topPosition;
  } else {
    const spaceBelow = viewportHeight - (rect.bottom + GAP);
    const spaceAbove = rect.top - GAP;

    if (spaceAbove > spaceBelow) {
      y = Math.max(BUFFER, topPosition);
    } else {
      y = bottomPosition;
    }
  }

  return { x, y };
}

export function getIconPosition(rect: DOMRect, mousePos: { x: number; y: number } | undefined): { x: number; y: number } {
  const ICON_SIZE = 40;
  const GAP = 15;

  let x, y;

  if (mousePos) {
    x = mousePos.x + GAP;
    y = mousePos.y + GAP;
  } else {
    // If no mouse (e.g. keyboard), place at bottom right of selection
    x = rect.right;
    y = rect.bottom + 5;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (x + ICON_SIZE > viewportWidth) {
    x = viewportWidth - ICON_SIZE;
  }
  if (y + ICON_SIZE > viewportHeight) {
    y = viewportHeight - ICON_SIZE;
  }

  x = Math.max(0, x);
  y = Math.max(0, y);

  return { x, y };
}

export function isSelectionFromPanel({ pointerFromPanelRef, rootRef, eventTarget, triggerEvent, isNodeInsidePanel }: {
  pointerFromPanelRef: RefObject<boolean>,
  rootRef: RefObject<HTMLDivElement | null>,
  eventTarget: EventTarget | null,
  triggerEvent: Event | undefined,
  isNodeInsidePanel: (node?: Node | null) => boolean
}): boolean {
  if (pointerFromPanelRef.current) return true;

  if (rootRef.current) {
    const rootNode = rootRef.current.getRootNode();
    if (rootNode instanceof ShadowRoot) {
      if (eventTarget === rootNode.host) return true;
      if (triggerEvent && typeof triggerEvent['composedPath'] === 'function' && triggerEvent.composedPath().includes(rootNode.host)) {
        return true;
      }
    }
  }

  const activeSelection = window.getSelection();
  return !!(activeSelection && isNodeInsidePanel(activeSelection.anchorNode));
}

export function isEventInsidePanel(event: MouseEvent, rootRef: RefObject<HTMLDivElement | null>): boolean {
  const root = rootRef.current;
  if (!root) return false;

  const rootNode = root.getRootNode();
  if (rootNode instanceof ShadowRoot) {
    if (event.composedPath().includes(rootNode.host)) {
      return true;
    }
  } else if (root.contains(event.target as Node)) {
    return true;
  }
  return false;
}
