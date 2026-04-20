import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { exportSettingsBackup, importSettingsBackup } from '@/utils/settingsBackup';
import { loadFont, unloadFont } from '@/utils/fontLoader';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/tailwindUtils';
import { CheckCircle2, Download, Upload } from 'lucide-react';
import Icon from '@/assets/icon.svg?react';

export function AboutPage() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const applyUiLanguage = (value: string) => {
    if (value === 'auto') {
      try {
        const browserLang = browser.i18n.getUILanguage();
        const prefix = browserLang.split('-')[0];
        const resolved = prefix === 'zh' ? 'zh-CN' : (['en', 'ja'].includes(prefix) ? prefix : 'en');
        i18next.changeLanguage(resolved);
      } catch {
        i18next.changeLanguage('en');
      }
    } else {
      i18next.changeLanguage(value);
    }
  };

  const handleExport = async () => {
    try {
      const backup = await exportSettingsBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cluelens-settings-${backup.exportedAt.replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setFeedback({ type: 'success', message: t('commonSettings.exportSuccess') });
    } catch {
      setFeedback({ type: 'error', message: t('commonSettings.exportError') });
    }
  };

  const handleImportTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text()) as unknown;
      const imported = await importSettingsBackup(raw);

      applyUiLanguage(imported.commonSettings.uiLanguage);
      if (imported.fontConfig.enabled && imported.fontConfig.fontFamily) {
        loadFont(imported.fontConfig.fontFamily, imported.fontConfig.cdnProvider);
      } else {
        unloadFont();
      }
      setFeedback({ type: 'success', message: t('commonSettings.importSuccess') });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('commonSettings.importErrorUnknown');
      setFeedback({
        type: 'error',
        message: t('commonSettings.importError', { message }),
      });
    }
  };

  const handleImportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!window.confirm(t('commonSettings.importConfirm'))) {
      return;
    }

    void handleImportFile(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mt-1 text-sm text-(--m3-on-surface-variant)">{t('options.aboutSubtitle')}</p>
      </div>
      <div className="rounded-3xl bg-(--m3-surface-container) p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center rounded-2xl text-(--m3-on-primary-container)">
            <Icon className="h-14 w-14" />
          </div>
          <div>
            <p className="text-base font-semibold text-(--m3-on-surface)">ClueLens</p>
            <p className="mt-0.5 text-sm text-(--m3-on-surface-variant)">{t('options.version', { version: '0.2.1' })}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl p-3">
        <div className="space-y-3 rounded-2xl bg-(--m3-surface-container-lowest) px-4 py-4">
          <div>
            <label className="block text-sm font-medium text-(--m3-on-surface) mb-1">
              {t('commonSettings.backupRestore')}
            </label>
            <p className="text-xs text-(--m3-on-surface-variant)">
              {t('commonSettings.backupRestoreDesc')}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl border-(--m3-outline-variant)/70 bg-(--m3-surface-container-low) text-(--m3-on-surface) hover:bg-(--m3-surface-container)"
              onClick={() => void handleExport()}
            >
              <Upload className="h-4 w-4" />
              {t('commonSettings.exportJson')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl border-(--m3-outline-variant)/70 bg-(--m3-surface-container-low) text-(--m3-on-surface) hover:bg-(--m3-surface-container)"
              onClick={handleImportTrigger}
            >
              <Download className="h-4 w-4" />
              {t('commonSettings.importJson')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportChange}
            />
          </div>

          {feedback && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-xl px-3 py-2 text-sm',
                feedback.type === 'success'
                  ? 'bg-(--m3-tertiary-container) text-(--m3-on-tertiary-container)'
                  : 'bg-(--m3-error-container) text-(--m3-on-error-container)'
              )}
            >
              {feedback.type === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
