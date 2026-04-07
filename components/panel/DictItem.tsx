import Text from '~/components/ui/Text';
import { ReactNode, useCallback, MouseEvent, useState, useRef, useEffect } from "react";
import { DictConfig, DictID } from "../dicts/types";
import { Button } from '../ui/Button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/Accordion';
import { ChevronsUp, ChevronsDown, Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { addWord, removeSourceDict } from '@/utils/vocabulary';

const MAX_HEIGHT = 200;

interface DictItemProps {
  index: number;
  children: ReactNode[];
  config: DictConfig;
  onSearch: (text: string) => void;
  searchText: string;
  isSaved: boolean;
}

export default function DictItem({ index, children, config, onSearch, searchText, isSaved }: DictItemProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandBtn, setShowExpandBtn] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleBookmarkClick = useCallback(async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!searchText.trim()) return;
    if (isSaved) {
      await removeSourceDict(searchText.trim(), config.id as DictID);
    } else {
      await addWord(searchText.trim(), config.id as DictID);
    }
  }, [searchText, isSaved, config.id]);

  const checkHeight = useCallback(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      if (height > 0) {
        setShowExpandBtn(height > MAX_HEIGHT);
        setContentHeight(height);
      }
    }
  }, []);

  useEffect(() => {
    setIsExpanded(false);
  }, [children]);

  useEffect(() => {
    const timer = setTimeout(checkHeight, 100);
    return () => clearTimeout(timer);
  }, [children, checkHeight]);

  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new ResizeObserver(() => {
      checkHeight();
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [checkHeight]);

  const handleLinkClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    let target = event.target as HTMLElement | null;
    while (target && target !== event.currentTarget) {
      const href = target.getAttribute('href');
      if (href) {
        event.preventDefault();
        event.stopPropagation();

        if (target.textContent && target.textContent.trim().length > 0) {
          onSearch(target.textContent.trim());
        }

        break;
      }
      target = target.parentElement;
    }
  }, [onSearch]);

  const displayName = config.displayNameKey ? t(config.displayNameKey) : config.displayName;

  return (
    <Accordion
      type='multiple'
      className="w-full"
      defaultValue={[displayName]}
      onValueChange={(values) => {
        if (!values.includes(displayName)) {
          setIsExpanded(false);
        }
      }}
    >
      <AccordionItem value={displayName}>
        <AccordionTrigger
          aria-controls={`panel${index}-content`}
          id={`panel${index}-header`}
        >
          <img src={config.icon} alt="" className="w-5 h-5 mr-3 shrink-0" />
          <Text
            component="span"
            variant="body2"
            className="text-(--m3-primary) flex-1"
          >
            {displayName}
          </Text>
          {searchText.trim() && (
            <button
              onClick={handleBookmarkClick}
              className="ml-auto shrink-0 p-1 rounded-full hover:bg-(--m3-primary)/12 transition-colors duration-150"
              aria-label={isSaved ? t('vocabulary.saved') : t('vocabulary.save')}
              title={isSaved ? t('vocabulary.saved') : t('vocabulary.save')}
            >
              <Bookmark
                className="size-4"
                fill={isSaved ? 'currentColor' : 'none'}
                stroke="currentColor"
              />
            </button>
          )}
        </AccordionTrigger>
        <AccordionContent
          onClick={handleLinkClick}
        >
          <div
            className="relative overflow-hidden transition-[max-height] duration-300 ease-in-out"
            style={{ maxHeight: showExpandBtn ? (isExpanded ? contentHeight : MAX_HEIGHT) : 'none' }}
          >
            <div ref={contentRef} className="flex flex-col gap-2">
              {
                children.map((child, childIndex) => (
                  <div
                    key={'child' + childIndex}
                    className="rounded-lg bg-(--m3-surface-container)/90 px-3 py-2 text-(--m3-on-surface)"
                  >
                    {child}
                  </div>
                ))
              }
            </div>
            {showExpandBtn && !isExpanded && (
              <div
                className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none bg-linear-to-b from-transparent via-(--m3-surface-container)/60 to-(--m3-surface-container)"
                aria-hidden
              />
            )}
          </div>
          {showExpandBtn && (
            <div className="flex justify-center mt-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full px-5 py-1 text-xs font-medium text-(--m3-on-primary) bg-(--m3-primary) hover:bg-(--m3-primary)/40 hover:text-(--m3-on-primary)/40 transition-all duration-150"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? <ChevronsUp className="size-3.5 mr-1" />
                  : <ChevronsDown className="size-3.5 mr-1" />}
                {isExpanded ? t('dictItem.showLess') : t('dictItem.showMore')}
              </Button>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
