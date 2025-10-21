import type { RestEndpointMethodTypes } from "npm:@octokit/plugin-rest-endpoint-methods";

type GitHubUserResponse = RestEndpointMethodTypes["users"]["getAuthenticated"]["response"];
export type GitHubUser = GitHubUserResponse["data"];

export interface POSTRequestBody {
  authToken: string;
  referralCode?: string;
  timestamp?: number;
}

export interface ValidationResult {
  isValid: boolean;
  gitHubUser?: GitHubUser;
  referralCode?: string;
  authToken?: string;
  timestamp?: number;
}
