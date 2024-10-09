import { getLocalStore } from "../getters/get-local-store";
import { GITHUB_TASKS_STORAGE_KEY, TaskStorageItems } from "../github-types";
import { taskManager } from "../home";

export async function checkCacheIntegrityAndSyncTasks() {
  const _cachedTasks = getLocalStore(GITHUB_TASKS_STORAGE_KEY) as TaskStorageItems;

  // if there are no cached tasks, or timestamp is invalid, or tasks were cached over 15 minutes ago resync tasks
  if (!_cachedTasks || !_cachedTasks.timestamp || _cachedTasks.timestamp + 60 * 1000 * 15 <= Date.now()) {
    await taskManager.syncTasks();
  }
}
