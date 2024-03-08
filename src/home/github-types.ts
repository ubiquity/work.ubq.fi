import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { TaskNoState } from "./fetch-github/preview-to-full-mapping";

export interface AvatarCache {
  [organization: string]: string | null;
}

export const GITHUB_TASKS_STORAGE_KEY = "gitHubTasks";

export type TaskStorageItems = {
  timestamp: number;
  tasks: TaskNoState[];
  loggedIn: boolean;
};

export type GitHubUserResponse = RestEndpointMethodTypes["users"]["getByUsername"]["response"];
export type GitHubUser = GitHubUserResponse["data"];
export type GitHubIssue = RestEndpointMethodTypes["issues"]["get"]["response"]["data"];
