import '~/assets/globals.css';
import { createRoot } from 'react-dom/client';
import { createTextSelectionListener } from '@/utils/textSelectionListener';
import { getPanelPosition, getIconPosition, isSelectionFromPanel, isEventInsidePanel } from '@/utils/contentViewUtils';
import type { SelectionInfo } from '~/utils/types';
import FloatIcon from '@/components/ui/FloatIcon';
import { useState, useEffect, useRef, useCallback } from 'react';
import { initI18n } from '@/i18n';
import { computeZoomCorrection } from '@/utils/pageScaleCorrection';
import DictPanel from '~/components/panel/DictPanel';
import { fontConfigStorage, type FontConfig } from '@/utils/storage';
import { loadFont, unloadFont } from '@/utils/fontLoader';

function ContentApp() {
  const [iconPos, setIconPos] = useState({ x: 0, y: 0, show: false });
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0, show: false });
  const [text, setText] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const nextPanelPosRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const panelShowRef = useRef(false);

  const isNodeInsidePanel = useCallback((node?: Node | null) => {
    if (!node || !rootRef.current) {
      return false;
    }
    return rootRef.current.contains(node);
  }, []);
  const isMouseDownInsideRef = useRef(false);
  const pointerFromPanelRef = useRef(false);

  useEffect(() => {
    panelShowRef.current = panelPos.show;
    if (!panelPos.show) {
      pointerFromPanelRef.current = false;
    }
  }, [panelPos.show]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!panelPos.show) return;
      const isInside = isEventInsidePanel(event, rootRef);
      isMouseDownInsideRef.current = isInside;
      pointerFromPanelRef.current = isInside;

      if (!isInside) {
        // Close immediately on pointer down outside the panel to avoid click delay
        setPanelPos(prev => (prev.show ? { ...prev, show: false } : prev));
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (!panelPos.show) return;

      const isInside = isEventInsidePanel(event, rootRef);
      const isMouseDownInside = isMouseDownInsideRef.current;

      if (isInside || isMouseDownInside) {
        isMouseDownInsideRef.current = false;
        return;
      }

      isMouseDownInsideRef.current = false;

      setPanelPos(prev => ({ ...prev, show: false }));
    };

    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [panelPos.show]);

  useEffect(() => {
    const textSelectionListener = createTextSelectionListener(async (selectionInfo?: SelectionInfo) => {
      if (!selectionInfo) {
        setIconPos(prev => {
          if (!prev.show) return prev;
          return { ...prev, show: false };
        });
        return;
      }

      const { text, rect, mousePosition, eventTarget, triggerEvent } = selectionInfo;

      if (isSelectionFromPanel({
        pointerFromPanelRef,
        rootRef,
        eventTarget: eventTarget ?? null,
        triggerEvent,
        isNodeInsidePanel
      })) {
        return;
      }

      const panelLoc = getPanelPosition(rect, mousePosition);
      const iconLoc = getIconPosition(rect, mousePosition);

      nextPanelPosRef.current = panelLoc;

      setText(text);

      if (panelShowRef.current) {
        setPanelPos({ ...panelLoc, show: true });
        setIconPos(prev => ({ ...prev, show: false }));
      } else {
        setIconPos({ ...iconLoc, show: true });
      }
    }, {
      enableDeduplication: true,
      delay: 0,
      minTextLength: 1,
    });

    textSelectionListener.startListening();
    return () => {
      textSelectionListener.stopListening();
    };
  }, []);

  const handleIconClick = () => {
    setPanelPos({ ...nextPanelPosRef.current, show: true });
    setIconPos(prev => ({ ...prev, show: false }));
  };

  const handlePanelClose = () => {
    setPanelPos(prev => ({ ...prev, show: false }));
  };

  return (
    <div ref={rootRef}>
      <FloatIcon enableHover={false} {...iconPos} onIconClick={handleIconClick} />
      <DictPanel isPopup={false} {...panelPos} text={text} onClose={handlePanelClose} />
    </div>
  );
}

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    // ── Custom font ──
    let fontUnwatch: (() => void) | undefined;
    const applyFont = (cfg: FontConfig, host?: Element) => {
      if (cfg.enabled && cfg.fontFamily) {
        const familyValue = loadFont(cfg.fontFamily, cfg.cdnProvider);
        if (host) (host as HTMLElement).style.setProperty('--cl-font-family', familyValue);
      } else {
        unloadFont();
        if (host) (host as HTMLElement).style.removeProperty('--cl-font-family');
      }
    };

    const ui = await createShadowRootUi(ctx, {
      name: 'dict-ui',
      position: 'inline',
      anchor: 'body',
      onMount: async (container) => {
        await initI18n();
        const shadowRoot = container.getRootNode() as ShadowRoot;
        const host = shadowRoot?.host;
        if (host) {
          const correction = computeZoomCorrection(host);
          if (correction !== 1) {
            (container as HTMLElement).style.zoom = String(correction);
          }
        }

        // Apply initial font config and watch for changes
        const initialFontConfig = await fontConfigStorage.getValue();
        applyFont(initialFontConfig, host);
        fontUnwatch = fontConfigStorage.watch((cfg) => {
          applyFont(cfg, host);
        });

        const root = createRoot(container);
        root.render(<ContentApp />);
        return root;
      },
      onRemove: async (root) => {
        fontUnwatch?.();
        unloadFont();
        (await root!).unmount();
      },
    });

    ui.mount();
  },
});

