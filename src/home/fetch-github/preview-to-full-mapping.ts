import { GitHubIssue } from "../github-types";

export type TaskNoState = {
  preview: GitHubIssue;
  full: null | GitHubIssue;
};
