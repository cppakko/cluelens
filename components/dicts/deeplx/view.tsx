import TranslateView from '../shared/CommonView';
import type { DeeplxResult } from './types';

export function ResultsView({ data }: { data: unknown[] }) {
  return <TranslateView result={(data as DeeplxResult[]).map((item) => item.translatedText)} />;
}
