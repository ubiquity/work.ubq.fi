import { fetchAvatars } from "./fetch-github/fetch-avatar";
import { fetchIssues } from "./fetch-github/fetch-issues-full";
import { getGitHubAccessToken } from "./getters/get-github-access-token";
import { getLocalStore, setLocalStore } from "./getters/get-local-store";
import { GITHUB_TASKS_STORAGE_KEY, GitHubIssue, TaskStorageItems } from "./github-types";
import { initOctokit } from "./rendering/github-notifications/init-octokit";

export class TaskManager {
  private _tasks: GitHubIssue[];
  private _container: HTMLDivElement;
  private _octokit = initOctokit();

  constructor(container: HTMLDivElement) {
    this._container = container;
    this._tasks = this._readFromStorage()?.tasks || [];
  }

  public async syncTasks() {
    const issues = await fetchIssues(await this._octokit);
    this._tasks = issues;
    void this._writeToStorage(issues);
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

  private _readFromStorage() {
    return getLocalStore(GITHUB_TASKS_STORAGE_KEY) as TaskStorageItems;
  }
}
