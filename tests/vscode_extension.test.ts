/// <reference lib="deno.ns" />
import { activate } from "../vscode-extension/extension.cjs";
import * as api from "../vscode-extension/tasks.cjs";

type Task = ReturnType<typeof api.parseTask>;

function assert(value: unknown, message = "Assertion failed"): asserts value {
  if (!value) throw new Error(message);
}

function equal(actual: unknown, expected: unknown) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

async function rejects(action: () => unknown, message: string) {
  try {
    await action();
  } catch (error) {
    assert(error instanceof Error && error.message.includes(message), String(error));
    return;
  }
  throw new Error("Expected failure");
}

function task(overrides: Partial<Task> = {}): Task {
  return {
    owner: "partner",
    repo: "project",
    number: 42,
    title: "Fix a task",
    state: "open",
    updated_at: "2026-10-01T00:00:00Z",
    assigned: false,
    ...overrides,
  };
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
}

Deno.test("extension feed merges proposals, deduplicates, and joins mirror assignments", async () => {
  const requests: string[] = [];
  const fetcher: typeof fetch = (input, init) => {
    const url = String(input);
    requests.push(url);
    assert(!new Headers(init?.headers).has("Authorization"));
    assert(init?.signal instanceof AbortSignal);
    if (url.endsWith("mirror-state.json")) return Promise.resolve(json({ n42: { assignees: ["dev"] }, n43: { assigned: true } }));
    if (url.endsWith("partner-open-proposals.json")) return Promise.resolve(json([task({ number: 44 }), { ...task({ number: 42 }), node_id: "n42" }]));
    return Promise.resolve(
      json([{ ...task(), state: "OPEN", node_id: "n42" }, { ...task({ number: 43 }), node_id: "n43" }, task({ number: 45, state: "closed" })])
    );
  };
  const result = await api.loadTasks(fetcher);
  equal(requests.length, 3);
  equal(
    result.map((item) => item.number),
    [42, 43, 44]
  );
  assert(result[0].assigned && result[1].assigned);
  // A duplicate cannot invent an arbitrary URL or another task identity.
  equal(api.issueUrl({ ...result[0], url: "https://untrusted.example" } as Task), "https://github.com/partner/project/issues/42");
});

Deno.test("extension rejects malformed feeds, unsafe repositories and failed HTTP responses", async () => {
  await rejects(() => api.loadTasks(() => Promise.resolve(json({}))), "Invalid task feed");
  await rejects(() => api.loadTasks(() => Promise.resolve(json({ secret: "do-not-echo" }, 429))), "429");
  for (const invalid of [
    null,
    task({ owner: "bad/owner" }),
    task({ repo: ".." }),
    task({ repo: "x;exec" }),
    task({ number: -1 }),
    task({ updated_at: "invalid" }),
  ]) {
    await rejects(() => api.parseTask(invalid), "Invalid task data");
  }
});

Deno.test("extension GitHub requests use canonical URLs, auth, and confirmed state payloads", async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  const fetcher: typeof fetch = (input, init) => {
    requests.push({ url: String(input), init });
    return Promise.resolve(json({ ...task({ state: init?.method === "PATCH" ? "closed" : "open" }), assignees: ["dev"] }));
  };
  assert((await api.fetchTask(task(), "", fetcher)).assigned);
  const updated = await api.setTaskState(task(), "closed", "test-token", fetcher);
  equal(updated.state, "closed");
  equal(requests[1].url, "https://api.github.com/repos/partner/project/issues/42");
  equal(requests[1].init?.method, "PATCH");
  equal(JSON.parse(String(requests[1].init?.body)), { state: "closed" });
  equal(new Headers(requests[1].init?.headers).get("Authorization"), "Bearer test-token");
  assert(!new Headers(requests[0].init?.headers).has("Authorization"));
  await rejects(() => api.setTaskState(task(), "closed", "", fetcher), "Sign in");
  await rejects(() => api.setTaskState(task(), "invalid" as "open", "test-token", fetcher), "Invalid task status");
  equal(requests.length, 2);
  assert(!api.hasTaskChanged(task(), task()));
  assert(api.hasTaskChanged(task(), updated));
  assert(api.hasTaskChanged(task(), task({ updated_at: "2026-10-02T00:00:00Z" })));
});

