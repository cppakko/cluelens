import { JishoResult, JishoSense } from './types';
import './view.scss';

const JISHO_BASE_URL = 'https://jisho.org/search/';

function formatTag(tag: string) {
  return tag.replace(/^jlpt-?/i, 'JLPT ').replace(/^wanikani/i, 'WaniKani ');
}

function renderMetaList(items: string[]) {
  if (items.length === 0) {
    return null;
  }

  return items.join(' / ');
}

function SenseMeta({ sense }: { sense: JishoSense }) {
  const metaGroups = [
    renderMetaList(sense.tags),
    sense.restrictions.length > 0 ? `Restrictions: ${sense.restrictions.join(', ')}` : null,
    sense.see_also.length > 0 ? `See also: ${sense.see_also.join(', ')}` : null,
    sense.antonyms.length > 0 ? `Antonyms: ${sense.antonyms.join(', ')}` : null,
    sense.info.length > 0 ? sense.info.join(' / ') : null,
  ].filter(Boolean) as string[];

  if (metaGroups.length === 0 && sense.links.length === 0) {
    return null;
  }

  return (
    <div className="jisho-sense-meta">
      {metaGroups.length > 0 && (
        <p className="jisho-sense-note">{metaGroups.join(' | ')}</p>
      )}
      {sense.links.length > 0 && (
        <div className="jisho-sense-links">
          {sense.links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
              {link.text}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function ResultsView({ data }: { data: unknown[] }) {
  return <JishoView data={data as JishoResult[]} />;
}

function JishoView({ data }: { data: JishoResult[] }) {
  return (
    <div className="jisho-dict">
      {data.map((entry) => (
        <article key={`${entry.slug}-${entry.japanese[0]?.reading ?? 'entry'}`} className="jisho-entry">
          <div className="jisho-entry-header">
            <div>
              <h3 className="jisho-word">{entry.japanese[0]?.word || entry.slug}</h3>
              <p className="jisho-reading">{entry.japanese[0]?.reading || entry.slug}</p>
            </div>
            <a
              className="jisho-entry-link"
              href={JISHO_BASE_URL + encodeURIComponent(entry.slug)}
              target="_blank"
              rel="noreferrer"
            >
              Jisho
            </a>
          </div>

          {entry.japanese.length > 1 && (
            <div className="jisho-variants">
              {entry.japanese.map((item, index) => (
                <span key={`${item.word ?? item.reading}-${index}`} className="jisho-variant">
                  <span className="jisho-variant-word">{item.word || item.reading}</span>
                  {item.word && <span className="jisho-variant-reading">{item.reading}</span>}
                </span>
              ))}
            </div>
          )}

          {(entry.is_common || entry.jlpt.length > 0 || entry.tags.length > 0) && (
            <div className="jisho-tags">
              {entry.is_common && <span className="jisho-tag jisho-tag-common">Common</span>}
              {entry.jlpt.map((tag) => (
                <span key={tag} className="jisho-tag">{formatTag(tag)}</span>
              ))}
              {entry.tags.map((tag) => (
                <span key={tag} className="jisho-tag">{formatTag(tag)}</span>
              ))}
            </div>
          )}

          <div className="jisho-senses">
            {entry.senses.map((sense, index) => (
              <section key={`${entry.slug}-sense-${index}`} className="jisho-sense">
                {sense.parts_of_speech.length > 0 && (
                  <p className="jisho-sense-pos">{sense.parts_of_speech.join(' / ')}</p>
                )}
                <p className="jisho-sense-definition">
                  {sense.english_definitions.join('; ')}
                </p>
                <SenseMeta sense={sense} />
              </section>
            ))}
          </div>

          {(entry.attribution.jmdict || entry.attribution.jmnedict || entry.attribution.dbpedia) && (
            <div className="jisho-attribution">
              {entry.attribution.jmdict && <span>JMdict</span>}
              {entry.attribution.jmnedict && <span>JMnedict</span>}
              {entry.attribution.dbpedia && (
                <a href={entry.attribution.dbpedia} target="_blank" rel="noreferrer">
                  DBpedia
                </a>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
