# work.ubq.fi for VS Code

An initial, dependency-free desktop extension for partner tasks. It uses the same
public priced-issue, proposal, and assignment feeds as the website; no backend,
Supabase configuration, or GitHub login is needed to browse.

## Try it locally

From the repository root, launch an Extension Development Host:

```sh
code --extensionDevelopmentPath="$PWD/vscode-extension"
```

Open **Explorer → work.ubq.fi Tasks**, or run **work.ubq.fi: Find Task** from the
Command Palette. There is no install/build step: VS Code loads the CommonJS entry
point directly. Development tooling and tests remain Deno-only.

- Click an issue to open its GitHub page. Search matches titles and repositories.
- Right-click → **Clone Task Repository** to use VS Code's built-in Git clone flow,
  including its destination picker and open-folder prompt. This does not run issue
  content, install dependencies, create branches, or claim/assign the task.
- **Watch Task** saves a task across windows/restarts, including closed issues.
  **Refresh Tasks** reloads the feeds and watched issue statuses. Stop watching via
  the context menu or Command Palette.
- **Close Issue** / **Reopen Issue** ask for confirmation, then request GitHub sign-in
  with `public_repo` permission through VS Code. These are real GitHub state changes,
  not local status labels; GitHub enforces repository permissions. A successful
  update also watches that task. Tokens stay with VS Code's authentication provider
  and are never written to settings or extension storage.

## Notifications and limitations

Enable `workUbq.notifications.enabled` to check watched issues while the extension
host is running. `workUbq.notifications.intervalMinutes` defaults to five minutes
(and cannot be less than five). Updates to GitHub's `updated_at` or issue state
produce an IDE notification with an **Open Issue** action. This includes comments
and issue edits, not independent deadline reminders or push/real-time delivery.
Unchanged issues do not repeatedly notify. Manual refresh establishes a new baseline
without notifying. Watching records the current issue as the initial baseline.

Polling uses an existing GitHub session if available, but never prompts for login.
Without a session, public GitHub API rate limits apply; longer intervals are useful
when watching many tasks. Failed checks retain the previous baseline and are logged
in **Output → work.ubq.fi**. Feed failures are surfaced without discarding the last
successful list. The storage feeds are eventually consistent with GitHub. No polling
runs when notifications are disabled (the default); timers/listeners are disposed
when VS Code unloads the extension. Restricted workspaces are not supported.

## Offline tests

From the repository root (no network, packages, or running server required):

```sh
deno test --no-config --allow-read tests/vscode_extension.test.ts
deno check --no-config --check-js vscode-extension/tasks.cjs
```

Tests use a mocked VS Code host and mocked HTTP responses. To manually verify the
real UI, use the Development Host above, browse/search and clone a task, then watch
an issue and enable notifications. Exercise close/reopen only on an issue you have
permission to manage; canceling confirmation must not request authentication or
change GitHub state. This extension is not yet published to the Marketplace.
