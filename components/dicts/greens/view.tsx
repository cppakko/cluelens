import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { HtmlBlock } from '@/components/dicts/shared/CommonView';
import { sendMessage } from '@/utils/messaging';

import { DictID } from '../types';

import type { GreensCandidate, GreensDetailResult, GreensSearchResult } from './types';
import './view.scss';

export function ResultsView({ data }: { data: unknown[] }) {
  return (
    <>
      {(data as GreensSearchResult[]).map((result, index) => (
        <GreensView key={`${result.query}-${index}`} result={result} />
      ))}
    </>
  );
}

function GreensView({ result }: { result: GreensSearchResult }) {
  const { t } = useTranslation();
  const [selectedHref, setSelectedHref] = useState<string | null>(null);
  const [detailByHref, setDetailByHref] = useState<Record<string, GreensDetailResult>>({});
  const [loadingHref, setLoadingHref] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCandidateListCollapsed, setIsCandidateListCollapsed] = useState(false);

  const selectedDetail = selectedHref ? detailByHref[selectedHref] : undefined;
  const selectedCandidate = selectedHref
    ? result.candidates.find((candidate) => candidate.href === selectedHref) ?? null
    : null;

  async function handleSelect(candidate: GreensCandidate) {
    setSelectedHref(candidate.href);
    setLoadError(null);

    if (detailByHref[candidate.href]) {
      setIsCandidateListCollapsed(true);
      return;
    }

    setLoadingHref(candidate.href);
    const response = await sendMessage('loadDictDetail', {
      dictId: DictID.Greens,
      payload: candidate,
    });
    setLoadingHref(null);

    if (response?.errorMessage) {
      setLoadError(response.errorMessage);
      return;
    }

    if (!response?.data) {
      setLoadError(t('greens.loadFailed'));
      return;
    }

    setDetailByHref((prev) => ({
      ...prev,
      [candidate.href]: response.data as GreensDetailResult,
    }));
    setIsCandidateListCollapsed(true);
  }

  return (
    <div className="greens-dict">
      <div className="greens-candidate-panel">
        <div className="greens-summary">
          <div className="greens-summary-row greens-summary-row-end">
            <button
              type="button"
              className="greens-toggle"
              onClick={() => setIsCandidateListCollapsed((prev) => !prev)}
              aria-expanded={!isCandidateListCollapsed}
              aria-label={isCandidateListCollapsed ? t('greens.expandCandidates') : t('greens.collapseCandidates')}
              title={isCandidateListCollapsed ? t('greens.expandCandidates') : t('greens.collapseCandidates')}
            >
              {isCandidateListCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </button>
          </div>
          {selectedCandidate && isCandidateListCollapsed ? (
            <span className="greens-summary-selection">
              {t('greens.selectedEntry')}: {selectedCandidate.title}
              {selectedCandidate.pos ? ` · ${selectedCandidate.pos}` : ''}
            </span>
          ) : null}
        </div>

        <div className={`greens-candidate-list-wrap ${isCandidateListCollapsed ? 'is-collapsed' : ''}`}>
          <div className="greens-candidate-list">
            {result.candidates.map((candidate) => {
              const isSelected = selectedHref === candidate.href;
              const isLoading = loadingHref === candidate.href;
              const metadata = [] as string[];

              if (candidate.isSubentry) {
                metadata.push(t('greens.subentry'));
              }

              if (candidate.homonym) {
                metadata.push(candidate.homonym);
              }

              if (candidate.moreInfo) {
                metadata.push(candidate.moreInfo);
              }

              return (
                <button
                  key={candidate.href}
                  type="button"
                  className={`greens-candidate ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => { void handleSelect(candidate); }}
                  aria-pressed={isSelected}
                >
                  <div className="greens-candidate-head">
                    <span className="greens-candidate-title">{candidate.title}</span>
                    {candidate.pos && <span className="greens-candidate-pos">{candidate.pos}</span>}
                  </div>
                  {candidate.summary && (
                    <div className="greens-candidate-summary">{candidate.summary}</div>
                  )}
                  {(metadata.length > 0 || isLoading) && (
                    <div className="greens-candidate-meta">
                      {metadata.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                      {isLoading && (
                        <span className="greens-candidate-loading">{t('greens.loading')}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loadError && (
        <div className="greens-feedback greens-error">{loadError}</div>
      )}

      {!selectedDetail && !loadingHref && !loadError && isCandidateListCollapsed && (
        <div className="greens-feedback">{t('greens.expandHint')}</div>
      )}

      {!selectedDetail && !loadingHref && !loadError && !isCandidateListCollapsed && (
        <div className="greens-feedback">{t('greens.selectPrompt')}</div>
      )}

      {selectedDetail && (
        <div className="greens-detail">
          <HtmlBlock className="greens-richtext" html={selectedDetail.html} baseUrl={selectedDetail.baseUrl} hideIfEmpty />
        </div>
      )}
    </div>
  );
}