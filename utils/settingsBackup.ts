import { dictSettingsBackupIds, loadDictSettingsBackupHandler } from '@/components/dicts/settingsBackup';
import { DictID } from '@/components/dicts/types';
import {
  DEFAULT_THEME_COLOR,
  DEFAULT_THEME_CHROMA,
  DEFAULT_THEME_TONE,
  commonSettingsStorage,
  darkModeStorage,
  dictSettingsStorage,
  fontConfigStorage,
  fontConfigDefault,
  themeColorStorage,
  themeChromaStorage,
  themeToneStorage,
  vocabularyStorage,
  type CommonSettings,
  type DictSetting,
  type FontConfig,
  type FontCDNProvider,
  type VocabularyEntry,
} from '@/utils/storage';

const dictIdList = Object.values(DictID) as DictID[];
const defaultEnabledDicts = new Set<DictID>([
  DictID.Bing,
  DictID.Google,
  DictID.Wiktionary,
]);
const validDictIds = new Set(dictIdList);
const SETTINGS_BACKUP_VERSION = 1;
const coreSettingsKeys = [
  'commonSettings',
  'dictSettings',
  'fontConfig',
  'themeColor',
  'darkMode',
  'themeChroma',
  'themeTone',
  'vocabulary',
] as const;

type LoadedDictSettingsBackupHandler = Awaited<ReturnType<typeof loadDictSettingsBackupHandler>>;

export interface CoreSettingsBackupData {
  commonSettings: CommonSettings;
  dictSettings: DictSetting[];
  fontConfig: FontConfig;
  themeColor: string;
  darkMode: boolean;
  themeChroma: number;
  themeTone: number;
  vocabulary: VocabularyEntry[];
}

export interface SettingsBackupData extends CoreSettingsBackupData {
  [key: string]: unknown;
}

export interface SettingsBackup {
  schemaVersion: typeof SETTINGS_BACKUP_VERSION;
  exportedAt: string;
  settings: SettingsBackupData;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeThemeColor(value: unknown): string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value
    : DEFAULT_THEME_COLOR;
}

function normalizeNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && isFinite(value) && value >= min && value <= max
    ? value
    : fallback;
}

function normalizeCommonSettings(value: unknown): CommonSettings {
  const prev = isRecord(value) ? value : {};

  return {
    enableLanguageDetection: normalizeBoolean(prev.enableLanguageDetection, true),
    translatorTargetLanguage: normalizeString(prev.translatorTargetLanguage, 'auto'),
    uiLanguage: normalizeString(prev.uiLanguage, 'auto'),
  };
}

function normalizeDictSettings(value: unknown): DictSetting[] {
  const importedItems = Array.isArray(value) ? value : [];
  const seen = new Set<DictID>();
  const normalized: DictSetting[] = [];

  for (const item of importedItems) {
    if (!isRecord(item) || typeof item.id !== 'string' || !validDictIds.has(item.id as DictID)) {
      continue;
    }

    const id = item.id as DictID;

    if (seen.has(id)) {
      continue;
    }

    seen.add(id);
    normalized.push({
      id,
      enabled: normalizeBoolean(item.enabled, defaultEnabledDicts.has(id)),
    });
  }

  for (const id of dictIdList) {
    if (!seen.has(id)) {
      normalized.push({
        id,
        enabled: defaultEnabledDicts.has(id),
      });
    }
  }

  return normalized;
}

const validCdnProviders = new Set<FontCDNProvider>(['google', 'sjtu-mirror']);

function normalizeFontConfig(value: unknown): FontConfig {
  const prev = isRecord(value) ? value : {};
  const cdnProvider = typeof prev.cdnProvider === 'string' && validCdnProviders.has(prev.cdnProvider as FontCDNProvider)
    ? prev.cdnProvider as FontCDNProvider
    : fontConfigDefault.cdnProvider;

  return {
    enabled: normalizeBoolean(prev.enabled, fontConfigDefault.enabled),
    fontFamily: normalizeString(prev.fontFamily, fontConfigDefault.fontFamily),
    cdnProvider,
  };
}

