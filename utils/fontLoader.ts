import { FONT_CDN_URLS, type FontCDNProvider } from '@/utils/storage';

const LINK_ID = 'cluelens-custom-font';

function buildFontURL(fontFamily: string, cdnProvider: FontCDNProvider): string {
  const base = FONT_CDN_URLS[cdnProvider] ?? FONT_CDN_URLS['google'];
  const family = encodeURIComponent(fontFamily).replace(/%20/g, '+');
  return `${base}/css2?family=${family}:wght@400;500;700&display=swap`;
}

export function loadFont(
  fontFamily: string,
  cdnProvider: FontCDNProvider,
  doc: Document = document,
): string {
  const existing = doc.getElementById(LINK_ID);
  if (existing) existing.remove();

  const link = doc.createElement('link');
  link.id = LINK_ID;
  link.rel = 'stylesheet';
  link.href = buildFontURL(fontFamily, cdnProvider);
  doc.head.appendChild(link);

  return `"${fontFamily}", sans-serif`;
}

export function unloadFont(doc: Document = document): void {
  doc.getElementById(LINK_ID)?.remove();
}
