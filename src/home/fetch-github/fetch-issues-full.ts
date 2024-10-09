import { GitHubIssue } from "../github-types";
export const organizationImageCache = new Map<string, Blob | null>(); // this should be declared in image related script

// Fetches the issues from `devpool-issues.json` file in the `development` branch of the `devpool-directory` repo
// https://github.com/ubiquity/devpool-directory/blob/development/devpool-issues.json

export async function fetchIssues(): Promise<GitHubIssue[]> {
  const response = await fetch("https://raw.githubusercontent.com/ubiquity/devpool-directory/refs/heads/development/devpool-issues.json");
  const jsonData = await response.json();
  return jsonData;
}
