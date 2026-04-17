import { useMemo } from 'react';

import { HtmlBlock } from '@/components/dicts/shared/CommonView';
import SpeakerButton from '@/components/ui/SpeakerButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

import type { LarousseEntry, LarousseResult } from './types';
import './view.scss';

export function ResultsView({ data }: { data: unknown[] }) {
  return (
    <>
      {(data as LarousseResult[]).map((result, index) => (
        <LarousseResultView key={index} result={result} />
      ))}
    </>
  );
}

function LarousseResultView({ result }: { result: LarousseResult }) {
  return (
    <div className="larousse-result">
      {result.entries.map((entry, index) => (
        <LarousseEntryView
          key={`${entry.word}-${entry.pos}-${index}`}
          entry={entry}
          baseUrl={result.baseUrl}
          showDivider={index > 0}
        />
      ))}
    </div>
  );
}

function LarousseEntryView({ entry, baseUrl, showDivider }: { entry: LarousseEntry; baseUrl: string; showDivider: boolean }) {
  const defaultTab = useMemo(() => {
    const preferred = ['Définitions', 'Expressions'];
    const match = entry.sections.find((s) => preferred.includes(s.title));
    return match?.title || entry.sections[0]?.title || 'section-0';
  }, [entry.sections]);

  return (
    <article className="larousse-entry">
      {showDivider && <hr className="larousse-divider" />}
      <div className="larousse-entry-header">
        <div>
          <h3 className="larousse-word">{entry.word}</h3>
          <div className="larousse-meta">
            {entry.pos && (
              <span className="larousse-pos">{entry.pos}</span>
            )}
            {entry.etymology && (
              <span className="larousse-etymology">{entry.etymology}</span>
            )}
            {entry.audioUrl && (
              <SpeakerButton src={entry.audioUrl} size="icon-sm" />
            )}
          </div>
        </div>
      </div>

      {entry.sections.length === 1 ? (
        <div className="larousse-single-section">
          <HtmlBlock className="larousse-richtext" html={entry.sections[0].html} baseUrl={baseUrl} hideIfEmpty />
        </div>
      ) : entry.sections.length > 1 ? (
        <Tabs defaultValue={defaultTab} className="larousse-tabs">
          <TabsList className="larousse-tabs-list h-auto flex-wrap justify-start gap-1">
            {entry.sections.map((section, index) => (
              <TabsTrigger
                key={`${section.title}-${index}`}
                value={section.title || `section-${index}`}
                className="larousse-tabs-trigger"
              >
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {entry.sections.map((section, index) => (
            <TabsContent
              key={`${section.title}-${index}`}
              value={section.title || `section-${index}`}
              className="larousse-tab-content"
            >
              <HtmlBlock className="larousse-richtext" html={section.html} baseUrl={baseUrl} hideIfEmpty />
            </TabsContent>
          ))}
        </Tabs>
      ) : null}
    </article>
  );
}