function host(saved: Task[] = []) {
  const state = {
    feed: [task(), task({ number: 43, title: "Another task" })],
    latest: task(),
    shouldConfirm: false,
    shouldNotify: false,
    shouldFail: false,
    shouldCancelPicker: false,
    failStatus: false,
    requests: 0,
    writes: [] as string[],
    auth: [] as unknown[],
    saved,
    errors: [] as string[],
    notifications: [] as string[],
    opened: [] as string[],
    executed: [] as unknown[][],
    logs: [] as string[],
    disposed: 0,
  };
  const commands = new Map<string, (value?: Task) => Promise<unknown>>();
  const timers = new Map<number, () => Promise<void>>();
  let nextTimer = 0;
  let provider: { getChildren: (task?: Task) => Task[]; getTreeItem: (task: Task) => { contextValue: string; description: string } };
  let onConfigurationChange: (event: { affectsConfiguration: (key: string) => boolean }) => void;
  const context = {
    subscriptions: [] as { dispose(): void }[],
    globalState: {
      get: () => state.saved,
      update: (_key: string, value: Task[]) => {
        state.saved = value;
        return Promise.resolve();
      },
    },
  };
  function disposable() {
    return {
      dispose() {
        state.disposed++;
      },
    };
  }
  const vscode = {
    EventEmitter: class {
      event = () => {};
      fire() {}
      dispose() {
        state.disposed++;
      }
    },
    TreeItem: class {
      constructor(public label: string) {}
    },
    ThemeIcon: class {
      constructor(public id: string) {}
    },
    TreeItemCollapsibleState: { None: 0 },
    Uri: { parse: (value: string) => value },
    env: {
      openExternal: (url: string) => {
        state.opened.push(url);
        return Promise.resolve(true);
      },
    },
    authentication: {
      getSession: (_provider: string, _scopes: string[], options: { createIfNone?: boolean }) => {
        state.auth.push(options);
        return Promise.resolve(options.createIfNone ? { accessToken: "test-token" } : undefined);
      },
    },
    commands: {
      registerCommand: (id: string, action: (value?: Task) => Promise<unknown>) => {
        commands.set(id, action);
        return disposable();
      },
      executeCommand: (...args: unknown[]) => {
        state.executed.push(args);
        return Promise.resolve();
      },
    },
    window: {
      createOutputChannel: () => ({ appendLine: (text: string) => state.logs.push(text), ...disposable() }),
      createTreeView: (_id: string, options: { treeDataProvider: typeof provider }) => {
        provider = options.treeDataProvider;
        return disposable();
      },
      showQuickPick: (items: { task: Task }[]) => Promise.resolve(state.shouldCancelPicker ? undefined : items[0]),
      showErrorMessage: (text: string) => {
        state.errors.push(text);
        return Promise.resolve();
      },
      showWarningMessage: (_text: string, _options: unknown, title: string) => Promise.resolve(state.shouldConfirm ? title : undefined),
      showInformationMessage: (text: string) => {
        state.notifications.push(text);
        return Promise.resolve("Open Issue");
      },
    },
    workspace: {
      getConfiguration: () => ({ get: (key: string) => (key === "enabled" ? state.shouldNotify : 1) }),
      onDidChangeConfiguration: (listener: typeof onConfigurationChange) => {
        onConfigurationChange = listener;
        return disposable();
      },
    },
  };
  const tasksApi = {
    ...api,
    loadTasks: () => {
      state.requests++;
      if (state.shouldFail) return Promise.reject(new Error("feed unavailable"));
      return Promise.resolve(state.feed);
    },
    fetchTask: () => (state.shouldFail ? Promise.reject(new Error("offline")) : Promise.resolve(state.latest)),
    setTaskState: (_task: Task, status: "open" | "closed", token: string) => {
      assert(token === "test-token");
      if (state.failStatus) return Promise.reject(new Error("403"));
      state.writes.push(status);
      return Promise.resolve(task({ state: status }));
    },
  };
  const clock = {
    setInterval: (callback: () => Promise<void>, delay: number) => {
      equal(delay, 300000);
      timers.set(++nextTimer, () => Promise.resolve(callback()));
      return nextTimer;
    },
    clearInterval: (id?: number) => {
      if (id !== undefined) timers.delete(id);
    },
  };
  async function command(name: string, value?: Task) {
    const action = commands.get(`workUbq.${name}`);
    assert(action, `Missing command ${name}`);
    await action(value);
  }
  function configure() {
    onConfigurationChange({ affectsConfiguration: (key) => key === "workUbq.notifications" });
  }
  async function poll() {
    assert(timers.size === 1);
    await [...timers.values()][0]();
  }
  return {
    state,
    context,
    commands,
    timers,
    tasksApi,
    clock,
    vscode,
    command,
    configure,
    poll,
    start: () => activate(context, vscode, tasksApi, clock),
    children: () => provider.getChildren(),
    item: (value: Task) => provider.getTreeItem(value),
    dispose: () => context.subscriptions.forEach((item) => item.dispose()),
  };
}

Deno.test("extension activates all manifest commands, browses, clones and retains data on refresh failure", async () => {
  const app = host();
  try {
    await app.start();
    const manifest = JSON.parse(await Deno.readTextFile(new URL("../vscode-extension/package.json", import.meta.url)));
    equal(
      [...app.commands.keys()].sort(),
      manifest.contributes.commands.map((item: { command: string }) => item.command).sort()
    );
    equal(app.children().length, 2);
    equal(app.state.auth, []);
    equal(app.timers.size, 0);
    await app.command("findTask");
    await app.command("setupIssue", task());
    equal(app.state.opened, [api.issueUrl(task())]);
    equal(app.state.executed, [["git.clone", api.repositoryUrl(task())]]);
    app.state.shouldCancelPicker = true;
    await app.command("setupIssue");
    equal(app.state.executed.length, 1);
    app.state.shouldFail = true;
    await app.command("refresh");
    equal(app.children().length, 2);
    assert(app.state.errors[0].includes("feed unavailable"));
  } finally {
    app.dispose();
  }
});

