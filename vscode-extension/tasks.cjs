/* global fetch, AbortSignal */
// Host-independent API helpers; no GitHub token is stored here.
/** @typedef {{ owner: string, repo: string, number: number, title: string, state: "open" | "closed", updated_at: string, assigned: boolean }} Task */
/** @typedef {typeof fetch} Fetcher */

const storageBase = "https://raw.githubusercontent.com/devpool-directory/devpool-directory/__STORAGE__";

/** @param {unknown} value @returns {Record<string, unknown>} */
function record(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid task data.");
  return /** @type {Record<string, unknown>} */ (value);
}

/** @param {unknown} value @returns {Task} */
function parseTask(value) {
  const item = record(value);
  const state = typeof item.state === "string" ? item.state.toLowerCase() : "";
  if (
    typeof item.owner !== "string" ||
    !/^[a-z\d-]+$/i.test(item.owner) ||
    typeof item.repo !== "string" ||
    !/^[\w.-]+$/.test(item.repo) ||
    item.repo === "." ||
    item.repo === ".." ||
    typeof item.number !== "number" ||
    !Number.isSafeInteger(item.number) ||
    item.number < 1 ||
    typeof item.title !== "string" ||
    !item.title.trim() ||
    (state !== "open" && state !== "closed") ||
    typeof item.updated_at !== "string" ||
    !Number.isFinite(Date.parse(item.updated_at))
  ) {
    throw new Error("Invalid task data.");
  }
  return {
    owner: item.owner,
    repo: item.repo,
    number: item.number,
    title: item.title,
    state,
    updated_at: item.updated_at,
    assigned: item.assigned === true,
  };
}

/** @param {Task} task */
function taskKey(task) {
  return `${task.owner}/${task.repo}#${task.number}`.toLowerCase();
}

/** @param {Task} task */
function repositoryUrl(task) {
  const safe = parseTask(task);
  return `https://github.com/${safe.owner}/${safe.repo}`;
}

/** @param {Task} task */
function issueUrl(task) {
  return `${repositoryUrl(task)}/issues/${task.number}`;
}

/** @param {string} url @param {string} token @param {RequestInit} init @param {Fetcher} fetcher @returns {Promise<unknown>} */
async function requestJson(url, token, init, fetcher) {
  const response = await fetcher(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`Task request failed (${response.status}). Check your connection, GitHub permissions, or API rate limit.`);
  }
  return response.json();
}

/** @param {Fetcher} [fetcher] @returns {Promise<Task[]>} */
async function loadTasks(fetcher = fetch) {
  const [priced, proposals, mirrorValue] = await Promise.all([
    requestJson(`${storageBase}/partner-open-issues.json`, "", {}, fetcher),
    requestJson(`${storageBase}/partner-open-proposals.json`, "", {}, fetcher),
    requestJson(`${storageBase}/mirror-state.json`, "", {}, fetcher),
  ]);
  if (!Array.isArray(priced) || !Array.isArray(proposals)) throw new Error("Invalid task feed.");
  const mirror = record(mirrorValue);
  /** @type {Map<string, Task>} */
  const tasks = new Map();
  for (const value of [...priced, ...proposals]) {
    const item = record(value);
    const assignment = typeof item.node_id === "string" ? mirror[item.node_id] : undefined;
    const state = assignment == null ? {} : record(assignment);
    const task = parseTask({ ...item, assigned: state.assigned === true || (Array.isArray(state.assignees) && state.assignees.length > 0) });
    if (task.state === "open") tasks.set(taskKey(task), task);
  }
  return [...tasks.values()];
}

/** @param {Task} task @param {string} token @param {RequestInit} init @param {Fetcher} fetcher @returns {Promise<Task>} */
async function requestTask(task, token, init, fetcher) {
  const safe = parseTask(task);
  const data = record(await requestJson(`https://api.github.com/repos/${safe.owner}/${safe.repo}/issues/${safe.number}`, token, init, fetcher));
  return parseTask({
    ...data,
    owner: safe.owner,
    repo: safe.repo,
    number: safe.number,
    assigned: Array.isArray(data.assignees) && data.assignees.length > 0,
  });
}

/** @param {Task} task @param {string} [token] @param {Fetcher} [fetcher] */
function fetchTask(task, token = "", fetcher = fetch) {
  return requestTask(task, token, {}, fetcher);
}

/** @param {Task} task @param {"open" | "closed"} state @param {string} token @param {Fetcher} [fetcher] */
function setTaskState(task, state, token, fetcher = fetch) {
  if (!token) throw new Error("Sign in to GitHub to update task status.");
  if (state !== "open" && state !== "closed") throw new Error("Invalid task status.");
  return requestTask(task, token, { method: "PATCH", body: JSON.stringify({ state }) }, fetcher);
}

/** @param {Task} before @param {Task} after */
function hasTaskChanged(before, after) {
  return before.updated_at !== after.updated_at || before.state !== after.state;
}

module.exports = { parseTask, taskKey, repositoryUrl, issueUrl, loadTasks, fetchTask, setTaskState, hasTaskChanged };
