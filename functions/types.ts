import { GitHubUser } from "../src/home/github-types.ts";

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
