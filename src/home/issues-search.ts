import { GitHubIssue } from "./github-types.ts";
import { getLabelText } from "./sorting/label-utils.ts";
import { TaskManager } from "./task-manager.ts";
import { SearchResult, SearchWeights, SearchConfig } from "./types/search-types.ts";
import { SearchScorer } from "./search/search-scorer.ts";

export class IssueSearch {
  private readonly _weights: SearchWeights = {
    title: 0.375,
    body: 0.25,
    fuzzy: 0.25,
    meta: 0.125,
    repo: 0.1,
  };

  private readonly _config: SearchConfig = {
    fuzzySearchThreshold: 0.7,
    exactMatchBonus: 1.0,
    fuzzyMatchWeight: 0.7,
  };

  private readonly _searchScorer: SearchScorer;
  private _searchableIssues: Map<number, string> = new Map();

  constructor(private _taskManager: TaskManager) {
    this._searchScorer = new SearchScorer(this._config);
  }

  public async initializeIssues(issues: GitHubIssue[]) {
    this._searchableIssues.clear();
    issues.forEach((issue) => {
      const searchableContent = this._getSearchableContent(issue);
      this._searchableIssues.set(issue.id, searchableContent);
    });
  }

  public search(searchText: string, orgFilter?: string, repoFilter?: string): Map<number, SearchResult> {
    let filterText = searchText.toLowerCase().trim();
    const results = new Map<number, SearchResult>();
    const isFuzzySearchEnabled = filterText.startsWith("?");

    if (isFuzzySearchEnabled) {
      filterText = filterText.slice(1).trim();
    }

    if (!filterText) {
      if (!orgFilter && !repoFilter) {
        for (const id of this._searchableIssues.keys()) {
          results.set(id, this._createEmptyResult(true));
        }
        return results;
      }
      return this._handleEmptyFilterText(orgFilter, repoFilter);
    }

    const terms = this._preprocessSearchTerms(filterText);

    for (const id of this._searchableIssues.keys()) {
      const issue = this._taskManager.getGitHubIssueById(id);
      if (!issue) {
        results.set(id, this._createEmptyResult(false));
        continue;
      }

      const parts = issue.repository_url.split("/");
      const repoName = (parts[parts.length - 1] || "").toLowerCase();
      const orgName = (parts[parts.length - 2] || "").toLowerCase();

      if (orgFilter && repoFilter) {
        const isOrgMismatch = orgName !== orgFilter.toLowerCase();
        const isOrgPartialMismatch = !orgName.startsWith(orgFilter.toLowerCase());
        const isRepoPartialMismatch = !repoName.startsWith(repoFilter.toLowerCase());
        if (isOrgMismatch || isOrgPartialMismatch || isRepoPartialMismatch) {
          results.set(id, this._createEmptyResult(false));
          continue;
        }
      } else if (orgFilter || repoFilter) {
        const isOrgExact = !!orgFilter && orgName === orgFilter.toLowerCase();
        const isRepoExact = !!repoFilter && repoName === repoFilter.toLowerCase();
        const isOrgPartial = !!orgFilter && orgName.startsWith(orgFilter.toLowerCase());
        const isRepoPartial = !!repoFilter && repoName.startsWith(repoFilter.toLowerCase());

        if (!(isOrgExact || isRepoExact || isOrgPartial || isRepoPartial)) {
          results.set(id, this._createEmptyResult(false));
          continue;
        }
      }

      const result = this._calculateIssueRelevance(issue, terms, isFuzzySearchEnabled);
      results.set(id, result);
    }

    this._calculateNDCGScore(results);
    return results;
  }

