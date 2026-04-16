# Add a New Dict

This guide shows the shortest way to add a new module under `components/dicts`.

Core idea:

- `search.ts` gets data
- optional `loadDetail()` in `search.ts` fetches a selected candidate later
- `view.tsx` renders data
- `configView.tsx` is only for settings
- `settingBackup.ts` for backup/restore setiings
- `components/dicts/index.tsx` stores metadata and auto-discovers matching files

## Two Common Patterns

### Simple translator

Examples: `google`, `caiyun`, `deeplx`

- `search.ts` returns `string[]`
- add a small `view.tsx` that reuses `components/dicts/shared/CommonView.tsx`

### Structured dictionary

Examples: `bing`, `jisho`, `wiktionary`, `urban`

- `search.ts` returns structured objects
- add `types.ts`
- add `view.tsx`

### Deferred-detail dictionary

Use this when the site search returns many candidate entries and each candidate needs a separate request.

- `search.ts` returns candidate objects only
- user picks one candidate in `view.tsx`
- `view.tsx` calls `sendMessage('loadDictDetail', { dictId, payload })`
- optional `loadDetail(payload)` in `search.ts` fetches and parses the chosen entry only

## Minimum Steps

### 1. Add a `DictID`

In `components/dicts/types.ts`:

```ts
export enum DictID {
  YourDict = 'yourDict',
}
```

### 2. Create the module folder

```text
components/dicts/yourDict/
  icon.png
  search.ts
  view.tsx
  types.ts
  configView.tsx
  settingBackup.ts
```

Only add the files you need.

### 3. Add `search.ts`

The module must export a `search` function, and it must return an array.

Simple translator example:

```ts
import { SearchOptions } from '../types';

export async function search(text: string, options?: SearchOptions): Promise<string[]> {
  const query = text.trim();
  if (!query) return [];

  const translatedText = '...';
  return translatedText ? [translatedText] : [];
}
```

Structured result example:

```ts
export interface YourDictResult {
  title: string;
}

export async function search(text: string): Promise<YourDictResult[]> {
  const query = text.trim();
  if (!query) return [];

  return [{ title: query }];
}
```

Deferred-detail example:

```ts
export interface YourDictCandidate {
  id: string;
  title: string;
  summary?: string;
}

export async function search(text: string): Promise<YourDictCandidate[]> {
  const query = text.trim();
  if (!query) return [];

  return [{ id: 'entry-1', title: query }];
}

export async function loadDetail(payload: unknown): Promise<unknown> {
  const { id } = payload as { id: string };
  return { id, html: '<div>...</div>' };
}
```

Keep in mind:

- call `trim()`
- return `[]` for empty input
- translators may use `options?.targetLang`
- keep fetching logic in `search.ts`
- use deferred detail loading when the source site has many candidate pages

### 4. Add the renderer

If `search.ts` returns `string[]`, create a minimal `view.tsx` and reuse `CommonView`:

```tsx
import TranslateView from '../shared/CommonView';

export function ResultsView({ data }: { data: unknown[] }) {
  return <TranslateView result={data as string[]} />;
}
```

If the result is structured, create `view.tsx`.

For deferred detail loading, keep candidate list state inside `view.tsx` and request details on click:

```tsx
import { useState } from 'react';
import { sendMessage } from '@/utils/messaging';
import { DictID } from '../types';

export function ResultsView({ data }: { data: unknown[] }) {
  const candidates = data as Array<{ id: string; title: string }>;
  const [detailById, setDetailById] = useState<Record<string, unknown>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleSelect(id: string) {
    setSelectedId(id);
    if (detailById[id]) return;

    setLoadingId(id);
    const result = await sendMessage('loadDictDetail', {
      dictId: DictID.YourDict,
      payload: { id },
    });
    setLoadingId(null);

    if (result?.data !== undefined) {
      setDetailById((prev) => ({ ...prev, [id]: result.data }));
    }
  }

  return null;
}
```

### 5. Register in `components/dicts/index.tsx`

- `DictID` in `components/dicts/types.ts`
- icon import in `components/dicts/index.tsx`
- `dictMetaMap`

These loaders are auto-discovered by file name and do not need manual switch cases:

Important:

- `language` controls when the module is available
- `type` controls whether `targetLang` is passed
- `view.tsx` must export a named `ResultsView` component

## Config, If Needed

If the module needs API keys or custom options:

1. define config type and default value
2. add storage in `utils/storage.ts`
3. build `configView.tsx`
4. if it should be included in backup/restore, add `settingsBackup.ts` in the dict folder and export `settingsBackupHandler`

## i18n

If the module name or settings should be translated, update every language in the i18n folder.

## Good Examples

- simple translator: `google`
- translator with config: `caiyun`, `deeplx`
- structured dict: `urban`, `jisho`
- custom HTML view: `bing`
- module with settings page: `wiktionary`
- AI output: `openai`
