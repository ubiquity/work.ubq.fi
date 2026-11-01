# New-user onboarding and matchmaking

## Available tasks today

The directory defaults to **Available**: assigned tasks are excluded, including mirror-state assignments and GitHub assignees. **All Issues** explicitly opts out with `?allIssues=true`. Search, organization filtering and sorting use the same availability pipeline.

For signed-in users, Available also uses the read-only `command-start-stop` public API. The plugin remains the single source of truth for task gating; no policy is copied into this repository, and checking a task never starts or assigns it. Proposals are not startable tasks, so they only use the assignment filter.

### Deployment

Set `COMMAND_START_STOP_URL` to the full HTTPS public API endpoint (including `/start`) **before building**. Both the build and watch tasks inject this public URL into the browser bundle. With no configured endpoint the directory still hides assigned tasks and explicitly reports that personalized eligibility is unavailable.

The endpoint must run a version of `ubiquity-os-marketplace/command-start-stop` that exposes its public API, with:

- `PUBLIC_API_ENABLED` enabled;
- `PUBLIC_API_ALLOWED_ORIGINS` including the directory origin;
- `SUPABASE_JWT_SECRET` matching the directory's Supabase project, configured **only on the plugin server**;
- its server-side GitHub credentials and repository/plugin configuration;
- an API quota appropriate for directory browsing (`PUBLIC_API_RATE_LIMIT_MAX_REQUESTS` / `PUBLIC_API_RATE_LIMIT_WINDOW_SECONDS`). The upstream default is only ten requests per minute.

The browser sends `GET /start?issueURL=<encoded GitHub issue URL>` with the **Supabase access token** as the Bearer token, not the GitHub provider token. Successful responses contain `result: boolean` or a record of check names to boolean/string outcomes. Only `true` or a nonempty record consisting entirely of `true` means startable. A denial or explanatory string excludes the task.

Checks run with at most four workers per render, share in-flight requests, and cache decisions in memory for one minute per session and issue update. Account/token changes reset the cache. Timeouts, malformed responses and API errors are not approvals: unverified tasks are excluded with a visible status message and an **All Issues** escape hatch. Errors pause new checks for at least a minute (longer for a numeric `Retry-After`). Signed-out visitors see unassigned tasks with a login prompt. Cached decisions are advisory; `/start` still performs authoritative validation when the user starts work.

## Proposal: “Recommended for you”

### Experience

1. Keep **Available** as the default; recommendations must never reintroduce assigned or gated tasks.
2. After authentication and eligibility checks, request matchmaking scores for the current user and eligible issue URLs. Display up to three high-confidence matches in a compact **Recommended for you** section above the existing directory. Do not duplicate those cards in the list below.
3. Reuse the existing task tiles. Add a small accent border and a **Recommended** text badge, plus a short explanation such as “Matches your TypeScript experience.” Do not communicate a match by color alone, or display raw similarity scores as promises of success.
4. Keep ordinary sorting/search predictable: search and organization filters constrain both sections; an explicit sort flattens recommendations back into the sorted list while retaining badges. **All Issues** can retain recommendation badges only on verified startable tasks.
5. With no profile or no confident matches, show the normal directory. Offer a small “Complete a task to improve recommendations” hint rather than an empty recommendation panel. While scores load or on failure, keep the directory usable without a modal or blocking spinner.

### Data and freshness

- Add an authenticated matchmaking endpoint that returns scores and concise reasons keyed by GitHub issue URL using the existing profile/vector data. Its response should include a profile version and expiry. Do not compute embeddings in the browser or expose service keys.
- Scope recommendation caches to the authenticated user; invalidate on logout, profile updates, assignments and eligibility changes. Do not persist tokens or private profile text in the recommendation cache.
- Treat eligibility as a hard filter and ranking as an optional enhancement. Recheck eligibility when refreshing recommendations and defer final assignment validation to `command-start-stop`.

### Delivery and validation

Ship badges first, then the compact recommendation section once useful coverage is measured. Test keyboard/screen-reader access, empty/new profiles, API failures, account switching, mobile layouts, and a previously recommended task becoming assigned or gated. Measure time to first successful task start, the proportion of starts rejected by gating, and recommendation-to-start conversion without collecting private issue/profile content. Gate a wider rollout on improving those onboarding outcomes rather than on click-through alone.
