import { fetchNotifications } from "./fetch-github/fetch-notifications";
import { getGitHubAccessToken } from "./getters/get-github-access-token";
import { getLocalStore, setLocalStore } from "./getters/get-local-store";
import { GITHUB_NOTIFICATIONS_STORAGE_KEY, GitHubNotification, NotificationStorageItems } from "./github-types";
import { initOctokit } from "./rendering/github-notifications/init-octokit";

export class NotificationManager {
  private _notifications: GitHubNotification[] = [];
  private _container: HTMLDivElement;
  private _octokit = initOctokit();

  constructor(container: HTMLDivElement) {
    this._container = container;
  }

  public async syncNotifications(): Promise<GitHubNotification[]> {
    const accessToken = await getGitHubAccessToken();
    if (!accessToken) {
      throw new Error("Can't access your notifications because you are not logged in.");
    }
    const notifications = await fetchNotifications(await this._octokit);
    this._notifications = notifications;
    await this._writeToStorage(notifications);
    return notifications;
  }

  public getNotifications(): GitHubNotification[] {
    return this._notifications;
  }

  public getContainer(): HTMLDivElement {
    return this._container;
  }

  public getNotificationById(id: string): GitHubNotification | undefined {
    return this._notifications.find((notification) => notification.id === id);
  }

  public loadNotificationsFromStorage() {
    const storedData = getLocalStore<NotificationStorageItems>(GITHUB_NOTIFICATIONS_STORAGE_KEY);
    if (storedData) {
      this._notifications = storedData.notifications;
      return storedData;
    }
    return null;
  }

  private async _writeToStorage(notifications: GitHubNotification[]): Promise<void> {
    const accessToken = await getGitHubAccessToken();
    setLocalStore<NotificationStorageItems>(GITHUB_NOTIFICATIONS_STORAGE_KEY, {
      timestamp: Date.now(),
      notifications: notifications,
      loggedIn: accessToken !== null,
    });
  }
}
