import { DictID } from '@/components/dicts/types';
import type { SidePanelPortMessage } from '@/utils/messaging';

type SidePanelPort = ReturnType<typeof browser.runtime.connect>;

let sidePanelPort: SidePanelPort | null = null;

export function attachSidePanelPort(port: SidePanelPort): void {
  sidePanelPort = port;

  port.onDisconnect.addListener(() => {
    if (sidePanelPort === port) {
      sidePanelPort = null;
    }
  });
}

export function isSidePanelAlive(): boolean {
  return sidePanelPort !== null;
}

export function sendToSidePanel(message: SidePanelPortMessage): boolean {
  if (!sidePanelPort) {
    return false;
  }

  sidePanelPort.postMessage(message);
  return true;
}

export function routeToSidePanel(query?: string, requestId = Date.now(), dictIds?: DictID[]): boolean {
  if (!isSidePanelAlive()) {
    return false;
  }

  const trimmedQuery = query?.trim() ?? '';
  if (trimmedQuery) {
    return sendToSidePanel({ type: 'search', query: trimmedQuery, requestId, dictIds });
  }

  return sendToSidePanel({ type: 'focusInput' });
}