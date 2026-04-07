import { useTranslation } from 'react-i18next';

import { HtmlBlock } from '@/components/dicts/shared/CommonView';

import { MoegirlResult } from './types';
import './view.scss';

export function ResultsView({ data }: { data: unknown[] }) {
  return (
    <>
      {(data as MoegirlResult[]).map((result, index) => (
        <MoegirlView key={`${result.title}-${index}`} result={result} />
      ))}
    </>
  );
}

function MoegirlView({ result }: { result: MoegirlResult }) {
  const { t } = useTranslation();

  return (
    <article className="moegirl-entry">
      <div className="moegirl-entry-header">
        <h3 className="moegirl-title">{result.title}</h3>
        <a href={result.sourceUrl} target="_blank" rel="noreferrer" className="moegirl-source-link">
          {t('moegirl.source')}
        </a>
      </div>

      <HtmlBlock className="moegirl-richtext" html={result.html} baseUrl={result.baseUrl} hideIfEmpty />
    </article>
  );
}
