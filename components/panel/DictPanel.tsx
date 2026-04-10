import { useCallback, useEffect, useMemo, useState } from "react";
import { onMessage } from "@/utils/messaging";
import DictItem from "./DictItem";
import { DictAppBar } from "./AppBar";
import { dictMetaMap } from "../dicts";
import { DictID } from "../dicts/types";
import ErrorBoundary from "./ErrorBoundary";
import { List, ListItem } from "@/components/ui/List";
import { Skeleton } from "@/components/ui/Skeleton";
import { Search } from "lucide-react";
import { useDictSearch } from "./hooks/useDictSearch";
import { useAutoPlayAudio } from "./hooks/useAutoPlayAudio";
import { usePanelPosition, usePanelVisibility } from "./hooks/usePanelPosition";
import { useTranslation } from 'react-i18next';
import { generateMD3Theme } from "@/utils/md3Helper";
import {
  themeColorStorage,
  darkModeStorage,
  themeChromaStorage,
  themeToneStorage,
  vocabularyStorage,
  DEFAULT_THEME_COLOR,
  DEFAULT_THEME_CHROMA,
  DEFAULT_THEME_TONE,
  type VocabularyEntry,
} from "@/utils/storage";

export interface DictPanelProps {
  readonly isPopup: boolean;
  readonly show: boolean;
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly reloadKey?: number;
  readonly filterDictIds?: DictID[];
  readonly onClose?: () => void;
}

