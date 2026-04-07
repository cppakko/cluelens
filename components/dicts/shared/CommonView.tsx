import { forwardRef, useMemo } from 'react';

import { sanitizeHtml } from '@/utils/sanitizeHtml';

const TranslateView = ({ result }: { result: string[] }) => {
  return (
    <div className="p-2.5 text-left">
      {result.map((text, index) => (
        <div key={index} className="text-left text-sm leading-relaxed whitespace-pre-line text-(--m3-on-surface)">
          {text}
        </div>
      ))}
    </div>
  );
};

type HtmlBlockProps = {
  html: string;
  className?: string;
  baseUrl?: string;
  hideIfEmpty?: boolean;
};

export const HtmlBlock = forwardRef<HTMLDivElement, HtmlBlockProps>(({ html, className, baseUrl, hideIfEmpty = false }, ref) => {
  const sanitizedHtml = useMemo(() => sanitizeHtml(html, baseUrl), [baseUrl, html]);
  const combinedClassName = className ? `${className} text-left` : 'text-left';

  if (hideIfEmpty && !sanitizedHtml) {
    return null;
  }

  return <div ref={ref} className={combinedClassName} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
});

HtmlBlock.displayName = 'ClueLens-HtmlBlock';

export default TranslateView;
