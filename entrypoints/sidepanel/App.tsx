import '~/assets/globals.css';
import { useEffect, useState } from 'react';
import './app.scss';
import DictPanel from '~/components/panel/DictPanel';
import { DictID } from '@/components/dicts/types';
import type { SidePanelPortMessage } from '@/utils/messaging';

function parseDictIds(raw: string | null): DictID[] | undefined {
  if (!raw) return undefined;
  const ids = raw.split(',').filter((id): id is DictID => Object.values(DictID).includes(id as DictID));
  return ids.length > 0 ? ids : undefined;
}

function App() {
  const [text, setText] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') ?? "";
  });
  const [reloadKey, setReloadKey] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const requestId = Number(params.get('requestId'));
    return Number.isFinite(requestId) ? requestId : 0;
  });
  const [filterDictIds, setFilterDictIds] = useState<DictID[] | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    return parseDictIds(params.get('dicts'));
  });

  useEffect(() => {
    document.title = 'ClueLens';
  }, []);

  useEffect(() => {
    // Connect to background via port for side-panel-specific messages
    const port = browser.runtime.connect({ name: 'sidepanel' });

    port.onMessage.addListener((msg: SidePanelPortMessage) => {
      if (msg.type === 'search' && msg.query) {
        setText(msg.query);
        setReloadKey(msg.requestId ?? Date.now());
        setFilterDictIds(msg.dictIds);
      }
      // 'focusInput' — the DictPanel auto-focuses on isPopup mode
    });

    return () => {
      port.disconnect();
    };
  }, []);

  return (
    <DictPanel isPopup x={0} y={0} show text={text} reloadKey={reloadKey} filterDictIds={filterDictIds} />
  );
}

export default App;
