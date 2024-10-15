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
export type GitHubIssue = RestEndpointMethodTypes["issues"]["get"]["response"]["data"];
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

export const GITHUB_NOTIFICATIONS_STORAGE_KEY = "gitHubNotifications";

export type NotificationStorageItems = {
  timestamp: number; // in milliseconds
  notifications: GitHubNotification[];
  loggedIn: boolean;
};

export type GitHubNotification = RestEndpointMethodTypes["activity"]["listNotificationsForAuthenticatedUser"]["response"]["data"][0];
