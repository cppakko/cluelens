import { DictID } from './types';
import type { DictSettingsBackupHandler } from './shared/settingsBackupCommon';

const backupModules = import.meta.glob<{ settingsBackupHandler: DictSettingsBackupHandler }>(
  './*/settingsBackup.ts',
  { import: 'settingsBackupHandler' },
);

export const dictSettingsBackupIds = Object.keys(backupModules)
  .map((key) => {
    const match = key.match(/^\.\/(.+?)\/settingsBackup\.ts$/);
    return match?.[1] as DictID | undefined;
  })
  .filter((id): id is DictID => id != null && Object.values(DictID).includes(id as DictID));

export async function loadDictSettingsBackupHandler(
  dictId: DictID,
): Promise<DictSettingsBackupHandler | null> {
  const loader = backupModules[`./${dictId}/settingsBackup.ts`];
  if (!loader) return null;
  return await loader() as unknown as DictSettingsBackupHandler;
}