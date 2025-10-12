import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

export interface AvatarCache {
  [organization: string]: string | null;
}

export const GITHUB_TASKS_STORAGE_KEY = "gitHubTasks";

export type TaskStorageItems = {
  timestamp: number; // in milliseconds
  tasks: GitHubIssue[];
  loggedIn: boolean;
};

export type GitHubUserResponse = RestEndpointMethodTypes["users"]["getByUsername"]["response"];
export type GitHubUser = GitHubUserResponse["data"];

// Minimal GitHub issue shape consumed by the UI
export interface GitHubIssue {
  id: number; // internal stable id (derived)
  node_id: string;
  number: number;
  title: string;
  body?: string | null;
  labels: GitHubLabel[];
  repository_url: string; // e.g., https://github.com/{owner}/{repo}
  html_url: string; // issue URL
  created_at: string;
  updated_at: string;
  assignee?: unknown | null;
  assignees?: unknown[];
}
export type GitHubLabel =
  | {
      id?: number;
      node_id?: string;
      url?: string;
      name: string;
      description?: string | null;
      color?: string | null;
      default?: boolean;
    }
  | string;
