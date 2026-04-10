import { useEffect, useRef } from 'react';
import { getCommonSettings } from '@/utils/storage';
import { detectTextLanguage } from '@/utils/detectLanguage';
import { playTts } from '@/utils/tts';
import type { DictID } from '@/components/dicts/types';

export interface UseAutoPlayAudioOptions {
  readonly searchText: string;
  readonly show: boolean;
  readonly isPopup: boolean;
  readonly orderedDictIds: DictID[];
}

export function useAutoPlayAudio({ searchText, show, isPopup, orderedDictIds }: UseAutoPlayAudioOptions) {
  const playedQueryRef = useRef<string>('');

  useEffect(() => {
    const trimmed = searchText.trim();
    if (!trimmed || !(show || isPopup)) return;
    if (orderedDictIds.length === 0) return;
    if (playedQueryRef.current === trimmed) return;

    playedQueryRef.current = trimmed;

    void (async () => {
      const settings = await getCommonSettings();
      if (!settings.autoPlayAudio) return;

      const lang = detectTextLanguage(trimmed);
      await playTts(trimmed, lang === 'und' ? 'en' : lang, settings.ttsProvider);
    })();
  }, [searchText, show, isPopup, orderedDictIds]);
}