  private _handleEmptyFilterText(orgFilter?: string, repoFilter?: string): Map<number, SearchResult> {
    const results = new Map<number, SearchResult>();

    if (orgFilter && repoFilter) {
      for (const id of this._searchableIssues.keys()) {
        const issue = this._taskManager.getGitHubIssueById(id);
        if (!issue) {
          results.set(id, this._createEmptyResult(false));
          continue;
        }

        const issueUrlParts = issue.repository_url.split("/");
        const repoName = (issueUrlParts[issueUrlParts.length - 1] || "").toLowerCase();
        const orgName = (issueUrlParts[issueUrlParts.length - 2] || "").toLowerCase();

        const of = (orgFilter || "").toLowerCase();
        const rf = (repoFilter || "").toLowerCase();
        const isMatch = orgName === of && repoName.startsWith(rf);
        results.set(id, this._createEmptyResult(isMatch));
      }
      return results;
    }

    let hasExact = false;

    for (const id of this._searchableIssues.keys()) {
      const issue = this._taskManager.getGitHubIssueById(id);
      if (!issue) {
        results.set(id, this._createEmptyResult(false));
        continue;
      }

      if (!orgFilter && !repoFilter) {
        results.set(id, this._createEmptyResult(true));
        continue;
      }

      const issueUrlParts = issue.repository_url.split("/");
      const repoName = (issueUrlParts[issueUrlParts.length - 1] || "").toLowerCase();
      const orgName = (issueUrlParts[issueUrlParts.length - 2] || "").toLowerCase();

      const isOrgMatch = !!orgFilter && orgName === orgFilter.toLowerCase();
      const isRepoMatch = !!repoFilter && repoName === repoFilter.toLowerCase();

      if (isOrgMatch || isRepoMatch) {
        results.set(id, this._createEmptyResult(true));
        hasExact = true;
      } else {
        results.set(id, this._createEmptyResult(false));
      }
    }

    if (!hasExact) {
      for (const id of this._searchableIssues.keys()) {
        const issue = this._taskManager.getGitHubIssueById(id);
        if (!issue) continue;

        const parts = issue.repository_url.split("/");
        const repoName = (parts[parts.length - 1] || "").toLowerCase();
        const orgName = (parts[parts.length - 2] || "").toLowerCase();

        if ((!!orgFilter && orgName.startsWith(orgFilter.toLowerCase())) || (!!repoFilter && repoName.startsWith(repoFilter.toLowerCase()))) {
          results.set(id, this._createEmptyResult(true));
        }
      }
    }

    return results;
  }

  private _calculateIssueRelevance(issue: GitHubIssue, searchTerms: string[], enableFuzzy: boolean): SearchResult {
    const matchDetails = {
      titleMatches: [] as string[],
      bodyMatches: [] as string[],
      labelMatches: [] as string[],
      numberMatch: false,
      repoMatch: false,
      fuzzyMatches: [] as Array<{
        original: string;
        matched: string;
        score: number;
      }>,
    };

    const searchableContent = this._searchableIssues.get(issue.id) || this._getSearchableContent(issue);

    // Calculate individual scores
    const scores = {
      title: this._searchScorer.calculateTitleScore(issue, searchTerms, matchDetails),
      body: this._searchScorer.calculateBodyScore(issue, searchTerms, matchDetails),
      fuzzy: enableFuzzy ? this._searchScorer.calculateFuzzyScore(searchableContent, searchTerms, matchDetails) : 0,
      meta: this._searchScorer.calculateMetaScore(issue, searchTerms, matchDetails),
      repo: this._searchScorer.calculateRepoScore(issue, searchTerms, matchDetails),
    };

    // Calculate weighted total score
    const totalScore = Object.entries(scores).reduce((total, [key, score]) => {
      return total + score * this._weights[key as keyof SearchWeights];
    }, 0);

    const isVisible = totalScore > 0 || matchDetails.numberMatch;

    return {
      visible: isVisible,
      score: isVisible ? totalScore : 0,
      matchDetails,
    };
  }

  private _calculateNDCGScore(results: Map<number, SearchResult>): number {
    const scores = Array.from(results.values())
      .filter((r) => r.visible)
      .map((r) => r.score)
      .sort((a, b) => b - a);

    if (scores.length === 0) return 0;

    const dcg = scores.reduce((sum, score, index) => {
      return sum + (Math.pow(2, score) - 1) / Math.log2(index + 2);
    }, 0);

    const idcg = [...scores]
      .sort((a, b) => b - a)
      .reduce((sum, score, index) => {
        return sum + (Math.pow(2, score) - 1) / Math.log2(index + 2);
      }, 0);

    return idcg === 0 ? 0 : dcg / idcg;
  }

  private _preprocessSearchTerms(searchText: string): string[] {
    return searchText
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => term.toLowerCase());
  }

  private _getSearchableContent(issue: GitHubIssue): string {
    // Remove URLs from the content
    function removeUrls(text: string): string {
      return text.replace(/(?:https?:\/\/|http?:\/\/|www\.)[^\s]+/g, "");
    }

    const title = issue.title;
    const body = removeUrls(issue.body || "");
    const labels = issue.labels?.map((l) => getLabelText(l)).join(" ") || "";

    return `${title} ${body} ${labels}`.toLowerCase();
  }

  private _createEmptyResult(visible: boolean = true): SearchResult {
    return {
      visible,
      score: visible ? 1 : 0,
      matchDetails: {
        titleMatches: [],
        bodyMatches: [],
        labelMatches: [],
        numberMatch: false,
        fuzzyMatches: [],
        repoMatch: false,
      },
    };
  }
}
