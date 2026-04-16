import { dictMetaMap, loadDictSearcher } from '@/components/dicts';
import { DictID, ModuleType, isLanguageSupported } from '@/components/dicts/types';
import { getCommonSettings, dictSettingsStorage } from '@/utils/storage';
import { detectTextLanguage } from '@/utils/detectLanguage';
import { HttpError } from '@/utils/fetchHtml';
import { resolveTargetLanguage } from '@/utils/languageUtils';
import { onMessage, sendMessage } from '@/utils/messaging';
import { attachSidePanelPort, routeToSidePanel } from '@/utils/sidePanelRouter';

export default defineBackground(() => {
  browser.runtime.onConnect.addListener((port) => {
    if (port.name === 'sidepanel') {
      attachSidePanelPort(port);
    }
  });

  onMessage('openPopupQuery', async (message) => {
    const { query, dictIds } = message.data;
    await openPanel(query, dictIds);
  });

  onMessage('searchQuery', async (message) => {
    const tabId = message.sender.tab?.id;
    const { query, dictIds: filterDictIds } = message.data;
    const commonSettings = await getCommonSettings();

    let enabledDicts: DictID[];
    if (filterDictIds && filterDictIds.length > 0) {
      enabledDicts = filterDictIds;
    } else {
      const localConfig = await dictSettingsStorage.getValue();
      enabledDicts = localConfig.filter((dict) => dict.enabled).map((dict) => dict.id as DictID);
    }

    if (commonSettings.enableLanguageDetection) {
      const inputLanguage = detectTextLanguage(query);
      enabledDicts = enabledDicts.filter(
        (dictId) => {
          const dictConfig = dictMetaMap[dictId];
          if (!dictConfig) return false;
          return isLanguageSupported(dictConfig.language, inputLanguage);
        }
      )
    };
    await sendMessage('searchDictList', enabledDicts, tabId);

    const resolvedTargetLang = resolveTargetLanguage(commonSettings.translatorTargetLanguage);

    await Promise.allSettled(
      enabledDicts.map(async (dictId) => {
        const dictConfig = dictMetaMap[dictId];
        const dictEngine = await loadDictSearcher(dictId);
        if (!dictEngine) return;
        try {
          const isTranslator = dictConfig?.type === ModuleType.Translator;
          const options = isTranslator ? { targetLang: resolvedTargetLang } : undefined;
          const data = await dictEngine.search(query, options);
          await sendMessage('searchResult', { dictId, data }, tabId);
        }
        catch (error) {
          // HTTP 404 means the word was not found — treat as empty results, not an error
          if (error instanceof HttpError && error.status === 404) {
            await sendMessage('searchResult', { dictId, data: [] }, tabId);
          } else {
            console.error(`Error searching with dictionary ${dictId}:`, error);
            await sendMessage('searchResult', { dictId, data: [], errorMessage: error instanceof Error ? error.message : String(error) }, tabId);
          }
        }
      })
    );
  });

  onMessage('loadDictDetail', async (message) => {
    const { dictId, payload } = message.data;
    const dictEngine = await loadDictSearcher(dictId);

    if (!dictEngine?.loadDetail) {
      return { errorMessage: `Dictionary ${dictId} does not support deferred detail loading.` };
    }

    try {
      const data = await dictEngine.loadDetail(payload);
      return { data };
    }
    catch (error) {
      if (error instanceof HttpError && error.status === 404) {
        return { data: undefined };
      }

      console.error(`Error loading deferred detail for dictionary ${dictId}:`, error);
      return { errorMessage: error instanceof Error ? error.message : String(error) };
    }
  });

  browser.commands.onCommand.addListener(async (command) => {
    if (command === 'open_panel') {
      await openPanel();
    }
  });

  browser.contextMenus.create({
    id: 'toggle-side-panel',
    title: browser.i18n.getMessage('toggle_side_panel_description') || 'Open side panel',
    contexts: ['all'],
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'toggle-side-panel') {
      const tabId = tab?.id;
      if (tabId) {
        try {
          if (browser.sidebarAction?.open) {
            await browser.sidebarAction.open();
          } else {
            await browser.sidePanel.open({ tabId });
          }

        } catch (err) {
          console.error('Failed to toggle side panel:', err);
        }
      }
    }
  });

  onMessage('routeSearchToSidePanel', (message) => {
    const { query, dictIds } = message.data;
    return routeToSidePanel(query, Date.now(), dictIds);
  });
});


async function openPanel(query?: string, dictIds?: DictID[]) {
  try {
    const trimmedQuery = query?.trim() ?? '';
    const requestId = Date.now();

    // If side panel is alive, route search there
    if (routeToSidePanel(trimmedQuery, requestId, dictIds)) {
      return;
    }

    await openPopupWindow(trimmedQuery, requestId, dictIds);
  }
  catch (err) {
    console.error('Failed to open panel:', err);
  }
}

async function openPopupWindow(trimmedQuery: string, requestId: number, dictIds?: DictID[]) {
  const runtime = typeof browser !== 'undefined' ? browser.runtime : undefined;
  const popupPath = '/popup.html';

  if (!runtime) {
    throw new Error('browser.runtime not available');
  }

  let url: string;
  if (trimmedQuery) {
    let params = `q=${encodeURIComponent(trimmedQuery)}&requestId=${requestId}`;
    if (dictIds && dictIds.length > 0) {
      params += `&dicts=${encodeURIComponent(dictIds.join(','))}`;
    }
    url = runtime.getURL(`${popupPath}?${params}`);
  } else {
    url = runtime.getURL(popupPath);
  }

  const allTabs = await browser.tabs.query({});
  const tab = allTabs.find((t) =>
    (t.url?.includes(popupPath)) ||
    (t.pendingUrl?.includes(popupPath))
  );

  if (tab && tab.id !== undefined && tab.windowId !== undefined) {
    await browser.windows.update(tab.windowId, { focused: true });
    await browser.tabs.update(tab.id, { active: true });
    try {
      if (trimmedQuery) {
        await sendMessage('popupSearch', { query: trimmedQuery, requestId, dictIds }, tab.id);
      }
      await sendMessage('focusPopupInput', undefined, tab.id);
    }
    catch (err) {
      console.warn('Failed to send focus message to popup:', err);
    }
  } else {
    await browser.windows.create({ url, type: 'popup', width: 460, height: 600 });
  }
}