export default function DictPanel(props: DictPanelProps) {
  const { t } = useTranslation();
  const searchDelayMs = props.isPopup ? 60 : 120;
  const [seedColor, setSeedColor] = useState(DEFAULT_THEME_COLOR);
  const [isDark, setIsDark] = useState(false);
  const [themeChroma, setThemeChroma] = useState(DEFAULT_THEME_CHROMA);
  const [themeTone, setThemeTone] = useState(DEFAULT_THEME_TONE);
  const [vocabEntries, setVocabEntries] = useState<VocabularyEntry[]>([]);

  useEffect(() => {
    themeColorStorage.getValue().then(setSeedColor);
    darkModeStorage.getValue().then((val) => setIsDark(val ?? false));
    themeChromaStorage.getValue().then((val) => setThemeChroma(val ?? DEFAULT_THEME_CHROMA));
    themeToneStorage.getValue().then((val) => setThemeTone(val ?? DEFAULT_THEME_TONE));
    const unwatchColor = themeColorStorage.watch((newVal) => {
      setSeedColor(newVal ?? DEFAULT_THEME_COLOR);
    });
    const unwatchDark = darkModeStorage.watch((newVal) => {
      setIsDark(newVal ?? false);
    });
    const unwatchChroma = themeChromaStorage.watch((newVal) => {
      setThemeChroma(newVal ?? DEFAULT_THEME_CHROMA);
    });
    const unwatchTone = themeToneStorage.watch((newVal) => {
      setThemeTone(newVal ?? DEFAULT_THEME_TONE);
    });
    vocabularyStorage.getValue().then((val) => setVocabEntries(val ?? []));
    const unwatchVocab = vocabularyStorage.watch((newVal) => {
      setVocabEntries(newVal ?? []);
    });
    return () => { unwatchColor(); unwatchDark(); unwatchChroma(); unwatchTone(); unwatchVocab(); };
  }, []);

  const {
    position,
    setPosition,
    isDragging,
    height,
    minHeight,
    appBarDragHandlers,
    topResizerHandlers,
    bottomResizerHandlers,
  } = usePanelPosition({
    isPopup: props.isPopup,
    show: props.show,
    x: props.x,
    y: props.y,
  });

  const {
    searchText,
    isRenderingResults,
    orderedDictIds,
    setOrderedDictIds,
    dictNodes,
    setDictNodes,
    handleSearch,
    handleImmediateSearch,
    handleError,
  } = useDictSearch({
    isPopup: props.isPopup,
    show: props.show,
    text: props.text,
    reloadKey: props.reloadKey,
    filterDictIds: props.filterDictIds,
    searchDelayMs,
  });

  useAutoPlayAudio({ searchText, show: props.show, isPopup: props.isPopup, orderedDictIds });

  const { visible, isClosing, handleTransitionEnd } = usePanelVisibility({
    isPopup: props.isPopup,
    show: props.show,
    x: props.x,
    y: props.y,
    height,
    setPosition,
    setOrderedDictIds,
    setDictNodes,
  });

  const handleClosePanel = useCallback(() => {
    if (props.isPopup) {
      window.close();
      return;
    }
    if (props.onClose) {
      props.onClose();
    }
  }, [props.isPopup, props.onClose]);

  const handleOpenSettings = useCallback(async () => {
    const runtime = typeof browser !== 'undefined' ? browser.runtime : undefined;
    if (!runtime) {
      return;
    }

    try {
      if (runtime.openOptionsPage) {
        await runtime.openOptionsPage();
        return;
      }
    } catch (error) {
      console.warn('Unable to open options page via runtime API.', error);
    }

    if (typeof window !== 'undefined') {
      const url = runtime.getURL('/options.html');
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // Listen for background focus requests (when shortcut pressed and popup already open)
  useEffect(() => {
    const unregister = onMessage('focusPopupInput', () => {
      setTimeout(() => {
        const el = document.querySelector('input#standard-basic') as HTMLInputElement | null;
        if (el) {
          el.focus();
          if (el.value) {
            el.setSelectionRange(0, el.value.length);
          }
        }
      }, 50);
    });

    return () => {
      unregister();
    };
  }, []);

  const savedDictSet = useMemo(() => {
    const set = new Set<string>();
    const trimmed = searchText.trim();
    if (trimmed) {
      for (const e of vocabEntries) {
        if (e.word === trimmed) {
          for (const d of e.sourceDicts) {
            set.add(d);
          }
        }
      }
    }
    return set;
  }, [vocabEntries, searchText]);

  const dictList = useMemo(() => {
    const idsToRender = (!props.isPopup ? orderedDictIds : (orderedDictIds.length > 0 ? orderedDictIds : (Object.keys(dictNodes) as DictID[])))
      .filter(id => id in dictNodes);

    if (idsToRender.length > 0 && (!props.isPopup || searchText.trim() !== '')) {
      return idsToRender.map((dictId, index) => {
        const content = dictNodes[dictId];
        return <>
          <ListItem key={dictId} className="pl-3 pr-1.5 py-1">
            <DictItem index={index} config={dictMetaMap[dictId]} onSearch={handleImmediateSearch} searchText={searchText} isSaved={savedDictSet.has(dictId)}>
              {[
                content ? (
                  <div key={`fade-${dictId}`} className="animate-dict-fade-in">
                    <ErrorBoundary
                      compact
                      onError={(error, errorInfo) => {
                        console.error(`Error in ${dictId} component:`, error, errorInfo);
                        handleError(dictId, error.message);
                      }}
                    >
                      {content}
                    </ErrorBoundary>
                  </div>
                ) : (
                  <div key="skeleton" className="p-2">
                    <Skeleton className="w-[55%] h-6 rounded-md" />
                    <Skeleton className="h-20 mt-2.5 rounded-lg" />
                  </div>
                )
              ]}
            </DictItem>
          </ListItem>
        </>
      });
    }

    const noDictsEnabled = searchText.trim() !== '' && orderedDictIds.length === 0 && Object.keys(dictNodes).length === 0;

    return (
      <div className="text-center h-full flex flex-col items-center justify-center text-(--m3-on-surface-variant) select-none">
        <Search className="mb-3 w-14 h-14 text-(--m3-primary)/40" strokeWidth={1.75} />
        <div className="text-[15px] font-medium text-(--m3-on-surface) mb-1">{t(noDictsEnabled ? 'dictPanel.noDictsEnabled' : 'dictPanel.noResults')}</div>
        <div className="max-w-[75%] text-[13px] leading-relaxed text-(--m3-outline)">{t(noDictsEnabled ? 'dictPanel.noDictsEnabledDesc' : 'dictPanel.noResultsDesc')}</div>
      </div>
    );
  }, [orderedDictIds, dictNodes, props.isPopup, searchText, handleImmediateSearch, handleError, savedDictSet]);

  const panelStyle = useMemo(() => {
    const isVisible = props.isPopup || visible;
    const isActive = props.isPopup || (visible && !isClosing);

    // Dynamic MD3 theme generation based on the user's seed color.
    const themeVars = generateMD3Theme(seedColor, isDark, '--m3', themeChroma, themeTone) as React.CSSProperties;

    return {
      ...themeVars,
      top: position.y,
      left: position.x,
      visibility: isVisible ? 'visible' : 'hidden',
      opacity: isActive ? 1 : 0,
      transform: isActive ? 'scale(1)' : 'scale(0.94)',
      transformOrigin: 'top center',
      transition: isDragging
        ? 'opacity 0.16s ease-in-out, transform 0.16s ease-in-out'
        : 'opacity 0.16s ease-in-out, transform 0.16s ease-in-out, top 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
      width: props.isPopup ? '100%' : '450px',
      height: props.isPopup ? '100%' : height,
      minHeight,
      pointerEvents: (props.isPopup || !isClosing) ? 'auto' : 'none',
      willChange: 'opacity, transform, top, left, height',
      borderRadius: props.isPopup ? '0px' : '16px',
      boxShadow: props.isPopup ? 'none' : `0 1px 3px color-mix(in srgb, var(--m3-on-surface) 8%, transparent), 0 8px 24px color-mix(in srgb, var(--m3-on-surface) 15%, transparent)`,
    } as const;
  }, [position.x, position.y, props.isPopup, visible, isClosing, isDragging, height, minHeight, seedColor, isDark, themeChroma, themeTone]);

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      className="fixed z-20000 overflow-hidden flex flex-col"
      style={panelStyle}
    >
      <div
        {...(!props.isPopup && topResizerHandlers)}
        className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize z-10"
      />
      <DictAppBar
        handler={props.isPopup ? undefined : appBarDragHandlers}
        onClose={handleClosePanel}
        onOpenSettings={handleOpenSettings}
        text={searchText}
        onSearch={handleSearch}
        autoFocus={props.isPopup}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <List
          className="w-full bg-(--m3-surface) flex-1 overflow-y-auto [scrollbar-gutter:stable] py-2"
          aria-busy={isRenderingResults}
        >
          {dictList}
        </List>
      </div>
      <div
        {...(!props.isPopup && bottomResizerHandlers)}
        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize z-10"
      />
    </div>
  );
}
