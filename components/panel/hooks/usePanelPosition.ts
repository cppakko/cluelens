import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { useDraggableResizablePanel } from "@/utils/panelInteractions";
import { clampToViewport } from "@/utils/contentViewUtils";
import { DictID } from "@/components/dicts/types";

export interface UsePanelVisibilityOptions {
  readonly isPopup: boolean;
  readonly show: boolean;
  readonly x: number;
  readonly y: number;
  readonly height: number;
  readonly setPosition: (pos: { x: number; y: number }) => void;
  readonly setOrderedDictIds: (ids: DictID[]) => void;
  readonly setDictNodes: (nodes: Partial<Record<DictID, ReactNode>>) => void;
}

export interface UsePanelPositionOptions {
  readonly isPopup: boolean;
  readonly show: boolean;
  readonly x: number;
  readonly y: number;
}

export function usePanelPosition({ isPopup, show, x, y }: UsePanelPositionOptions) {
  const [initialPosition] = useState(() => {
    const defaultY = isPopup
      ? 0
      : typeof window !== "undefined"
        ? Math.round(window.innerHeight * 0.25)
        : 0;
    return { x, y: show ? y : defaultY };
  });

  const draggable = useDraggableResizablePanel({ initialPosition });

  return draggable;
}

export interface UsePanelVisibilityResult {
  visible: boolean;
  isClosing: boolean;
  handleTransitionEnd: () => void;
}

export function usePanelVisibility({
  isPopup,
  show,
  x,
  y,
  height,
  setPosition,
  setOrderedDictIds,
  setDictNodes,
}: UsePanelVisibilityOptions): UsePanelVisibilityResult {
  const [visible, setVisible] = useState(isPopup || show);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const syncPosition = async () => {
      if (show) {
        let px = x;
        let py = y;

        if (!isPopup && typeof window !== "undefined") {
          ({ x: px, y: py } = clampToViewport(px, py, 450, height));
        }

        setPosition({ x: px, y: py });
        setVisible(true);
        setIsClosing(false);
        const settings = await dictSettingsStorage.getValue();
        if (cancelled) return;
        const enabledIds = settings.filter(s => s.enabled).map(s => s.id);

        if (!visible) {
          setOrderedDictIds(enabledIds);
          setDictNodes({});
        } else {
          setOrderedDictIds(enabledIds);
        }
      } else if (!isPopup) {
        setIsClosing(true);
      }
    };

    syncPosition();
    return () => { cancelled = true; };
  }, [show, x, y, isPopup]);

  const handleTransitionEnd = useCallback(() => {
    if (isClosing) {
      setVisible(false);
      setDictNodes({});
      setOrderedDictIds([]);
    }
  }, [isClosing, setDictNodes, setOrderedDictIds]);

  return { visible, isClosing, handleTransitionEnd };
}