Deno.test("extension confirms status changes, uses VS Code auth, and persists watched tasks without tokens", async () => {
  const app = host();
  try {
    await app.start();
    await app.command("closeIssue", task());
    equal(app.state.writes, []);
    equal(app.state.auth, []);
    app.state.shouldConfirm = true;
    await app.command("closeIssue", task());
    equal(app.state.writes, ["closed"]);
    equal(app.state.auth, [{ createIfNone: true }]);
    equal(app.item(task()).contextValue, "watchedTask");
    equal(app.state.saved[0].state, "closed");
    assert(!JSON.stringify(app.state.saved).includes("test-token"));
    app.state.failStatus = true;
    await app.command("reopenIssue", app.state.saved[0]);
    equal(app.state.saved[0].state, "closed");
    assert(app.state.errors[0].includes("403"));
    app.state.failStatus = false;
    await app.command("reopenIssue", app.state.saved[0]);
    equal(app.state.saved[0].state, "open");
    await app.command("unwatchIssue", task());
    equal(app.state.saved, []);
  } finally {
    app.dispose();
  }
});

Deno.test("extension polls only by opt-in, notifies once, preserves baselines on errors and disposes", async () => {
  const app = host([task()]);
  try {
    await app.start();
    equal(app.state.auth, [{ silent: true }]);
    app.state.shouldNotify = true;
    app.configure();
    app.state.latest = task({ state: "closed", updated_at: "2026-10-02T00:00:00Z" });
    await app.poll();
    equal(app.state.notifications.length, 1);
    equal(app.state.saved[0].state, "closed");
    equal(app.state.opened, [api.issueUrl(task())]);
    await app.poll();
    equal(app.state.notifications.length, 1);
    app.state.shouldFail = true;
    await app.poll();
    equal(app.state.saved[0].state, "closed");
    assert(app.state.logs[0].includes("offline"));
    equal(app.state.errors, []);
    app.state.shouldNotify = false;
    app.configure();
    equal(app.timers.size, 0);
  } finally {
    app.dispose();
  }
  assert(app.state.disposed >= 4);
  equal(app.timers.size, 0);
});

Deno.test("watching uses a current baseline, deduplicates tasks and refreshes statuses without notifying", async () => {
  const app = host();
  try {
    await app.start();
    await app.command("watchIssue", task());
    await app.command("watchIssue", task());
    equal(app.state.saved.length, 1);
    equal(app.children().length, 2);
    equal(app.state.auth, [
      { silent: true },
      { silent: true },
    ]);
    app.state.shouldNotify = true;
    app.configure();
    app.state.latest = task({ updated_at: "2026-10-03T00:00:00Z" });
    await app.command("refresh");
    equal(app.state.saved[0].updated_at, app.state.latest.updated_at);
    await app.poll();
    equal(app.state.notifications, []);
  } finally {
    app.dispose();
  }
});

Deno.test("in-flight polls neither resurrect unwatched tasks nor notify after disposal", async () => {
  const app = host([task()]);
  try {
    await app.start();
    app.state.shouldNotify = true;
    app.configure();
    const started = Promise.withResolvers<void>();
    const pending = Promise.withResolvers<Task>();
    app.tasksApi.fetchTask = () => {
      started.resolve();
      return pending.promise;
    };
    const polling = app.poll();
    await started.promise;
    await app.command("unwatchIssue", task());
    pending.resolve(task({ state: "closed" }));
    await polling;
    equal(app.state.saved, []);
    equal(app.state.notifications, []);

    app.tasksApi.fetchTask = () => Promise.resolve(task());
    await app.command("watchIssue", task());
    const lastStarted = Promise.withResolvers<void>();
    const lastPending = Promise.withResolvers<Task>();
    app.tasksApi.fetchTask = () => {
      lastStarted.resolve();
      return lastPending.promise;
    };
    const lastPoll = app.poll();
    await lastStarted.promise;
    app.dispose();
    lastPending.resolve(task({ state: "closed" }));
    await lastPoll;
    equal(app.state.saved[0].state, "open");
    equal(app.state.notifications, []);
    equal(app.timers.size, 0);
  } finally {
    app.dispose();
  }
});

Deno.test("disabling notifications while a baseline is being saved suppresses pending messages", async () => {
  const app = host([task()]);
  try {
    await app.start();
    app.state.shouldNotify = true;
    app.configure();
    app.state.latest = task({ state: "closed" });
    const saving = Promise.withResolvers<void>();
    const finish = Promise.withResolvers<void>();
    const update = app.context.globalState.update;
    app.context.globalState.update = async (key, value) => {
      await update(key, value);
      saving.resolve();
      await finish.promise;
    };
    const polling = app.poll();
    await saving.promise;
    app.state.shouldNotify = false;
    app.configure();
    finish.resolve();
    await polling;
    equal(app.state.notifications, []);
    equal(app.timers.size, 0);
  } finally {
    app.dispose();
  }
});
