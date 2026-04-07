import { useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { HtmlBlock } from '@/components/dicts/shared/CommonView';
import SpeakerButton from '@/components/ui/SpeakerButton';

import { WiktionaryResult } from './types';
import './style.scss';

export function ResultsView({ data }: { data: unknown[] }) {
  return (
    <>
      {(data as WiktionaryResult[]).map((entry, index) => (
        <WiktionaryView key={index} result={entry} />
      ))}
    </>
  );
}

function WiktionaryView({ result }: { result: WiktionaryResult }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const mountedRoots: Root[] = [];
    const placeholders = container.querySelectorAll<HTMLElement>('.wiktionary-audio-placeholder[data-audio-src]');

    placeholders.forEach((placeholder) => {
      const src = placeholder.dataset.audioSrc;
      if (!src) {
        return;
      }

      const root = createRoot(placeholder);
      root.render(
        <SpeakerButton
          src={src}
          label={placeholder.dataset.audioLabel}
          size="icon-sm"
          className="wiktionary-audio-button"
        />,
      );
      mountedRoots.push(root);
    });

    return () => {
      mountedRoots.forEach((root) => root.unmount());
    };
  }, [result.baseUrl, result.html]);

  return (
    <HtmlBlock
      ref={containerRef}
      className="WiktionaryDict p-2.5 text-sm leading-relaxed text-(--m3-on-surface)"
      html={result.html}
      baseUrl={result.baseUrl}
    />
  );
};
