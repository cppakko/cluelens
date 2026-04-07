export interface DictSettingsBackupHandler<T = unknown> {
  key: string;
  exportValue(): Promise<T>;
  importValue(value: unknown): Promise<T>;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

export function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeEnum<T extends string>(
  value: unknown,
  validValues: Set<T>,
  fallback: T,
): T {
  return typeof value === 'string' && validValues.has(value as T)
    ? value as T
    : fallback;
}