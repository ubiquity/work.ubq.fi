import { getLocalStore } from "../getters/get-local-store";
import { GitHubIssue } from "../github-types";

export type GitHubIssueWithNewFlag = GitHubIssue & { isNew?: boolean };

export class PreviewToFullMapping {
  private _map: Map<number, GitHubIssue>;

  constructor() {
    this._map = new Map();
    const cachedIssuesFull = getLocalStore("gitHubIssuesFull") as GitHubIssue[];
    if (cachedIssuesFull) {
      cachedIssuesFull.forEach((issue) => this._map.set(issue.id, issue));
    }
  }

  getMapping() {
    return this._map;
  }
}
