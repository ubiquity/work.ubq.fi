import { TaskMaybeFull } from "./fetch-github/preview-to-full-mapping";
import { setLocalStore } from "./getters/get-local-store";

export class TaskManager {
  private _tasks: TaskMaybeFull[] = [];
  private _container: HTMLDivElement;
  constructor(container: HTMLDivElement) {
    this._container = container;
  }

  public addTasks(tasks: TaskMaybeFull[]) {
    // Combine old and new tasks
    const combinedTasks = [...this._tasks, ...tasks];

    // Create a new Map where each task is stored with its 'full.id' or 'preview.id' as the key
    const taskMap = new Map<number, TaskMaybeFull>();

    // Iterate over the sorted tasks
    for (const task of combinedTasks) {
      const id = task.full?.id || task.preview.id;

      // If the taskMap already has the id and the existing task has a 'full' property, skip this task
      if (taskMap.has(id) && taskMap.get(id)?.full) continue;

      // Otherwise, add or update the task in the taskMap
      taskMap.set(id, task);
    }

    // Update _tasks with the values from the Map
    this._tasks = Array.from(taskMap.values());
    this._writeToStorage();
  }

  public getTasks() {
    return this._tasks;
  }

  public getTaskByPreviewId(id: number) {
    const task = this._tasks.find((task) => task.preview.id === id);
    if (!task) throw new Error(`No task found for preview id ${id}`);
    return task;
  }

  public getTaskByFullId(id: number) {
    return this._tasks.find((task) => task.full?.id === id);
  }

  public getContainer() {
    return this._container;
  }

  private _writeToStorage() {
    setLocalStore("gitHubTasks", this._tasks);
  }
}
