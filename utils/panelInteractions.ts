import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

export type Position = { x: number; y: number };

export interface UseDraggableResizablePanelOptions {
  initialPosition: Position;
  initialHeight?: number;
  minHeight?: number;
  bottomMargin?: number;
}

function getViewportHeight() {
  return typeof window !== 'undefined' ? window.innerHeight : 0;
}

export function useDraggableResizablePanel({
  initialPosition,
  initialHeight = 560,
  minHeight = 320,
  bottomMargin = 16,
}: UseDraggableResizablePanelOptions) {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [height, setHeight] = useState<number>(initialHeight);
  const [isDragging, setIsDragging] = useState(false);

  const dragStateRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const resizeStateRef = useRef<
    | {
      pointerId: number;
      edge: 'top' | 'bottom';
      startY: number;
      startTop: number;
      startHeight: number;
    }
    | null
  >(null);

  const onDragPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target;
    const interactiveSelector = [
      'button',
      'a',
      'input',
      'textarea',
      'select',
      '[contenteditable=""]',
      '[contenteditable="true"]',
      '[role="textbox"]',
    ].join(', ');
    if (target instanceof HTMLElement && target.closest(interactiveSelector)) return;
    event.preventDefault();
    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const onDragPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) return;
    const { offsetX, offsetY } = dragStateRef.current;
    setPosition({ x: event.clientX - offsetX, y: event.clientY - offsetY });
  };

  const onDragPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const onBottomResizeDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    resizeStateRef.current = {
      pointerId: event.pointerId,
      edge: 'bottom',
      startY: event.clientY,
      startTop: position.y,
      startHeight: height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const onBottomResizeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const s = resizeStateRef.current;
    if (!s || s.pointerId !== event.pointerId || s.edge !== 'bottom') return;
    const dy = event.clientY - s.startY;
    const maxH = Math.max(minHeight, getViewportHeight() - s.startTop - bottomMargin);
    const nextH = Math.max(minHeight, Math.min(s.startHeight + dy, maxH));
    setHeight(nextH);
  };

  const onResizeEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!resizeStateRef.current || resizeStateRef.current.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    resizeStateRef.current = null;
    setIsDragging(false);
  };

  const onTopResizeDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    resizeStateRef.current = {
      pointerId: event.pointerId,
      edge: 'top',
      startY: event.clientY,
      startTop: position.y,
      startHeight: height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const onTopResizeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const s = resizeStateRef.current;
    if (!s || s.pointerId !== event.pointerId || s.edge !== 'top') return;
    const dy = event.clientY - s.startY;
    const bottomConst = s.startTop + s.startHeight;
    let newTop = s.startTop + dy;
    newTop = Math.max(0, Math.min(newTop, bottomConst - minHeight));
    const newHeight = Math.max(minHeight, bottomConst - newTop);
    setPosition((prev) => ({ ...prev, y: newTop }));
    setHeight(newHeight);
  };

  return {
    position,
    setPosition,
    isDragging,
    height,
    setHeight,
    minHeight,
    appBarDragHandlers: {
      onPointerDown: onDragPointerDown,
      onPointerMove: onDragPointerMove,
      onPointerUp: onDragPointerEnd,
      onPointerCancel: onDragPointerEnd,
    },
    topResizerHandlers: {
      onPointerDown: onTopResizeDown,
      onPointerMove: onTopResizeMove,
      onPointerUp: onResizeEnd,
      onPointerCancel: onResizeEnd,
    },
    bottomResizerHandlers: {
      onPointerDown: onBottomResizeDown,
      onPointerMove: onBottomResizeMove,
      onPointerUp: onResizeEnd,
      onPointerCancel: onResizeEnd,
    },
  } as const;
}
