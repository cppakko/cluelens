import { useEffect, useRef } from "react";
import Icon from '~/assets/floatIcon.svg?react';

export interface MiniIconProps {
  readonly enableHover: boolean;
  readonly x: number;
  readonly y: number;
  readonly show: boolean;
  readonly onIconClick: () => void;
}

export default function FloatIcon(props: MiniIconProps) {
  const wasShowingRef = useRef(false);

  useEffect(() => {
    wasShowingRef.current = props.show;
  }, [props.show]);

  const shouldAnimate = props.show && wasShowingRef.current;

  return (
    <div
      id="MiniIcon"
      role="img"
      style={{
        transform: `translate(${props.x}px, ${props.y}px)`,
        visibility: props.show ? 'visible' : 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 20000,
        pointerEvents: 'auto',
        transition: shouldAnimate ? 'transform 0.3s ease-out' : 'none',
      }}
      onClick={props.onIconClick}
    >
      <Icon
        style={{
          width: '64px',
          height: '64px',
          objectFit: 'contain',
          display: 'block',
          maxWidth: 'none',
          transition: 'transform 0.18s ease-out, opacity 0.18s ease-out',
          transform: props.show ? 'scale(1)' : 'scale(0.8)',
          opacity: props.show ? 1 : 0,
        }}
      />
    </div>
  )
}