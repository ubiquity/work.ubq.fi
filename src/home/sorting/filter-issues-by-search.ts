import { GitHubIssue } from "../github-types";
import { taskManager } from "../home";

interface ParseResult {
  orgFilter: string | undefined;
  repoFilter: string | undefined;
  filteredSearchText: string;
}

export function filterIssuesBySearch(filterText: string) {
  const { repoFilter, orgFilter, filteredSearchText } = parseSearchQuery(filterText);
  console.error(repoFilter, orgFilter)
  const searchResults = taskManager.issueSearcher.search(filteredSearchText, orgFilter, repoFilter);
  // Create the new GithubIssue[] array based on the ranking in the searchResults
  const sortedIssues = Array.from(searchResults.entries())
    .filter(([, result]) => result.score > 0)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([id]) => taskManager.getGitHubIssueById(id))
    .filter((issue): issue is GitHubIssue => issue !== undefined);

  return sortedIssues;
}

export function parseSearchQuery(searchText: string): ParseResult {
  const input = searchText.trim();
  const lower = input.toLowerCase();

  if (!lower.startsWith("/") && !lower.startsWith("@")) {
    return {
      filteredSearchText: lower,
      orgFilter: undefined,
      repoFilter: undefined,
    };
  }
  
  const pattern = /^(?:@([^/\s]+)(?:\/([^/\s]+))?|\/([^/\s]+))/;
  const match = pattern.exec(lower);

  // If regex fails (i.e. it was just "/" or just "@"), return empty search
  if (!match) {
    return {
      orgFilter: undefined,
      repoFilter: undefined,
      filteredSearchText: "",
    };
  }

  const orgFilter = match[1];
  const repoFilter = match[2] ?? match[3];
  const rest = lower.slice(match[0].length).trim();

  return {
    orgFilter,
    repoFilter,
    filteredSearchText: rest,
  };
}
