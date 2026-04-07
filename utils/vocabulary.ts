import { DictID } from '@/components/dicts/types';
import { vocabularyStorage, type VocabularyEntry } from './storage';

export async function addWord(
  word: string,
  sourceDict: DictID,
): Promise<boolean> {
  const entries = await vocabularyStorage.getValue();
  const existing = entries.find((e) => e.word === word);
  if (existing) {
    if (existing.sourceDicts.includes(sourceDict)) return false;
    await vocabularyStorage.setValue(
      entries.map((e) =>
        e.id === existing.id
          ? { ...e, sourceDicts: [...e.sourceDicts, sourceDict] }
          : e,
      ),
    );
    return true;
  }

  const entry: VocabularyEntry = {
    id: crypto.randomUUID(),
    word,
    sourceDicts: [sourceDict],
    addedAt: Date.now(),
  };
  await vocabularyStorage.setValue([...entries, entry]);
  return true;
}

export async function removeSourceDict(
  word: string,
  sourceDict: DictID,
): Promise<void> {
  const entries = await vocabularyStorage.getValue();
  const existing = entries.find((e) => e.word === word);
  if (!existing) return;
  const newSources = existing.sourceDicts.filter((d) => d !== sourceDict);
  if (newSources.length === 0) {
    await vocabularyStorage.setValue(entries.filter((e) => e.id !== existing.id));
  } else {
    await vocabularyStorage.setValue(
      entries.map((e) =>
        e.id === existing.id ? { ...e, sourceDicts: newSources } : e,
      ),
    );
  }
}

export async function removeWord(id: string): Promise<void> {
  const entries = await vocabularyStorage.getValue();
  await vocabularyStorage.setValue(entries.filter((e) => e.id !== id));
}

export async function clearAll(): Promise<void> {
  await vocabularyStorage.setValue([]);
}

export function exportVocabularyJSON(entries: VocabularyEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export function exportVocabularyCSV(entries: VocabularyEntry[]): string {
  const header = 'word,sourceDicts,addedAt,note';
  const rows = entries.map((e) => {
    const date = new Date(e.addedAt).toISOString();
    const escapeCsv = (s?: string) => {
      if (!s) return '';
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    return [
      escapeCsv(e.word),
      escapeCsv(e.sourceDicts.join(';')),
      date,
      escapeCsv(e.note),
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
