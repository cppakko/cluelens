import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { vocabularyStorage, type VocabularyEntry } from '@/utils/storage';
import { removeWord, clearAll, exportVocabularyJSON, exportVocabularyCSV, downloadFile } from '@/utils/vocabulary';
import { dictMetaMap } from '@/components/dicts';
import { DictID } from '@/components/dicts/types';
import { sendMessage } from '@/utils/messaging';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Search, Trash2, Download, FileDown, Bookmark } from 'lucide-react';

export function VocabularyPage() {
    const { t } = useTranslation();
    const [entries, setEntries] = useState<VocabularyEntry[]>([]);
    const [filter, setFilter] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<VocabularyEntry | null>(null);
    const [showClearDialog, setShowClearDialog] = useState(false);

    useEffect(() => {
        vocabularyStorage.getValue().then((val) => setEntries(val ?? []));
        const unwatch = vocabularyStorage.watch((newVal) => {
            setEntries(newVal ?? []);
        });
        return () => { unwatch(); };
    }, []);

    const filtered = useMemo(() => {
        const sorted = [...entries].sort((a, b) => b.addedAt - a.addedAt);
        if (!filter.trim()) return sorted;
        const q = filter.trim().toLowerCase();
        return sorted.filter((e) => e.word.toLowerCase().includes(q));
    }, [entries, filter]);

    const handleDelete = async () => {
        if (deleteTarget) {
            await removeWord(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    const handleClearAll = async () => {
        await clearAll();
        setShowClearDialog(false);
    };

    const handleExportJSON = () => {
        const json = exportVocabularyJSON(entries);
        downloadFile(json, `cluelens-vocabulary-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    };

    const handleExportCSV = () => {
        const csv = exportVocabularyCSV(entries);
        downloadFile(csv, `cluelens-vocabulary-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    };

    const handleSearchWord = useCallback((word: string) => {
        void sendMessage('openPopupQuery', { query: word });
    }, []);

    const handleSearchWordDict = useCallback((word: string, dictId: DictID) => {
        void sendMessage('openPopupQuery', { query: word, dictIds: [dictId] });
    }, []);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getDictName = (dictId: string) => {
        const meta = dictMetaMap[dictId as DictID];
        if (!meta) return dictId;
        return meta.displayNameKey ? t(meta.displayNameKey) : meta.displayName;
    };

    const getDictIcon = (dictId: string) => {
        const meta = dictMetaMap[dictId as DictID];
        return meta?.icon;
    };

    return (
        <div className="space-y-6">
            <div>
                <p className="mt-1 text-sm text-(--m3-on-surface-variant)">{t('vocabulary.subtitle')}</p>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-50">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--m3-on-surface-variant)" />
                    <Input
                        placeholder={t('vocabulary.searchPlaceholder')}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-9 h-11 rounded-2xl bg-(--m3-surface-container-lowest) border-none text-sm text-(--m3-on-surface) placeholder:text-(--m3-on-surface-variant)/60"
                    />
                </div>
                <span className="text-sm text-(--m3-on-surface-variant)">
                    {t('vocabulary.totalCount', { count: entries.length })}
                </span>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportJSON}
                        disabled={entries.length === 0}
                        className="rounded-xl border-none bg-(--m3-surface-container-lowest) text-(--m3-primary) hover:bg-(--m3-primary-container)/40 disabled:opacity-40"
                    >
                        <Download className="size-4 mr-1.5" />
                        {t('vocabulary.exportJson')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        disabled={entries.length === 0}
                        className="rounded-xl border-none bg-(--m3-surface-container-lowest) text-(--m3-primary) hover:bg-(--m3-primary-container)/40 disabled:opacity-40"
                    >
                        <FileDown className="size-4 mr-1.5" />
                        {t('vocabulary.exportCsv')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowClearDialog(true)}
                        disabled={entries.length === 0}
                        className="rounded-xl border-none bg-(--m3-surface-container-lowest) text-(--m3-error) hover:bg-(--m3-error-container)/40 disabled:opacity-40"
                    >
                        <Trash2 className="size-4 mr-1.5" />
                        {t('vocabulary.clearAll')}
                    </Button>
                </div>
            </div>

            {/* Word list */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center select-none">
                    <Bookmark className="h-12 w-12 text-(--m3-primary)/30 mb-4" />
                    <p className="text-base font-medium text-(--m3-on-surface)/80">{t('vocabulary.empty')}</p>
                    <p className="mt-1.5 text-sm text-(--m3-on-surface-variant)/70 max-w-[320px]">{t('vocabulary.emptyDesc')}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((entry) => (
                        <div
                            key={entry.id}
                            className="group flex items-center gap-3 rounded-2xl bg-(--m3-surface-container-lowest) px-4 py-3.5 transition-all duration-200 hover:bg-(--m3-surface-container-low) hover:shadow-[0_14px_30px_color-mix(in_srgb,var(--m3-on-surface)_6%,transparent)]"
                        >
                            {/* Left: word + date */}
                            <div className="flex-1 min-w-0">
                                <button
                                    onClick={() => handleSearchWord(entry.word)}
                                    className="text-sm font-medium text-(--m3-on-surface) hover:text-(--m3-primary) hover:underline cursor-pointer transition-colors"
                                >
                                    {entry.word}
                                </button>
                                <p className="text-xs text-(--m3-on-surface-variant) mt-0.5">
                                    {t('vocabulary.addedAt', { date: formatDate(entry.addedAt) })}
                                </p>
                            </div>

                            {/* Right: source dict icons */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {entry.sourceDicts.map((dictId) => {
                                    const icon = getDictIcon(dictId);
                                    const name = getDictName(dictId);
                                    return icon ? (
                                        <button
                                            key={dictId}
                                            onClick={() => handleSearchWordDict(entry.word, dictId as DictID)}
                                            className="h-7 w-7 rounded-lg bg-(--m3-surface-container-low) p-1 shadow-sm shrink-0 hover:bg-(--m3-primary-container)/50 hover:shadow-md transition-all cursor-pointer"
                                            title={name}
                                        >
                                            <img src={icon} alt={name} className="h-full w-full" />
                                        </button>
                                    ) : null;
                                })}
                            </div>

                            {/* Delete button */}
                            <button
                                onClick={() => setDeleteTarget(entry)}
                                className="rounded-full p-2 transition-colors opacity-0 group-hover:opacity-100 hover:bg-(--m3-error-container)/50 text-(--m3-error) shrink-0"
                                aria-label={t('vocabulary.delete')}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('vocabulary.delete')}</DialogTitle>
                        <DialogDescription>{t('vocabulary.deleteConfirm')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                            className="rounded-xl border-none bg-(--m3-surface-container) text-(--m3-on-surface)"
                        >
                            {t('appbar.close')}
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="rounded-xl bg-(--m3-error) text-(--m3-on-error) hover:bg-(--m3-error)/80"
                        >
                            {t('vocabulary.delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Clear all confirmation dialog */}
            <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('vocabulary.clearAll')}</DialogTitle>
                        <DialogDescription>{t('vocabulary.clearConfirm')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowClearDialog(false)}
                            className="rounded-xl border-none bg-(--m3-surface-container) text-(--m3-on-surface)"
                        >
                            {t('appbar.close')}
                        </Button>
                        <Button
                            onClick={handleClearAll}
                            className="rounded-xl bg-(--m3-error) text-(--m3-on-error) hover:bg-(--m3-error)/80"
                        >
                            {t('vocabulary.clearAll')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
