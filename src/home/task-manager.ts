import { TaskMaybeFull } from "./fetch-github/preview-to-full-mapping";
import { setLocalStore } from "./getters/get-local-store";

export class TaskManager {
  private _tasks: TaskMaybeFull[] = [];
  private _container: HTMLDivElement;
  constructor(container: HTMLDivElement) {
    this._container = container;
  }

  public syncTasks(incoming: TaskMaybeFull[]) {
    const incomingIds = new Set(incoming.map((task) => task.preview.id));
    const taskMap = new Map<number, TaskMaybeFull>();

    for (const task of incoming) {
      const id = task.full?.id || task.preview.id;
      taskMap.set(id, task);
    }

    for (const task of this._tasks) {
      const id = task.full?.id || task.preview.id;
      if (!incomingIds.has(id)) {
        continue;
      }
      if (!taskMap.has(id)) {
        taskMap.set(id, task);
      } else {
        const existingTask = taskMap.get(id);
        if (existingTask && !existingTask.full && task.full) {
          taskMap.set(id, task);
        }
      }
    }

    this._tasks = Array.from(taskMap.values());
  }

  public getTasks() {
    return this._tasks;
  }

  public getTaskByPreviewId(id: number) {
    const task = this._tasks.find((task) => task.preview.id === id);
    if (!task) throw new Error(`No task found for preview id ${id}`);
    return task;
  }

  public getContainer() {
    return this._container;
  }

  public writeToStorage() {
    setLocalStore("gitHubTasks", this._tasks);
  }
}
