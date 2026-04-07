import React from 'react';

export type Variant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'subtitle1'
  | 'subtitle2'
  | 'body1'
  | 'body2'
  | 'caption'
  | 'subtitle'
  | string;

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: Variant;
  color?: string;
  component?: React.ElementType;
  noWrap?: boolean;
  fontSize?: string | number;
  fontWeight?: React.CSSProperties['fontWeight'];
}

function mapVariantToClass(v?: Variant) {
  switch (v) {
    case 'h1':
      return 'text-4xl font-bold';
    case 'h2':
      return 'text-3xl font-bold';
    case 'h3':
      return 'text-2xl font-semibold';
    case 'h4':
      return 'text-xl font-semibold';
    case 'h5':
      return 'text-lg font-semibold';
    case 'h6':
      return 'text-base font-semibold';
    case 'subtitle1':
      return 'text-base';
    case 'subtitle2':
      return 'text-sm font-semibold';
    case 'body1':
      return 'text-base';
    case 'body2':
      return 'text-sm';
    case 'caption':
      return 'text-xs';
    default:
      return '';
  }
}

function mapColorToClass(c?: string) {
  if (!c) return '';
  if (c === 'text.secondary') return 'text-(--m3-on-surface-variant)';
  if (c === 'error.main') return 'text-(--m3-error)';
  if (c.startsWith('text-')) return c;
  return '';
}

export default function Text({
  variant,
  color,
  component,
  noWrap,
  fontSize,
  fontWeight,
  children,
  className = '',
  ...rest
}: TextProps) {
  const VariantClass = mapVariantToClass(variant);
  const ColorClass = mapColorToClass(color);
  const wrapClass = noWrap ? 'truncate' : '';

  const style: React.CSSProperties = {
    ...(fontSize !== undefined ? { fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize } : {}),
    ...(fontWeight !== undefined ? { fontWeight } : {}),
  };

  const Component = (component || (variant?.startsWith('h') ? (variant as unknown) : 'div')) as React.ElementType;

  const classes = [VariantClass, ColorClass, wrapClass, className].filter(Boolean).join(' ');

  return (
    <Component className={classes} style={style} {...rest}>
      {children}
    </Component>
  );
}
