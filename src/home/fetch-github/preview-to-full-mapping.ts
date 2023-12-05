import { GitHubIssue } from "../github-types";

export type GitHubIssueWithNewFlag = GitHubIssue & { isNew?: boolean };

export class PreviewToFullMapping {
  private _map: Map<number, GitHubIssue>;

  constructor() {
    try {
      this._map = new Map(JSON.parse(localStorage.getItem("gitHubIssuesFull") || "[]")) as Map<number, GitHubIssue>;
    } catch (e) {
      this._map = new Map();
    }
  }

  getMapping() {
    return this._map;
  }
}
