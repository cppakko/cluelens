import React from 'react';
import { UrbanResult } from './types';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

function formatText(text: string): React.ReactNode {
  // Urban Dictionary uses [word] notation for links – render them as styled spans
  const parts = text.split(/(\[[^\]]+\])/);
  return parts.map((part, partIndex) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span key={partIndex} className="text-(--m3-primary) font-medium">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

export function ResultsView({ data }: { data: unknown[] }) {
  return (
    <>
      {(data as UrbanResult[]).map((result, index) => (
        <UrbanView key={index} result={result} />
      ))}
    </>
  );
}

function UrbanView({ result }: { result: UrbanResult }) {
  const { entries } = result;

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 p-2.5 text-left">
      {entries.map((entry, index) => (
        <div key={index} className="space-y-1.5 text-left">
          <p className="text-left text-sm leading-relaxed whitespace-pre-line text-(--m3-on-surface)">
            {formatText(entry.definition)}
          </p>
          {entry.example && (
            <p className="text-left text-xs leading-relaxed italic whitespace-pre-line text-(--m3-on-surface-variant)">
              {formatText(entry.example)}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-(--m3-on-surface-variant)">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {entry.thumbs_up}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsDown className="w-3 h-3" />
              {entry.thumbs_down}
            </span>
          </div>
          {index < entries.length - 1 && (
            <div className="border-t border-(--m3-outline-variant)/40 pt-2" />
          )}
        </div>
      ))}
    </div>
  );
}
