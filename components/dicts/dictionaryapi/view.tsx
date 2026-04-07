import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import SpeakerButton from '@/components/ui/SpeakerButton';

import { DictionaryApiDefinition, DictionaryApiResult } from './types';
import './view.scss';

function MetaList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <p className="dictionaryapi-definition-meta">
      <span className="dictionaryapi-definition-meta-label">{label}:</span> {items.join(', ')}
    </p>
  );
}

function DefinitionBlock({ definition }: { definition: DictionaryApiDefinition }) {
  const { t } = useTranslation();

  return (
    <div className="dictionaryapi-definition-block">
      <p className="dictionaryapi-definition-text">{definition.definition}</p>
      {definition.example && (
        <p className="dictionaryapi-definition-example">
          {definition.example}
        </p>
      )}
      <MetaList label={t('dictionaryApi.synonyms')} items={definition.synonyms} />
      <MetaList label={t('dictionaryApi.antonyms')} items={definition.antonyms} />
    </div>
  );
}

function DictionaryApiView({ result }: { result: DictionaryApiResult }) {
  const { t } = useTranslation();
  const audio = useMemo(
    () => result.phonetics.find((item) => item.audio)?.audio,
    [result.phonetics],
  );
  const phoneticText = result.phonetic || result.phonetics.find((item) => item.text)?.text;
  const phoneticTags = result.phonetics
    .map((item) => item.text?.trim())
    .filter((item): item is string => Boolean(item))
    .filter((item, index, list) => list.indexOf(item) === index);

  return (
    <article className="dictionaryapi-entry">
      <div className="dictionaryapi-entry-header">
        <div>
          <h3 className="dictionaryapi-word">{result.word}</h3>
          {phoneticText && <p className="dictionaryapi-reading">{phoneticText}</p>}
        </div>
        {audio && (
          <SpeakerButton
            src={audio}
            size="icon-sm"
            className="dictionaryapi-audio"
            label={`${t('speaker.playAudio')} ${result.word}`}
          />
        )}
      </div>

      {phoneticTags.length > 1 && (
        <div className="dictionaryapi-tags">
          {phoneticTags.map((item) => (
            <span key={item} className="dictionaryapi-tag">
              {item}
            </span>
          ))}
        </div>
      )}

      {result.origin && (
        <div className="dictionaryapi-origin">
          <span className="dictionaryapi-origin-label">{t('dictionaryApi.origin')}</span>
          <p className="dictionaryapi-origin-text">{result.origin}</p>
        </div>
      )}

      <div className="dictionaryapi-senses">
        {result.meanings.map((meaning, meaningIndex) => (
          <section
            key={`${result.word}-${meaning.partOfSpeech}-${meaningIndex}`}
            className="dictionaryapi-sense"
          >
            <p className="dictionaryapi-sense-pos">{meaning.partOfSpeech}</p>
            <div className="dictionaryapi-definition-list">
              {meaning.definitions.map((definition, definitionIndex) => (
                <div
                  key={`${result.word}-${meaningIndex}-${definitionIndex}`}
                  className="dictionaryapi-definition-row"
                >
                  <span className="dictionaryapi-definition-index">{definitionIndex + 1}</span>
                  <div className="dictionaryapi-definition-content">
                    <DefinitionBlock definition={definition} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {result.sourceUrls && result.sourceUrls.length > 0 && (
        <div className="dictionaryapi-attribution">
          <span>{t('dictionaryApi.source')}</span>
          {result.sourceUrls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              {url}
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

export function ResultsView({ data }: { data: unknown[] }) {
  return (
    <>
      {(data as DictionaryApiResult[]).map((result, index) => (
        <DictionaryApiView key={`${result.word}-${index}`} result={result} />
      ))}
    </>
  );
}
