import React, { FC } from 'react';
import { BingResult } from './types';
import SpeakerButton from '../../ui/SpeakerButton';
import './view.scss';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useTranslation } from 'react-i18next';
import { HtmlBlock } from '../shared/CommonView';

const BING_BASE_URL = 'https://cn.bing.com';

function a11yProps(index: number) {
  return {
    id: `bing-tab-${index}`,
    'aria-controls': `bing-tabpanel-${index}`,
  };
}

const BingView: FC<{ result: BingResult }> = ({ result }) => {
  const { t } = useTranslation();
  if (!result) return null;

  return (
    <div className="bing-result">
      <div className="bing-header">
        <div className="bing-title">{result.title}</div>
        <div className="bing-prons">
          {result.prons.map((pron, index) => (
            <div key={index} className="bing-pron">
              <span className="bing-pron-lang">{pron.lang}</span>
              {pron.pron && <SpeakerButton src={pron.pron} />}
            </div>
          ))}
        </div>
      </div>

      {result.client_def_container && (
        <HtmlBlock
          className="bing-def-container"
          html={result.client_def_container}
          baseUrl={BING_BASE_URL}
        />
      )}

      <div className="bing-content">
        {result.tabs && result.tabs.length > 0 && (
          <>
            <Tabs defaultValue={result.tabs[0].tabId} aria-label="Bing tabs">
              <TabsList>
                {result.tabs.map((tab, idx) => (
                  <TabsTrigger key={tab.tabId} value={tab.tabId} {...a11yProps(idx)}>
                    {tab.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {result.tabs.map((tab) => (
                <TabsContent key={tab.tabId} value={tab.tabId}>
                  <div className="bing-section">
                    <HtmlBlock
                      className="bing-section-content"
                      html={tab.content}
                      baseUrl={BING_BASE_URL}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>


          </>
        )}
      </div>

      {result.client_sentence_content && (
        <div className="bing-sentences-section">
          <div className="client_tb_div">
            <div className="client_tb">
              <div className="client_tbl">
                {t('bing.examples')}
              </div>
            </div>
          </div>
          <HtmlBlock
            className="bing-sentences-content"
            html={result.client_sentence_content}
            baseUrl={BING_BASE_URL}
          />
        </div>
      )}

      {result.client_search_rightside_content && (
        <div className="bing-right">
          <HtmlBlock
            className="bing-right-content"
            html={result.client_search_rightside_content}
            baseUrl={BING_BASE_URL}
          />
        </div>
      )}
    </div>
  );
};

export default BingView;

export function ResultsView({ data }: { data: unknown[] }) {
  return (
    <>
      {(data as BingResult[]).map((entry, index) => (
        <BingView key={index} result={entry} />
      ))}
    </>
  );
}
