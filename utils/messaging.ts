import { DictID } from '@/components/dicts/types';
import { defineExtensionMessaging } from '@webext-core/messaging';

export interface BackgroundMessagingProtocolMap {
  openPopupQuery(payload: { query: string; dictIds?: DictID[] }): void;
  searchQuery(payload: { query: string; dictIds?: DictID[] }): void;
  searchDictList(dictIds: DictID[]): void;
  searchResult(payload: { dictId: DictID; data: unknown[]; errorMessage?: string }): void;
  popupSearch(payload: { query: string; requestId: number; dictIds?: DictID[] }): void;
  focusPopupInput(): void;
}

export const { onMessage, sendMessage } = defineExtensionMessaging<BackgroundMessagingProtocolMap>();