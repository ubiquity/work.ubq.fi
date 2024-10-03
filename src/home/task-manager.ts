import { getGitHubAccessToken } from "./getters/get-github-access-token";
import { setLocalStore } from "./getters/get-local-store";
import { GITHUB_TASKS_STORAGE_KEY, GitHubIssue } from "./github-types";

export class TaskManager {
  private _tasks: GitHubIssue[] = [];
  private _container: HTMLDivElement;
  constructor(container: HTMLDivElement) {
    this._container = container;
  }

  public syncTasks(incoming: GitHubIssue[]) {
    this._tasks = incoming;
    void this._writeToStorage(incoming);
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
