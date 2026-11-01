/* global setInterval, clearInterval */
const defaultApi = require("./tasks.cjs");

// Optional host/API/clock arguments keep integration tests independent of a running IDE.
/** @param {{setInterval: (callback: () => Promise<void>, delay: number) => any, clearInterval: (handle: any) => void}} clock */
async function activate(context, vscode = require("vscode"), api = defaultApi, clock = { setInterval, clearInterval }) {
  let tasks = [];
  let watched = [];
  for (const value of context.globalState.get("workUbq.watchedTasks", [])) {
    try {
      watched.push(api.parseTask(value));
    } catch {
      // Ignore invalid entries left by an older extension version.
    }
  }
  let refreshPromise;
  let syncPromise;
  let timer;
  let isDisposed = false;
  const events = new vscode.EventEmitter();
  const output = vscode.window.createOutputChannel("work.ubq.fi");

  function allTasks() {
    const merged = new Map(tasks.map((task) => [api.taskKey(task), task]));
    for (const task of watched) merged.set(api.taskKey(task), task);
    return [...merged.values()];
  }

  function isWatched(task) {
    return watched.some((item) => api.taskKey(item) === api.taskKey(task));
  }

  const tree = vscode.window.createTreeView("workUbq.tasks", {
    treeDataProvider: {
      onDidChangeTreeData: events.event,
      getChildren: (element) => (element ? [] : allTasks()),
      getTreeItem(task) {
        const item = new vscode.TreeItem(task.title, vscode.TreeItemCollapsibleState.None);
        item.description = `${api.taskKey(task)} · ${task.state}${task.assigned ? " · assigned" : ""}${isWatched(task) ? " · watching" : ""}`;
        item.tooltip = `${task.title}\n${api.issueUrl(task)}`;
        item.contextValue = isWatched(task) ? "watchedTask" : "task";
        item.iconPath = new vscode.ThemeIcon(task.state === "closed" ? "issue-closed" : "issues");
        item.command = { command: "workUbq.openIssue", title: "Open Issue", arguments: [task] };
        return item;
      },
    },
  });

  async function run(action) {
    try {
      return await action();
    } catch (error) {
      if (!isDisposed) await vscode.window.showErrorMessage(`work.ubq.fi: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function token(createIfNone = false) {
    const session = await vscode.authentication.getSession("github", ["public_repo"], createIfNone ? { createIfNone: true } : { silent: true });
    return session?.accessToken || "";
  }

  async function saveWatched() {
    await context.globalState.update("workUbq.watchedTasks", watched);
    if (!isDisposed) events.fire();
  }

  async function remember(task) {
    watched = watched.filter((item) => api.taskKey(item) !== api.taskKey(task));
    watched.push(task);
    await saveWatched();
  }

  async function pick(task, choices = allTasks()) {
    if (task) return api.parseTask(task);
    const selected = await vscode.window.showQuickPick(
      choices.map((item) => ({ label: item.title, description: api.taskKey(item), detail: `${item.state}${item.assigned ? " · assigned" : ""}`, task: item })),
      { placeHolder: "Find a work.ubq.fi task", matchOnDescription: true, matchOnDetail: true }
    );
    return selected?.task;
  }

  async function open(task) {
    await vscode.env.openExternal(vscode.Uri.parse(api.issueUrl(task)));
  }

  async function notify(task) {
    const action = await vscode.window.showInformationMessage(`work.ubq.fi: ${api.taskKey(task)} updated (${task.state}) — ${task.title}`, "Open Issue");
    if (!isDisposed && action === "Open Issue") await open(task);
  }

  function syncWatched(shouldNotify) {
    if (syncPromise) return syncPromise;
    syncPromise = (async () => {
      if (isDisposed || !watched.length) return;
      const snapshot = [...watched];
      const accessToken = await token();
      if (isDisposed) return;
      const latest = await Promise.all(snapshot.map((task) => api.fetchTask(task, accessToken)));
      if (isDisposed) return;
      const changes = [];
      // A task removed/re-watched while requests were in flight must not be resurrected.
      watched = watched.map((task) => {
        const index = snapshot.indexOf(task);
        if (index < 0) return task;
        const next = latest[index];
        if (shouldNotify && api.hasTaskChanged(task, next)) {
          changes.push(next);
        }
        return next;
      });
      await saveWatched();
      if (isDisposed || !vscode.workspace.getConfiguration("workUbq.notifications").get("enabled", false)) return;
      for (const task of changes) {
        if (watched.includes(task)) void notify(task).catch((error) => output.appendLine(String(error)));
      }
    })().finally(() => {
      syncPromise = undefined;
    });
    return syncPromise;
  }

  function refresh() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      const next = await api.loadTasks();
      await syncWatched(false);
      if (isDisposed) return;
      tasks = next;
      tree.message = next.length || watched.length ? undefined : "No partner tasks available.";
      events.fire();
    })().finally(() => {
      refreshPromise = undefined;
    });
    return refreshPromise;
  }

  async function changeState(task, state) {
    const selected = await pick(task);
    if (!selected) return;
    const title = state === "closed" ? "Close Issue" : "Reopen Issue";
    const confirmation = await vscode.window.showWarningMessage(`${title}: ${api.taskKey(selected)} on GitHub?`, { modal: true }, title);
    if (confirmation !== title) return;
    const updated = await api.setTaskState(selected, state, await token(true));
    tasks = tasks.filter((item) => api.taskKey(item) !== api.taskKey(updated));
    await remember(updated);
  }

  function command(name, action) {
    context.subscriptions.push(vscode.commands.registerCommand(`workUbq.${name}`, (task) => run(() => action(task))));
  }
  command("refresh", refresh);
  command("findTask", async () => {
    const task = await pick();
    if (task) await open(task);
  });
  command("openIssue", async (value) => {
    const task = await pick(value);
    if (task) await open(task);
  });
  command("setupIssue", async (value) => {
    const task = await pick(value);
    if (task) await vscode.commands.executeCommand("git.clone", api.repositoryUrl(task));
  });
  command("watchIssue", async (value) => {
    const task = await pick(value);
    if (task) await remember(await api.fetchTask(task, await token()));
  });
  command("unwatchIssue", async (value) => {
    const task = await pick(value, watched);
    if (!task) return;
    watched = watched.filter((item) => api.taskKey(item) !== api.taskKey(task));
    await saveWatched();
  });
  command("closeIssue", (task) => changeState(task, "closed"));
  command("reopenIssue", (task) => changeState(task, "open"));

  function configurePolling() {
    if (timer) clock.clearInterval(timer);
    timer = undefined;
    const config = vscode.workspace.getConfiguration("workUbq.notifications");
    if (!config.get("enabled", false)) return;
    const configuredMinutes = config.get("intervalMinutes", 5);
    const minutes = Number.isFinite(configuredMinutes) ? Math.max(5, configuredMinutes) : 5;
    timer = clock.setInterval(
      () => syncWatched(true).catch((error) => output.appendLine(`Update check failed: ${String(error)}`)),
      minutes * 60000
    );
  }

  context.subscriptions.push(
    events,
    output,
    tree,
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("workUbq.notifications")) configurePolling();
    }),
    {
      dispose() {
        isDisposed = true;
        if (timer) clock.clearInterval(timer);
      },
    }
  );
  configurePolling();
  await run(refresh);
}

module.exports = { activate };
