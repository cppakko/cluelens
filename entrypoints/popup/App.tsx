import '~/assets/globals.css';
import { onMessage } from '@/utils/messaging';
import { useEffect, useState } from 'react';
import './app.scss';
import DictPanel from '~/components/panel/DictPanel';
import { DictID } from '@/components/dicts/types';

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
  const [reloadKey, setreloadKey] = useState(() => {
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
    const unregister = onMessage('popupSearch', ({ data }) => {
      setText(data.query);
      setreloadKey(data.requestId);
      setFilterDictIds(data.dictIds);
    });

    return () => {
      unregister();
    };
  }, []);

  return (
    <DictPanel isPopup x={0} y={0} show text={text} reloadKey={reloadKey} filterDictIds={filterDictIds} />
  );
}

export default App;
