import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { HtmlBlock } from '@/components/dicts/shared/CommonView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

import type { DwdsResult } from './types';
import './view.scss';

export function ResultsView({ data }: { data: unknown[] }) {
  return (
    <>
      {(data as DwdsResult[]).map((result, index) => (
        <DwdsView key={`${result.word}-${index}`} result={result} />
      ))}
    </>
  );
}

function DwdsView({ result }: { result: DwdsResult }) {
  const { t } = useTranslation();

  const defaultTab = useMemo(() => {
    // Prefer Bedeutungen or Bedeutungsübersicht as default tab
    const preferred = ['Bedeutungen', 'Bedeutungsübersicht', 'Grammatik'];
    const match = result.sections.find((s) => preferred.includes(s.title));
    return match?.title || result.sections[0]?.title || 'section-0';
  }, [result.sections]);

  return (
    <article className="dwds-entry">
      <div className="dwds-entry-header">
        <div>
          <h3 className="dwds-word">{result.word}</h3>
          <div className="dwds-meta">
            {result.wortart && (
              <span className="dwds-wortart">{result.wortart}</span>
            )}
            {result.ipa && (
              <span className="dwds-ipa">[{result.ipa}]</span>
            )}
          </div>
        </div>
      </div>

      {result.sections.length === 1 ? (
        <div className="dwds-single-section">
          <HtmlBlock className="dwds-richtext" html={result.sections[0].html} baseUrl={result.baseUrl} hideIfEmpty />
        </div>
      ) : result.sections.length > 0 ? (
        <Tabs defaultValue={defaultTab} className="dwds-tabs">
          <TabsList className="dwds-tabs-list h-auto flex-wrap justify-start gap-1">
            {result.sections.map((section, index) => (
              <TabsTrigger
                key={`${section.title}-${index}`}
                value={section.title || `section-${index}`}
                className="dwds-tabs-trigger"
              >
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {result.sections.map((section, index) => (
            <TabsContent
              key={`${section.title}-${index}`}
              value={section.title || `section-${index}`}
              className="dwds-tab-content"
            >
              <HtmlBlock className="dwds-richtext" html={section.html} baseUrl={result.baseUrl} hideIfEmpty />
            </TabsContent>
          ))}
        </Tabs>
      ) : null}
    </article>
  );
}