function normalizeVocabulary(value: unknown): VocabularyEntry[] {
  if (!Array.isArray(value)) return [];
  const results: VocabularyEntry[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    if (typeof item.id !== 'string' || typeof item.word !== 'string' || typeof item.addedAt !== 'number') continue;

    let sourceDicts: DictID[];
    if (Array.isArray(item.sourceDicts)) {
      sourceDicts = item.sourceDicts.filter(
        (d: unknown): d is DictID => typeof d === 'string' && validDictIds.has(d as DictID)
      );
    } else {
      continue;
    }

    if (sourceDicts.length === 0) continue;

    results.push({
      id: item.id,
      word: item.word,
      sourceDicts,
      addedAt: item.addedAt,
      ...(typeof item.note === 'string' ? { note: item.note } : {}),
    });
  }
  return results;
}

async function getDictSettingsBackupHandlers(): Promise<NonNullable<LoadedDictSettingsBackupHandler>[]> {
  const handlers = await Promise.all(
    dictSettingsBackupIds.map(dictId => loadDictSettingsBackupHandler(dictId))
  );

  return handlers.filter((handler): handler is NonNullable<LoadedDictSettingsBackupHandler> => handler !== null);
}

function normalizeCoreSettingsBackupData(value: unknown): CoreSettingsBackupData {
  const prev = isRecord(value) ? value : {};

  return {
    commonSettings: normalizeCommonSettings(prev.commonSettings),
    dictSettings: normalizeDictSettings(prev.dictSettings),
    fontConfig: normalizeFontConfig(prev.fontConfig),
    themeColor: normalizeThemeColor(prev.themeColor),
    darkMode: normalizeBoolean(prev.darkMode, false),
    themeChroma: normalizeNumber(prev.themeChroma, DEFAULT_THEME_CHROMA, 0, 150),
    themeTone: normalizeNumber(prev.themeTone, DEFAULT_THEME_TONE, 0, 100),
    vocabulary: normalizeVocabulary(prev.vocabulary),
  };
}

export async function exportSettingsBackup(): Promise<SettingsBackup> {
  const dictHandlers = await getDictSettingsBackupHandlers();
  const [
    commonSettings,
    dictSettings,
    fontConfig,
    themeColor,
    darkMode,
    themeChroma,
    themeTone,
    vocabulary,
  ] = await Promise.all([
    commonSettingsStorage.getValue(),
    dictSettingsStorage.getValue(),
    fontConfigStorage.getValue(),
    themeColorStorage.getValue(),
    darkModeStorage.getValue(),
    themeChromaStorage.getValue(),
    themeToneStorage.getValue(),
    vocabularyStorage.getValue(),
  ]);

  const dictSettingsEntries = await Promise.all(
    dictHandlers.map(async (handler) => [handler.key, await handler.exportValue()] as const)
  );

  return {
    schemaVersion: SETTINGS_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings: {
      ...normalizeCoreSettingsBackupData({
        commonSettings,
        dictSettings,
        fontConfig,
        themeColor,
        darkMode,
        themeChroma,
        themeTone,
        vocabulary,
      }),
      ...Object.fromEntries(dictSettingsEntries),
    },
  };
}

export async function importSettingsBackup(value: unknown): Promise<SettingsBackupData> {
  if (!isRecord(value)) {
    throw new Error('Invalid settings backup format.');
  }

  if ('schemaVersion' in value && value.schemaVersion !== SETTINGS_BACKUP_VERSION) {
    throw new Error('Unsupported settings backup version.');
  }

  const source = isRecord(value.settings) ? value.settings : value;
  const dictHandlers = await getDictSettingsBackupHandlers();
  const hasKnownSettingsKey = [
    ...coreSettingsKeys,
    ...dictHandlers.map(handler => handler.key),
  ].some((key) => key in source);

  if (!hasKnownSettingsKey) {
    throw new Error('Invalid settings backup content.');
  }

  const normalizedCore = normalizeCoreSettingsBackupData(source);
  const dictSettingsEntries = await Promise.all(
    dictHandlers.map(async (handler) => [handler.key, await handler.importValue(source[handler.key])] as const)
  );

  await Promise.all([
    commonSettingsStorage.setValue(normalizedCore.commonSettings),
    dictSettingsStorage.setValue(normalizedCore.dictSettings),
    fontConfigStorage.setValue(normalizedCore.fontConfig),
    themeColorStorage.setValue(normalizedCore.themeColor),
    darkModeStorage.setValue(normalizedCore.darkMode),
    themeChromaStorage.setValue(normalizedCore.themeChroma),
    themeToneStorage.setValue(normalizedCore.themeTone),
    vocabularyStorage.setValue(normalizedCore.vocabulary),
  ]);

  return {
    ...normalizedCore,
    ...Object.fromEntries(dictSettingsEntries),
  };
}