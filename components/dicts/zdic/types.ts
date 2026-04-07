export interface ZdicSection {
  title: string;
  html: string;
}

export interface ZdicResult {
  word: string;
  /** .zipic.mlt 字形笔顺动画元素 */
  entryImgHtml?: string;
  sections: ZdicSection[];
  sourceUrl: string;
  baseUrl: string;
}
