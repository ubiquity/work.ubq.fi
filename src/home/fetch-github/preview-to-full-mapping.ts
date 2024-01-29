import { GitHubIssue } from "../github-types";

export type TaskNoState = {
  preview: GitHubIssue;
  full: null | GitHubIssue;
};

export type TaskNoFull = {
  preview: GitHubIssue;
  full: null;
  isNew: boolean;
  isModified: boolean;
};

export type TaskMaybeFull = {
  preview: GitHubIssue;
  full: null | GitHubIssue;
  isNew: boolean;
  isModified: boolean;
};

export type TaskWithFull = {
  preview: GitHubIssue;
  full: GitHubIssue;
  isNew: boolean;
  isModified: boolean;
};
