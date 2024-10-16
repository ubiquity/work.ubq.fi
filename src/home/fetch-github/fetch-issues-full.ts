import { Octokit } from '@octokit/rest';
import { GitHubIssue } from "../github-types";
export const organizationImageCache = new Map<string, Blob | null>(); // this should be declared in image related script

// Fetches the issues from `devpool-issues.json` file in the `development` branch of the `devpool-directory` repo
// https://github.com/ubiquity/devpool-directory/blob/development/devpool-issues.json

export async function fetchIssues(octokit: Octokit): Promise<GitHubIssue[]> {
  const { data } = await octokit.repos.getContent({
    owner: 'ubiquity',
    repo: 'devpool-directory',
    path: 'devpool-issues.json',
    ref: 'development'
  });

  if (!('content' in data)) {
    throw new Error('Content not found in the response');
  }

  const decodedContent = atob(data.content);
  const jsonData = JSON.parse(decodedContent);
  return jsonData;
}
