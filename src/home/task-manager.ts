import { fetchAvatars } from "./fetch-github/fetch-avatar.ts";
import { getGitHubAccessToken } from "./getters/get-github-access-token.ts";
import { getIssuesFromCache } from "./getters/get-indexed-db.ts";
import { setLocalStore } from "./getters/get-local-store.ts";
import { GITHUB_TASKS_STORAGE_KEY, GitHubIssue } from "./github-types.ts";
import { IssueSearch } from "./issues-search.ts";

export class TaskManager {
  private _tasks: GitHubIssue[] = [];
  private _container: HTMLDivElement;
  public issueSearcher: IssueSearch;
  constructor(container: HTMLDivElement) {
    this._container = container;
    this.issueSearcher = new IssueSearch(this);
  }

  // Syncs tasks by getting issues from cache, writing them to storage and then fetching avatars
  public async syncTasks() {
    const issues = await getIssuesFromCache();

    this._tasks = issues;
    void this._writeToStorage(issues);

    // Initialize issues for search operations
    await this.issueSearcher.initializeIssues(issues);

    await fetchAvatars();
  }

  public getTasks() {
    return this._tasks;
  }

  public getContainer() {
    return this._container;
  }

  public getGitHubIssueById(id: number): GitHubIssue | undefined {
    return this._tasks.find((task) => task.id === id);
  }

  private async _writeToStorage(tasks: GitHubIssue[]) {
    const _accessToken = await getGitHubAccessToken();
    setLocalStore(GITHUB_TASKS_STORAGE_KEY, {
      timestamp: Date.now(),
      tasks: tasks,
      loggedIn: _accessToken !== null,
    });
  }
}
