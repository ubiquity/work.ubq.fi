import { GitHubIssue } from "../github-types";
import { SearchConfig, SearchResult } from "../types/search-types";
import { StringSimilarity } from "./string-similarity";

export class SearchScorer {
  constructor(private _config: SearchConfig) {}

  public calculateTitleScore(issue: GitHubIssue, searchTerms: string[], matchDetails: SearchResult["matchDetails"]): number {
    let score = 0;
    const title = issue.title.toLowerCase();
    const words = title.split(/\s+/);

    searchTerms.forEach((term) => {
      if (title.includes(term)) {
        matchDetails.titleMatches.push(term);
        score += this._config.exactMatchBonus;

        // Apply exponential boost for word beginnings
        words.forEach((word) => {
          if (word.startsWith(term)) {
            // e^(-x) where x is the position of the match relative to word length
            const positionBoost = Math.exp(-term.length / word.length);
            score += positionBoost;
          }
        });
      }
    });

    if (searchTerms.length > 1 && title.includes(searchTerms.join(" "))) {
      score += 1;
    }
    return Math.min(score, 3);
  }

  public calculateBodyScore(issue: GitHubIssue, searchTerms: string[], matchDetails: SearchResult["matchDetails"]): number {
    let score = 0;
    const body = (issue.body || "").toLowerCase();
    const words = body.split(/\s+/);

    searchTerms.forEach((term) => {
      let termScore = 0;
      words.forEach((word) => {
        if (word.startsWith(term)) {
          // Apply exponential boost for word beginnings
          const positionBoost = Math.exp(-term.length / word.length);
          termScore += positionBoost;
        }
      });

      if (termScore > 0) {
        matchDetails.bodyMatches.push(term);
        score += Math.min(termScore, 1);
      }

      const codeBlockMatches = body.match(/```[\s\S]*?```/g) || [];
      codeBlockMatches.forEach((block) => {
        if (block.toLowerCase().includes(term)) {
          score += 0.5;
        }
      });
    });
    return Math.min(score, 2);
  }

  public calculateMetaScore(issue: GitHubIssue, searchTerms: string[], matchDetails: SearchResult["matchDetails"]): number {
    let score = 0;
    const numberTerm = searchTerms.find((term) => /^\d+$/.test(term));
    if (numberTerm && issue.number.toString() === numberTerm) {
      matchDetails.numberMatch = true;
      score += 2;
    }
    if (issue.labels) {
      searchTerms.forEach((term) => {
        issue.labels?.forEach((label) => {
          if (typeof label === "object" && label.name) {
            const labelName = label.name.toLowerCase();
            if (labelName.includes(term)) {
              matchDetails.labelMatches.push(label.name);
              // Apply exponential boost for label matches at word start
              if (labelName.startsWith(term)) {
                score += 0.8;
              } else {
                score += 0.5;
              }
            }
          }
        });
      });
    }

    return score;
  }

  public calculateRepoScore(issue: GitHubIssue, searchTerms: string[], matchDetails: SearchResult["matchDetails"]): number {
    let score = 0;
    if (issue.repository_url) {
      const repoName = issue.repository_url.split("/").pop()?.toLowerCase() || "";
      const orgName = issue.repository_url.split("/").slice(-2)[0].toLowerCase() || "";
      searchTerms.forEach((term) => {
        if (repoName.startsWith(term.toLowerCase())) {
          matchDetails.repoMatch = true;
          score += term.length / repoName.length;
        }
        if (orgName.startsWith(term.toLowerCase())) {
          score += term.length / orgName.length;
        }
      });
    }
    return score;
  }

  public calculateFuzzyScore(content: string, searchTerms: string[], matchDetails: SearchResult["matchDetails"]): number {
    let score = 0;
    const contentWords = this._tokenizeContent(content);

    searchTerms.forEach((searchTerm) => {
      let bestMatch = {
        word: "",
        score: 0,
        isWordStart: false,
      };

      contentWords.forEach((word) => {
        const similarity = StringSimilarity.calculate(searchTerm, word);
        const isWordStart = word.startsWith(searchTerm);

        // Calculate position-based boost
        const positionBoost = isWordStart ? Math.exp(-searchTerm.length / word.length) : 0;
        const adjustedScore = similarity + positionBoost;

        if (adjustedScore > this._config.fuzzySearchThreshold && adjustedScore > bestMatch.score) {
          bestMatch = {
            word,
            score: adjustedScore,
            isWordStart,
          };
        }
      });

      if (bestMatch.score > 0) {
        matchDetails.fuzzyMatches.push({
          original: searchTerm,
          matched: bestMatch.word,
          score: bestMatch.score,
        });

        // Apply exponential weight for word-start matches
        const finalScore = bestMatch.isWordStart ? bestMatch.score * Math.exp(this._config.fuzzyMatchWeight) : bestMatch.score * this._config.fuzzyMatchWeight;

        score += finalScore;
      }
    });

    return Math.min(score, 2);
  }

  private _tokenizeContent(content: string): string[] {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2);
  }
}
