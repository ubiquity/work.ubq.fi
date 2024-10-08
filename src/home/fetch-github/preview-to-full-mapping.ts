import { GitHubIssue } from "../github-types";

// this is not used
export type TaskNoState = {
  preview: GitHubIssue;
  full: null | GitHubIssue;
};
