import { TaskNoState } from "./fetch-github/preview-to-full-mapping";
export interface GitHubUser {
  avatar_url: string;
  bio: string;
  blog: string;
  company: string;
  created_at: string;
  email: string | null;
  events_url: string;
  followers_url: string;
  followers: number;
  following_url: string;
  following: number;
  gists_url: string;
  gravatar_id: string;
  hireable: boolean | null;
  html_url: string;
  id: number;
  location: string;
  login: string;
  name: string;
  node_id: string;
  organizations_url: string;
  public_gists: number;
  public_repos: number;
  received_events_url: string;
  repos_url: string;
  site_admin: boolean;
  starred_url: string;
  subscriptions_url: string;
  twitter_username: string;
  type: string;
  updated_at: string;
  url: string;
}
export interface GitHubUserResponse {
  status: number;
  url: string;
  headers: {
    "cache-control": string;
    "content-type": string;
    etag: string;
    "last-modified": string;
    "x-accepted-oauth-scopes": string;
    "x-github-media-type": string;
    "x-github-request-id": string;
    "x-oauth-scopes": string;
    "x-ratelimit-limit": string;
    "x-ratelimit-remaining": string;
    "x-ratelimit-reset": string;
    "x-ratelimit-resource": string;
    "x-ratelimit-used": string;
  };
  data: GitHubUser;
}

interface GitHubLabel {
  id: number;
  node_id: string;
  url: string;
  name: string;
  description: string;
  color: string;
  default: boolean;
}

interface GitHubMilestone {
  url: string;
  html_url: string;
  labels_url: string;
  id: number;
  node_id: string;
  number: number;
  state: string;
  title: string;
  description: string;
  creator: GitHubUser;
  open_issues: number;
  closed_issues: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  due_on: string | null;
}

export interface GitHubIssue {
  id: number;
  node_id: string;
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  number: number;
  state: string;
  title: string;
  body: string;
  user: GitHubUser;
  labels: GitHubLabel[];
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  milestone: GitHubMilestone | null;
  locked: boolean;
  active_lock_reason: string | null;
  comments: number;
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  };
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  closed_by?: GitHubUser;
}

export interface AvatarCache {
  [organization: string]: string | null;
}

export const GITHUB_TASKS_STORAGE_KEY = "gitHubTasks";

// supabase key should be dynamic incase of change and testing
const supabaseUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.split(".")[0] : "";
export const SUPABASE_STORAGE_KEY = supabaseUrl.substring(supabaseUrl.lastIndexOf("/") + 1);

export type TaskStorageItems = {
  timestamp: number;
  tasks: TaskNoState[];
};
