import { fetchNotifications } from "./fetch-github/fetch-notifications";
import { getGitHubAccessToken } from "./getters/get-github-access-token";
import { setLocalStore, getLocalStore } from "./getters/get-local-store";
import { GITHUB_NOTIFICATIONS_STORAGE_KEY, GitHubNotification, NotificationStorageItems } from "./github-types";

export class NotificationManager {
  private _notifications: GitHubNotification[] = [];
  private _container: HTMLDivElement;

  constructor(container: HTMLDivElement) {
    this._container = container;
  }

  public async syncNotifications(): Promise<void> {
    const notifications = await fetchNotifications();

    this._notifications = notifications;
    await this._writeToStorage(notifications);
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

  public async loadNotificationsFromStorage(): Promise<void> {
    const storedData = getLocalStore<NotificationStorageItems>(GITHUB_NOTIFICATIONS_STORAGE_KEY);
    if (storedData && storedData.loggedIn) {
      this._notifications = storedData.notifications;
    }
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