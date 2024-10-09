import { GitHubIssue } from "../github-types";
export const organizationImageCache = new Map<string, Blob | null>(); // this should be declared in image related script

export async function fetchIssues(): Promise<GitHubIssue[]> {
  const response = await fetch("https://raw.githubusercontent.com/ubiquity/devpool-directory/refs/heads/development/devpool-issues.json");
  const jsonData = await response.json();
  return jsonData;
}
