import { useTranslation } from 'react-i18next';

import type { OmwDetailResult, OmwSearchResult } from './types';
import './view.scss';

const OMW_LANGUAGE_LABELS: Record<string, Record<string, string>> = {
  'zh-CN': {
    eng: '英语',
    cmn: '简体中文',
    jpn: '日语',
    ind: '印尼语',
    zsm: '马来语',
    ita: '意大利语',
    ces: '捷克语',
    yue: '粤语',
    kor: '韩语',
    fra: '法语',
    deu: '德语',
    spa: '西班牙语',
    rus: '俄语',
  },
  en: {
    eng: 'English',
    cmn: 'Chinese (simplified)',
    jpn: 'Japanese',
    ind: 'Indonesian',
    zsm: 'Malay',
    ita: 'Italian',
    ces: 'Czech',
    yue: 'Cantonese',
    kor: 'Korean',
    fra: 'French',
    deu: 'German',
    spa: 'Spanish',
    rus: 'Russian',
  },
  ja: {
    eng: '英語',
    cmn: '簡体字中国語',
    jpn: '日本語',
    ind: 'インドネシア語',
    zsm: 'マレー語',
    ita: 'イタリア語',
    ces: 'チェコ語',
    yue: '広東語',
    kor: '韓国語',
    fra: 'フランス語',
    deu: 'ドイツ語',
    spa: 'スペイン語',
    rus: 'ロシア語',
  },
};

const POS_LABELS: Record<string, string> = {
  n: 'noun',
  v: 'verb',
  a: 'adj',
  r: 'adv',
  x: 'other',
};

function extractPos(synsetId: string): string {
  const match = synsetId.match(/-([nvarx])$/);
  return match ? match[1] : '';
}

function resolveOmwLocale(language: string): keyof typeof OMW_LANGUAGE_LABELS {
  if (language === 'zh-CN') {
    return 'zh-CN';
  }

  const prefix = language.split('-')[0];
  if (prefix === 'zh') {
    return 'zh-CN';
  }

  if (prefix === 'ja') {
    return 'ja';
  }

  return 'en';
}

function useOmwLanguageLabel() {
  const { i18n } = useTranslation();

  return (language: string) => {
    const normalizedLanguage = language.trim().toLowerCase();
    const locale = resolveOmwLocale(i18n.resolvedLanguage ?? i18n.language);
    const localizedLabels = OMW_LANGUAGE_LABELS[locale] ?? OMW_LANGUAGE_LABELS.en;

    return localizedLabels[normalizedLanguage] ?? language;
  };
}

function DetailSection({ detail }: { detail: OmwDetailResult }) {
  const pos = extractPos(detail.synsetId);
  const getLanguageLabel = useOmwLanguageLabel();

  return (
    <div className="omw-detail">
      <div className="omw-detail-header">
        <span className="omw-synset-id">{detail.synsetId}</span>
        {pos && (
          <span className="omw-pos-badge">{POS_LABELS[pos] ?? pos}</span>
        )}
        {detail.glossary && (
          <span className="omw-glossary">{detail.glossary}</span>
        )}
      </div>

      {detail.translations.length > 0 && (
        <div className="omw-detail-block">
          <div className="omw-detail-section-title">Translations</div>
          {detail.translations.map((t) => (
            <div key={t.language} className="omw-translation-row">
              <span className="omw-translation-lang">{getLanguageLabel(t.language)}</span>
              <span className="omw-translation-lemmas">{t.lemmas.join(', ')}</span>
            </div>
          ))}
        </div>
      )}

      {detail.definitions.length > 0 && (
        <div className="omw-detail-block">
          <div className="omw-detail-section-title">Definitions</div>
          {detail.definitions.map((d) => (
            <div key={d.language} className="omw-def-row">
              <span className="omw-def-lang">{getLanguageLabel(d.language)}</span>
              <span className="omw-def-text">{d.text}</span>
            </div>
          ))}
        </div>
      )}

      {detail.relations.length > 0 && (
        <div className="omw-detail-block">
          <div className="omw-detail-section-title">Relations</div>
          {detail.relations.map((r) => (
            <div key={r.type} className="omw-relation-row">
              <span className="omw-relation-type">{r.type}</span>
              <span className="omw-relation-targets">{r.targets.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ResultsView({ data }: { data: unknown[] }) {
  const results = data as OmwSearchResult[];
  if (results.length === 0) return null;

  const { details } = results[0];
  if (details.length === 0) return null;

  return (
    <div className="omw-dict">
      {details.map((detail) => (
        <DetailSection key={detail.synsetId} detail={detail} />
      ))}
    </div>
  );
}
