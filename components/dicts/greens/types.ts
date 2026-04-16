export interface GreensCandidate {
    href: string;
    title: string;
    pos?: string;
    homonym?: string;
    summary: string;
    moreInfo?: string;
    isSubentry: boolean;
}

export interface GreensSearchResult {
    query: string;
    totalResults: number;
    candidates: GreensCandidate[];
}

export interface GreensDetailResult {
    html: string;
    sourceUrl: string;
    baseUrl: string;
    isSubentry: boolean;
}