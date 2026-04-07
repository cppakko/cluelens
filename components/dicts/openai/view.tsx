import { useTranslation } from 'react-i18next';

import { OpenAIResult, OpenAILexicalResult, OpenAISentenceResult } from './types';

function SectionTitle({ children }: { children: string }) {
  return <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--m3-on-surface-variant)">{children}</div>;
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span
          key={item}
          className="rounded-full bg-(--m3-surface-container-high) px-2.5 py-1 text-xs text-(--m3-on-surface-variant)"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function SentenceView({ result }: { result: OpenAISentenceResult }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 p-1 text-left">
      <div className="rounded-xl bg-linear-to-br from-(--m3-primary-container)/20 via-transparent to-(--m3-secondary-container)/20 p-3">
        <SectionTitle>{t('openaiView.translation')}</SectionTitle>
        <div className="mt-2 text-lg font-semibold leading-relaxed whitespace-pre-line text-(--m3-on-surface)">{result.translation}</div>
        {result.polishedTranslation && result.polishedTranslation !== result.translation && (
          <div className="mt-2 rounded-lg bg-(--m3-surface-container-high)/70 px-3 py-2 text-sm leading-relaxed whitespace-pre-line text-(--m3-on-surface-variant)">
            {result.polishedTranslation}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-(--m3-surface-container-low) p-3">
          <SectionTitle>{t('openaiView.detected')}</SectionTitle>
          <div className="mt-2 text-sm text-(--m3-on-surface)">{result.detectedSourceLanguage || t('openaiView.autoDetected')}</div>
          <div className="mt-1 text-xs text-(--m3-on-surface-variant)">→ {result.targetLanguage || t('openaiView.targetLanguage')}</div>
        </div>
        <div className="rounded-xl bg-(--m3-surface-container-low) p-3">
          <SectionTitle>{t('openaiView.summary')}</SectionTitle>
          <div className="mt-2 text-sm leading-6 whitespace-pre-line text-(--m3-on-surface)">{result.summary || '—'}</div>
        </div>
      </div>

      {result.alternatives.length > 0 && (
        <div className="space-y-2 rounded-xl bg-(--m3-surface-container-low) p-3">
          <SectionTitle>{t('openaiView.alternatives')}</SectionTitle>
          <div className="space-y-2">
            {result.alternatives.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-lg bg-(--m3-surface-container-high)/70 px-3 py-2 text-sm text-(--m3-on-surface)">
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.segments.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>{t('openaiView.segments')}</SectionTitle>
          <div className="space-y-2">
            {result.segments.map((segment, index) => (
              <div key={`${segment.source}-${index}`} className="rounded-xl bg-(--m3-surface-container-low) p-3">
                <div className="text-sm font-medium whitespace-pre-line text-(--m3-on-surface)">{segment.source}</div>
                <div className="mt-1 text-sm leading-6 whitespace-pre-line text-(--m3-primary)">{segment.translation}</div>
                {segment.note && (
                  <div className="mt-1 text-xs leading-5 whitespace-pre-line text-(--m3-on-surface-variant)">{segment.note}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.notes.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>{t('openaiView.notes')}</SectionTitle>
          <ul className="space-y-1.5 text-sm leading-6 text-(--m3-on-surface-variant)">
            {result.notes.map((note, index) => (
              <li key={`${note}-${index}`} className="rounded-lg bg-(--m3-surface-container-low) px-3 py-2">{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LexicalView({ result }: { result: OpenAILexicalResult }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 p-1 text-left">
      <div className="rounded-xl bg-linear-to-br from-(--m3-primary-container)/20 via-transparent to-(--m3-tertiary-container)/20 p-3">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
          <div className="text-2xl font-semibold tracking-tight text-(--m3-on-surface)">{result.term || result.sourceText}</div>
          {result.phonetic && <div className="text-sm font-medium text-(--m3-primary)">{result.phonetic}</div>}
        </div>
        {result.brief && <div className="mt-2 text-sm leading-6 text-(--m3-on-surface-variant)">{result.brief}</div>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-(--m3-surface-container-low) p-3">
          <SectionTitle>{t('openaiView.language')}</SectionTitle>
          <div className="mt-2 text-sm text-(--m3-on-surface)">{result.detectedSourceLanguage || t('openaiView.autoDetected')}</div>
          <div className="mt-1 text-xs text-(--m3-on-surface-variant)">→ {result.targetLanguage || t('openaiView.targetLanguage')}</div>
        </div>
        <div className="rounded-xl bg-(--m3-surface-container-low) p-3">
          <SectionTitle>{t('openaiView.morphology')}</SectionTitle>
          <div className="mt-2">
            <ChipList items={result.morphology} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>{t('openaiView.meanings')}</SectionTitle>
        {result.senses.map((sense, senseIndex) => (
          <div key={`${sense.partOfSpeech}-${senseIndex}`} className="rounded-xl bg-(--m3-surface-container-low) p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="rounded-full bg-(--m3-primary)/12 px-2.5 py-1 text-xs font-semibold text-(--m3-primary)">
                {sense.partOfSpeech}
              </div>
              <div className="text-xs text-(--m3-on-surface-variant)">{t('openaiView.senseCount', { count: sense.definitions.length })}</div>
            </div>

            <div className="space-y-3">
              {sense.definitions.map((definition, definitionIndex) => (
                <div key={`${definition.meaning}-${definitionIndex}`} className="rounded-lg bg-(--m3-surface-container-high)/70 p-3">
                  <div className="flex gap-2 text-sm leading-6 text-(--m3-on-surface)">
                    <span className="min-w-5 font-semibold text-(--m3-primary)">{definitionIndex + 1}.</span>
                    <div>
                      <div className="font-medium">{definition.meaning}</div>
                      {definition.translation && <div className="text-(--m3-primary)">{definition.translation}</div>}
                      {definition.explanation && (
                        <div className="mt-1 text-(--m3-on-surface-variant)">{definition.explanation}</div>
                      )}
                    </div>
                  </div>

                  {definition.examples.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-(--m3-outline-variant)/15 pt-3">
                      {definition.examples.map((example, exampleIndex) => (
                        <div key={`${example.sentence}-${exampleIndex}`} className="rounded-lg bg-(--m3-surface-container-low) px-3 py-2">
                          <div className="text-sm italic leading-6 text-(--m3-on-surface)">{example.sentence}</div>
                          <div className="mt-1 text-sm leading-6 text-(--m3-on-surface-variant)">{example.translation}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(sense.synonyms.length > 0 || sense.antonyms.length > 0 || sense.collocations.length > 0) && (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg bg-(--m3-surface-container-high)/70 p-2.5">
                  <div className="mb-2 text-xs font-semibold text-(--m3-on-surface-variant)">{t('openaiView.synonyms')}</div>
                  <ChipList items={sense.synonyms} />
                </div>
                <div className="rounded-lg bg-(--m3-surface-container-high)/70 p-2.5">
                  <div className="mb-2 text-xs font-semibold text-(--m3-on-surface-variant)">{t('openaiView.antonyms')}</div>
                  <ChipList items={sense.antonyms} />
                </div>
                <div className="rounded-lg bg-(--m3-surface-container-high)/70 p-2.5">
                  <div className="mb-2 text-xs font-semibold text-(--m3-on-surface-variant)">{t('openaiView.collocations')}</div>
                  <ChipList items={sense.collocations} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {result.usageTips.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>{t('openaiView.usageTips')}</SectionTitle>
          <ul className="space-y-1.5 text-sm leading-6 text-(--m3-on-surface-variant)">
            {result.usageTips.map((item, index) => (
              <li key={`${item}-${index}`} className="rounded-lg bg-(--m3-surface-container-low) px-3 py-2">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {result.relatedTerms.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>{t('openaiView.related')}</SectionTitle>
          <ChipList items={result.relatedTerms} />
        </div>
      )}

      {result.notes.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>{t('openaiView.notes')}</SectionTitle>
          <ul className="space-y-1.5 text-sm leading-6 text-(--m3-on-surface-variant)">
            {result.notes.map((note, index) => (
              <li key={`${note}-${index}`} className="rounded-lg bg-(--m3-surface-container-low) px-3 py-2">{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OpenAIView({ result }: { result: OpenAIResult }) {
  if (result.kind === 'lexical') {
    return <LexicalView result={result} />;
  }

  return <SentenceView result={result} />;
}

export function ResultsView({ data }: { data: unknown[] }) {
  return (
    <>
      {(data as OpenAIResult[]).map((result, index) => (
        <OpenAIView key={index} result={result} />
      ))}
    </>
  );
}
