import { ReactNode, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { onMessage, sendMessage } from "@/utils/messaging";
import { dictSettingsStorage } from "@/utils/storage";
import { DictID } from "@/components/dicts/types";
import { loadDictRenderer } from "@/components/dicts";
import ErrorPage from "@/components/panel/ErrorPage";
import i18next from 'i18next';

type SearchOptions = {
  readonly immediate?: boolean;
};

export interface UseDictSearchOptions {
  readonly isPopup: boolean;
  readonly show: boolean;
  readonly text: string;
  readonly reloadKey?: number;
  readonly filterDictIds?: DictID[];
  readonly searchDelayMs?: number;
}

export function useDictSearch({ isPopup, show, text, reloadKey, filterDictIds, searchDelayMs = 120 }: UseDictSearchOptions) {
  const [searchText, setSearchText] = useState(text || '');
  const [isRenderingResults, startRenderingResults] = useTransition();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [orderedDictIds, setOrderedDictIds] = useState<DictID[]>([]);
  const [dictNodes, setDictNodes] = useState<Partial<Record<DictID, ReactNode>>>({});

  const handleError = useCallback((dictId: DictID, errorMessage?: string) => {
    startRenderingResults(() => {
      setDictNodes((prev) => ({
        ...prev,
        [dictId]: <ErrorPage message={errorMessage || i18next.t('error.generic')} compact />,
      }));
    });
  }, [startRenderingResults]);

  const handleSearch = useCallback((text: string, options?: SearchOptions) => {
    const trimmed = text.trim();
    setSearchText(trimmed);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    if (!trimmed) {
      return;
    }

    const trigger = () => {
      setDictNodes({});
      sendMessage('searchQuery', { query: trimmed, dictIds: filterDictIds });
    };

    if (options?.immediate) {
      trigger();
      return;
    }

    searchTimeoutRef.current = setTimeout(trigger, searchDelayMs);
  }, [searchDelayMs, filterDictIds]);

  const handleImmediateSearch = useCallback(
    (text: string) => handleSearch(text, { immediate: true }),
    [handleSearch],
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if ((show || isPopup) && text.trim() !== '') {
      handleSearch(text, { immediate: true });
    }
  }, [text, reloadKey, show, isPopup, handleSearch]);

  // Listen for the actual dict list that background will search
  // (may differ from all enabled dicts when language detection filters some out)
  useEffect(() => {
    const unregisterDictList = onMessage('searchDictList', ({ data: dictIds }) => {
      setOrderedDictIds(dictIds);
      setDictNodes((prev) => {
        const next: Partial<Record<DictID, ReactNode>> = {};
        for (const id of dictIds) {
          next[id] = prev[id];
        }
        return next;
      });
    });
    return () => { unregisterDictList(); };
  }, []);

  useEffect(() => {
    const unregisterSearchResult = onMessage('searchResult', ({ data }) => {
      const { dictId, data: resultData, errorMessage } = data as {
        dictId: DictID;
        data: unknown[];
        errorMessage?: string;
      };

      if (errorMessage) {
        handleError(dictId, errorMessage);
        return;
      }

      if (resultData.length === 0) {
        startRenderingResults(() => {
          setDictNodes((prev) => {
            const next = { ...prev };
            delete next[dictId];
            return next;
          });
        });
        return;
      }

      void (async () => {
        const renderer = await loadDictRenderer(dictId);
        if (!renderer) {
          return;
        }

        const rendered = renderer(resultData);
        startRenderingResults(() => {
          setDictNodes((prev) => {
            if (prev[dictId] === rendered) {
              return prev;
            }
            return {
              ...prev,
              [dictId]: rendered,
            };
          });
        });
      })();
    });

    return () => {
      unregisterSearchResult();
    };
  }, [handleError, startRenderingResults]);

  // When the panel is a popup and the user starts a search, load enabled dict IDs
  // so that we can render placeholders while results are pending.
  useEffect(() => {
    if (isPopup && searchText.trim() !== '' && orderedDictIds.length === 0) {
      if (filterDictIds && filterDictIds.length > 0) {
        setOrderedDictIds(filterDictIds);
      } else {
        (async () => {
          const settings = await dictSettingsStorage.getValue();
          const enabledIds = settings.filter(s => s.enabled).map(s => s.id);
          setOrderedDictIds(enabledIds);
        })();
      }
    }
  }, [isPopup, searchText, orderedDictIds.length, filterDictIds]);

  return {
    searchText,
    isRenderingResults,
    orderedDictIds,
    setOrderedDictIds,
    dictNodes,
    setDictNodes,
    handleSearch,
    handleImmediateSearch,
    handleError,
  };
}
