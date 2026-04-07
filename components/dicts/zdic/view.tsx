import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { HtmlBlock } from '@/components/dicts/shared/CommonView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

import { ZdicResult } from './types';
import './view.scss';

const PRIMARY_SECTIONS = new Set(['基本解释', '详细解释', '辞海解释', '英语翻译', '汉典']);

export function ResultsView({ data }: { data: unknown[] }) {
  return (
    <>
      {(data as ZdicResult[]).map((result, index) => (
        <ZdicView key={`${result.word}-${index}`} result={result} />
      ))}
    </>
  );
}

function ZdicView({ result }: { result: ZdicResult }) {
  const { t } = useTranslation();

  const defaultTab = useMemo(() => {
    const primary = result.sections.find(s => PRIMARY_SECTIONS.has(s.title));
    return primary?.title || result.sections[0]?.title || 'section-0';
  }, [result.sections]);

  return (
    <article className="zdic-entry">
      <div className="zdic-entry-header">
        <div>
          <h3 className="zdic-word">{result.word}</h3>
        </div>
        <a href={result.sourceUrl} target="_blank" rel="noreferrer" className="zdic-source-link">
          {t('zdic.source')}
        </a>
      </div>

      {result.entryImgHtml && (
        <div className="zdic-entry-img">
          <HtmlBlock className="zdic-richtext" html={result.entryImgHtml} baseUrl={result.baseUrl} hideIfEmpty />
        </div>
      )}

      {result.sections.length === 1 && !result.sections[0].title ? (
        <div className="zdic-single-section">
          <HtmlBlock className="zdic-richtext" html={result.sections[0].html} baseUrl={result.baseUrl} hideIfEmpty />
        </div>

      ) : result.sections.length > 0 ? (
        <Tabs defaultValue={defaultTab} className="zdic-tabs">
          <TabsList className="zdic-tabs-list h-auto flex-wrap justify-start gap-1">
            {result.sections.map((section, index) => (
              <TabsTrigger
                key={`${section.title || ''}-${index}`}
                value={section.title || `section-${index}`}
                className="zdic-tabs-trigger"
              >
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {result.sections.map((section, index) => (
            <TabsContent
              key={`${section.title || ''}-${index}`}
              value={section.title || `section-${index}`}
              className="zdic-tab-content"
            >
              <HtmlBlock className="zdic-richtext" html={section.html} baseUrl={result.baseUrl} hideIfEmpty />
            </TabsContent>
          ))}
        </Tabs>
      ) : null}
    </article>
  );
}
