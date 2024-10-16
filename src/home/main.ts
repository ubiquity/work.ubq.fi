import { authentication } from "./authentication";
import { displayGitHubIssues } from "./fetch-github/fetch-and-display-previews";
import { notificationManager } from "./home";
import { readyToolbar } from "./ready-toolbar";

export default async function main() {
  void authentication();
  void readyToolbar();
  // await taskManager.syncTasks(); // Sync tasks on load
  // notificationManager.loadNotificationsFromStorage();
  // Sync notifications on load
  void notificationManager.syncNotifications();
  void displayGitHubIssues();
}
