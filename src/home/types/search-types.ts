export interface SearchResult {
  visible: boolean;
  score: number;
  matchDetails: {
    titleMatches: string[];
    bodyMatches: string[];
    labelMatches: string[];
    numberMatch: boolean;
    fuzzyMatches: Array<{
      original: string;
      matched: string;
      score: number;
    }>;
  };
}

export interface SearchWeights {
  title: number;
  body: number;
  fuzzy: number;
  meta: number;
}

export interface SearchConfig {
  fuzzySearchThreshold: number;
  exactMatchBonus: number;
  fuzzyMatchWeight: number;
}
