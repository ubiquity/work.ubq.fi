import { fetchAvatars } from "./fetch-github/fetch-and-display-previews";
import { fetchIssuesFull } from "./fetch-github/fetch-issues-full";
import { getGitHubAccessToken } from "./getters/get-github-access-token";
import { setLocalStore } from "./getters/get-local-store";
import { GITHUB_TASKS_STORAGE_KEY, GitHubIssue } from "./github-types";

export class TaskManager {
  private _tasks: GitHubIssue[] = [];
  private _container: HTMLDivElement;
  constructor(container: HTMLDivElement) {
    this._container = container;
  }

  // Syncs tasks by fetching issues, writing them to storage and then fetching avatars
  public async syncTasks() {
    const issues = await fetchIssuesFull();

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
}
