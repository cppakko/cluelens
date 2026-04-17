import { useTranslation } from 'react-i18next';

import SpeakerButton from '@/components/ui/SpeakerButton';

import type {
  SpanishDictAudioText,
  SpanishDictEntry,
  SpanishDictExample,
  SpanishDictPhrase,
  SpanishDictResult,
  SpanishDictSense,
  SpanishDictTranslation,
} from './types';
import './view.scss';

function toArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

export function ResultsView({ data }: { data: unknown[] }) {
  return (
    <>
      {(data as SpanishDictResult[]).map((result, index) => (
        <SpanishDictResultView key={index} result={result} />
      ))}
    </>
  );
}

function SpanishDictResultView({ result }: { result: SpanishDictResult }) {
  const entries = toArray(result.entries);
  const quickdefs = toArray(result.quickdefs);
  const phrases = toArray(result.phrases);

  const summary = {
    headword: result.headword,
    quickdefs,
  };

  return (
    <div className="spanishdict-result">
      {entries.map((entry, index) => (
        <SpanishDictEntryView
          key={`${entry.word}-${entry.pos}-${index}`}
          entry={entry}
          summary={index === 0 ? summary : undefined}
        />
      ))}

      {entries.length === 0 && (result.headword || quickdefs.length > 0) && (
        <section className="spanishdict-summary-card">
          {result.headword && <HeadwordSummaryView item={result.headword} />}
          {quickdefs.length > 0 && (
            <div className="spanishdict-quickdefs">
              {quickdefs.map((quickdef, index) => (
                <AudioTextChip key={`${quickdef.text}-${index}`} item={quickdef} />
              ))}
            </div>
          )}
        </section>
      )}

      {phrases.length > 0 && <PhraseSection phrases={phrases} />}
    </div>
  );
}

function SpanishDictEntryView({
  entry,
  summary,
}: {
  entry: SpanishDictEntry;
  summary?: { headword?: SpanishDictAudioText; quickdefs: SpanishDictAudioText[] };
}) {
  const quickdefs = toArray(summary?.quickdefs);
  const senses = toArray(entry.senses);

  return (
    <article className="spanishdict-entry">
      <div className="spanishdict-entry-header">
        <div className="spanishdict-entry-title-row">
          <h3 className="spanishdict-word">{entry.word}</h3>
          {summary?.headword?.audioUrl && (
            <SpeakerButton
              src={summary.headword.audioUrl}
              size="icon-sm"
              className="spanishdict-headword-audio"
            />
          )}
        </div>
        <div className="spanishdict-meta">
          {entry.pos && <span className="spanishdict-pos">{entry.pos}</span>}
          {entry.pronunciation && (
            <span className="spanishdict-pron">{entry.pronunciation}</span>
          )}
        </div>

        {quickdefs.length > 0 ? (
          <div className="spanishdict-quickdefs">
            {quickdefs.map((quickdef, index) => (
              <AudioTextChip key={`${quickdef.text}-${index}`} item={quickdef} />
            ))}
          </div>
        ) : null}
      </div>

      <div className="spanishdict-senses">
        {senses.map((sense, i) => (
          <SenseView key={i} sense={sense} />
        ))}
      </div>
    </article>
  );
}

function SenseView({ sense }: { sense: SpanishDictSense }) {
  const translations = toArray(sense.translations);

  return (
    <div className="spanishdict-sense">
      <div className="spanishdict-sense-header">
        <span className="spanishdict-sense-number">{sense.number}</span>
        {sense.context && (
          <span className="spanishdict-sense-context">{sense.context}</span>
        )}
      </div>
      <div className="spanishdict-translations">
        {translations.map((trans, i) => (
          <TranslationView key={i} translation={trans} />
        ))}
      </div>
    </div>
  );
}

function TranslationView({ translation }: { translation: SpanishDictTranslation }) {
  const regions = toArray(translation.regions);
  const examples = toArray(translation.examples);

  return (
    <div className="spanishdict-translation">
      <div className="spanishdict-trans-header">
        <span className="spanishdict-trans-letter">{translation.letter}.</span>
        <span className="spanishdict-trans-word">{translation.word}</span>
        {translation.registerLabel && (
          <span className="spanishdict-register">{translation.registerLabel}</span>
        )}
        {regions.length > 0 && (
          <span className="spanishdict-regions">
            {regions.map((r, i) => (
              <span key={i} className="spanishdict-region">{r}</span>
            ))}
          </span>
        )}
      </div>
      {examples.length > 0 && (
        <div className="spanishdict-examples">
          {examples.map((ex, i) => (
            <ExampleView key={i} example={ex} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExampleView({ example }: { example: SpanishDictExample }) {
  return (
    <div className="spanishdict-example">
      <p className="spanishdict-example-source">{example.source}</p>
      <p className="spanishdict-example-target">{example.target}</p>
    </div>
  );
}

function HeadwordSummaryView({ item }: { item: SpanishDictAudioText }) {
  return (
    <div className="spanishdict-summary-row">
      <span className="spanishdict-summary-text">{item.text}</span>
      {item.pronunciation && <span className="spanishdict-summary-pron">{item.pronunciation}</span>}
      {item.audioUrl && <SpeakerButton src={item.audioUrl} size="icon-sm" />}
    </div>
  );
}

function AudioTextChip({ item }: { item: SpanishDictAudioText }) {
  return (
    <span className="spanishdict-chip">
      <span className="spanishdict-chip-text">{item.text}</span>
      {item.pronunciation && <span className="spanishdict-chip-pron">{item.pronunciation}</span>}
      {item.audioUrl && <SpeakerButton src={item.audioUrl} size="icon-sm" />}
    </span>
  );
}

function PhraseSection({ phrases }: { phrases: SpanishDictPhrase[] }) {
  const { t } = useTranslation();
  const items = toArray(phrases);

  return (
    <section className="spanishdict-section">
      <h4 className="spanishdict-section-title">{t('spanishDictView.phrases')}</h4>
      <div className="spanishdict-phrases">
        {items.map((phrase, index) => (
          <div className="spanishdict-phrase" key={`${phrase.source.text}-${index}`}>
            <AudioTextRow item={phrase.source} />
            <div className="spanishdict-phrase-targets">
              {phrase.noDirectTranslation ? (
                <span className="spanishdict-phrase-empty">{t('spanishDictView.noDirectTranslation')}</span>
              ) : (
                toArray(phrase.targets).map((target, targetIndex) => (
                  <AudioTextRow key={`${target.text}-${targetIndex}`} item={target} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AudioTextRow({ item }: { item: SpanishDictAudioText }) {
  return (
    <div className="spanishdict-audio-row">
      <span className="spanishdict-audio-row-text">{item.text}</span>
      {item.pronunciation && <span className="spanishdict-audio-row-pron">{item.pronunciation}</span>}
      {item.audioUrl && <SpeakerButton src={item.audioUrl} size="icon-sm" />}
    </div>
  );
}
