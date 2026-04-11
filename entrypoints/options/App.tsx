import { useEffect, useRef, useState } from 'react';
import DictionarySettings from './sub/DictionarySettings';
import './App.scss';
import { cn } from '@/utils/tailwindUtils';
import { Settings, BookOpen, Info, Bookmark } from 'lucide-react';
import { CommonSettings } from './sub/CommonSettings';
import { VocabularyPage } from './sub/VocabularyPage';
import { useTranslation } from 'react-i18next';
import Icon from '@/assets/icon.svg?react';
import { generateMD3Theme } from '@/utils/md3Helper';
import { themeColorStorage, darkModeStorage, DEFAULT_THEME_COLOR } from '@/utils/storage';

function AboutPage() {
  const { t } = useTranslation();
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
            <p className="mt-0.5 text-sm text-(--m3-on-surface-variant)">{t('options.version', { version: '0.1.4' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const menuItems = [
  { textKey: 'options.common', icon: Settings, page: 'general', hint: 'Preferences' },
  { textKey: 'options.dictionaries', icon: BookOpen, page: 'dict', hint: 'Modules' },
  { textKey: 'options.vocabulary', icon: Bookmark, page: 'vocabulary', hint: 'Saved words' },
  { textKey: 'options.about', icon: Info, page: 'about', hint: 'Extension info' },
];

function App() {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [renderedIndex, setRenderedIndex] = useState(1);
  const [isContentVisible, setIsContentVisible] = useState(true);
  const animationTimerRef = useRef<number | null>(null);

  // Apply M3 dynamic theme to :root
  useEffect(() => {
    let currentColor = DEFAULT_THEME_COLOR;
    let currentDark = false;
    let rafId = 0;

    const applyTheme = (color: string, isDark: boolean) => {
      const vars = generateMD3Theme(color, isDark);
      const root = document.documentElement;
      for (const [key, value] of Object.entries(vars)) {
        root.style.setProperty(key, value);
      }
      root.style.colorScheme = isDark ? 'dark' : 'light';
      document.body.style.background = vars['--m3-surface-container-high'];
      document.body.style.color = vars['--m3-on-surface'];
    };

    const scheduleApply = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => applyTheme(currentColor, currentDark));
    };

    Promise.all([
      themeColorStorage.getValue(),
      darkModeStorage.getValue(),
    ]).then(([color, dark]) => {
      currentColor = color ?? DEFAULT_THEME_COLOR;
      currentDark = dark ?? false;
      applyTheme(currentColor, currentDark);
    });

    const unwatchColor = themeColorStorage.watch((newVal) => {
      currentColor = newVal ?? DEFAULT_THEME_COLOR;
      scheduleApply();
    });
    const unwatchDark = darkModeStorage.watch((newVal) => {
      currentDark = newVal ?? false;
      scheduleApply();
    });
    return () => { unwatchColor(); unwatchDark(); cancelAnimationFrame(rafId); };
  }, []);

  const renderContent = () => {
    switch (renderedIndex) {
      case 0: return <CommonSettings />;
      case 1: return <DictionarySettings />;
      case 2: return <VocabularyPage />;
      case 3: return <AboutPage />;
      default: return null;
    }
  };

  useEffect(() => {
    if (selectedIndex === renderedIndex) {
      setIsContentVisible(true);
      return;
    }

    setIsContentVisible(false);

    animationTimerRef.current = window.setTimeout(() => {
      setRenderedIndex(selectedIndex);
      window.requestAnimationFrame(() => {
        setIsContentVisible(true);
      });
    }, 130);

    return () => {
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current);
      }
    };
  }, [renderedIndex, selectedIndex]);

  return (
    <div className="options-shell min-h-screen">
      <div className="options-backdrop" aria-hidden="true" />
      <div className="options-layout">
        <nav className="options-sidebar">
          <div className="options-brand-card">
            <Icon className="h-16 w-16" />
            <div className="space-y-1 text-center">
              <h1 className="text-lg font-semibold leading-tight tracking-tight text-(--m3-on-surface)">
                ClueLens
              </h1>
              <p className="text-sm text-(--m3-on-surface-variant)">{t('options.settings')}</p>
            </div>
          </div>

          <div className="options-nav-card">
            <div className="space-y-1.5">
              {menuItems.map((item, index) => {
                const MenuIcon = item.icon;
                const isActive = selectedIndex === index;
                return (
                  <button
                    key={item.page}
                    onClick={() => setSelectedIndex(index)}
                    className={cn(
                      'group relative w-full overflow-hidden rounded-2xl px-4 py-3.5 text-left outline-none transition-all duration-250',
                      isActive
                        ? 'bg-(--m3-secondary-container) text-(--m3-on-secondary-container)'
                        : 'text-(--m3-on-surface-variant) hover:bg-(--m3-surface-container) hover:text-(--m3-on-surface)'
                    )}
                  >
                    <span className={cn('flex items-center gap-3 transition-transform duration-250', isActive ? 'translate-x-0' : 'group-hover:translate-x-0.5')}>
                      <span
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-250',
                          isActive
                            ? 'bg-(--m3-on-secondary-container)/14 text-(--m3-on-secondary-container)'
                            : 'bg-(--m3-surface-container-highest)/55 text-(--m3-on-surface-variant)'
                        )}
                      >
                        <MenuIcon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{t(item.textKey)}</span>
                        <span className={cn('block truncate pt-0.5 text-xs', isActive ? 'text-(--m3-on-secondary-container)/72' : 'text-(--m3-on-surface-variant)/78')}>
                          {item.hint}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <main className="options-main custom-scrollbar">
          <div className="options-panel">
            <div className="options-panel-header">
              <div>
                <h2 className="mt-2 text-[28px] font-semibold leading-8 text-(--m3-on-surface)">
                  {t(menuItems[renderedIndex]?.textKey ?? 'options.settings')}
                </h2>
              </div>
            </div>

            <div className={cn('options-content-stage', isContentVisible ? 'is-visible' : 'is-hidden')}>
              <div key={renderedIndex} className="options-content-card">
                {renderContent()}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
