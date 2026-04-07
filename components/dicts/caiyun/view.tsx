import TranslateView from '../shared/CommonView';

export function ResultsView({ data }: { data: unknown[] }) {
  return <TranslateView result={data as string[]} />;
}
