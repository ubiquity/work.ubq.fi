import { GitHubIssue } from "../github-types";
import { taskManager } from "../home";

export function filterIssuesBySearch(filterText: string) {
  let searchText = filterText
  let orgFilter: string | undefined = undefined;
  let repoFilter: string | undefined = undefined;

  const pattern = /^(?:@(?<org>[^/\s]+)(?:\/(?<repo>[^\s]+))?|\/(?<repoOnly>[^\s]+))/;
  const match = searchText.match(pattern);

  if (match) {
    if (match.groups?.org) {
      orgFilter = match.groups.org;
      repoFilter = match.groups.repo; 
    } else if (match.groups?.repoOnly) {
      repoFilter = match.groups.repoOnly;
    }
    // Remove the matched filter segment from the beginning of the search text.
    searchText = searchText.slice(match[0].length).trim();
  }

  const searchResults = taskManager.issueSearcher.search(filterText, orgFilter, repoFilter);
  // Create the new GithubIssue[] array based on the ranking in the searchResults
  const sortedIssues = Array.from(searchResults.entries())
    .filter(([, result]) => result.score > 0)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([id]) => taskManager.getGitHubIssueById(id))
    .filter((issue): issue is GitHubIssue => issue !== undefined);

  return sortedIssues;
}
