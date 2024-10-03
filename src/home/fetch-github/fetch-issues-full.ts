import { GitHubIssue } from "../github-types";
export const organizationImageCache = new Map<string, Blob | null>();

export async function fetchIssuesFull(): Promise<GitHubIssue[]> {
  const response = await fetch("https://raw.githubusercontent.com/ubiquity/devpool-directory/refs/heads/development/devpool-issues.json");
  const jsonData = await response.json();
  return jsonData;
}
