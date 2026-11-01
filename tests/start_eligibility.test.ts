/// <reference lib="deno.ns" />
import { StartEligibilityFilter } from "../src/home/sorting/filter-issues-by-start-eligibility.ts";
import { filterIssuesByAvailability, isAvailabilityFilterEnabled } from "../src/home/sorting/filter-issues-by-availability.ts";

// Keep these focused tests dependency-free so they can run offline.
function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function issue(number: number) {
  return { html_url: `https://github.com/owner/repo/issues/${number}`, updated_at: "2026-11-01T00:00:00Z" };
}

const session = { userId: "user-1", accessToken: "test-jwt" };
const endpoint = "https://eligibility.example/start";

Deno.test("availability is the default and only an explicit allIssues=true opts out", () => {
  for (const search of ["", "?search=typescript", "?allIssues=false", "?allIssues=1"]) {
    assertEquals(isAvailabilityFilterEnabled(search), true);
  }
  assertEquals(isAvailabilityFilterEnabled("?allIssues=true&search=typescript"), false);
  const tasks = [
    { ...issue(1), assigned: false },
    { ...issue(2), assigned: true },
    { ...issue(3), assignee: { login: "someone" } },
    { ...issue(4), assignees: [{ login: "someone" }] },
  ] as Parameters<typeof filterIssuesByAvailability>[0];
  assertEquals(
    filterIssuesByAvailability(tasks).map((task) => task.html_url),
    [issue(1).html_url]
  );
});

Deno.test("eligibility accepts only explicit approvals and preserves issue order", async () => {
  const results = [true, false, { experience: true, capacity: true }, { experience: "Requires experience", capacity: true }, { capacity: false }];
  const requests: { url: string; method?: string; authorization: string | null }[] = [];
  const client = new StartEligibilityFilter(endpoint, (input, init) => {
    const url = new URL(String(input));
    assertEquals(init?.signal instanceof AbortSignal, true);
    assertEquals(init?.redirect, "error");
    assertEquals(init?.cache, "no-store");
    assertEquals(init?.credentials, "omit");
    requests.push({ url: url.searchParams.get("issueURL") ?? "", method: init?.method, authorization: new Headers(init?.headers).get("Authorization") });
    const index = Number(url.searchParams.get("issueURL")?.split("/").pop()) - 1;
    return Promise.resolve(Response.json({ result: results[index] }));
  });
  const tasks = results.map((_, index) => issue(index + 1));
  const result = await client.filter(tasks, session);
  assertEquals(result.issues, [tasks[0], tasks[2]]);
  assertEquals(result.uncheckedCount, 0);
  assertEquals(requests.length, 5);
  assertEquals(requests[0], { url: tasks[0].html_url, method: "GET", authorization: "Bearer test-jwt" });
});

Deno.test("decisions are cached and invalidated by issue updates, expiry, users and tokens", async () => {
  let time = 0;
  let calls = 0;
  const client = new StartEligibilityFilter(
    endpoint,
    () => {
      calls++;
      return Promise.resolve(Response.json({ result: true }));
    },
    () => time
  );
  const tasks = [issue(1)];
  await client.filter(tasks, session);
  await client.filter(tasks, session);
  assertEquals(calls, 1);
  const updated = [{ ...tasks[0], updated_at: "2026-11-01T01:00:00Z" }];
  await client.filter(updated, session);
  assertEquals(calls, 2);
  time = 60_001;
  await client.filter(updated, session);
  assertEquals(calls, 3);
  await client.filter(updated, { ...session, userId: "user-2" });
  await client.filter(updated, { ...session, accessToken: "refreshed-jwt" });
  assertEquals(calls, 5);
});

Deno.test("concurrent renders share in-flight checks", async () => {
  let calls = 0;
  let finish: (response: Response) => void = () => {};
  const pending = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  const client = new StartEligibilityFilter(endpoint, () => {
    calls++;
    return pending;
  });
  const first = client.filter([issue(1)], session);
  const second = client.filter([issue(1)], session);
  assertEquals(calls, 1);
  finish(Response.json({ result: true }));
  assertEquals(await first, await second);
});

Deno.test("rate limits stop new checks, exclude unknown tasks and honor retry timing", async () => {
  let calls = 0;
  let time = 0;
  const client = new StartEligibilityFilter(
    endpoint,
    () => {
      calls++;
      return Promise.resolve(new Response(null, { status: 429, headers: { "Retry-After": "120" } }));
    },
    () => time
  );
  const tasks = Array.from({ length: 12 }, (_, index) => issue(index + 1));
  const result = await client.filter(tasks, session);
  assertEquals(result, { issues: [], uncheckedCount: 12 });
  assertEquals(calls, 4);
  time = 60_001;
  await client.filter(tasks, session);
  assertEquals(calls, 4);
  time = 120_001;
  await client.filter(tasks, session);
  assertEquals(calls, 8);
});

Deno.test("malformed responses, HTTP errors, network failures and timeouts never approve tasks", async () => {
  for (const body of [{}, { result: {} }, { result: [] }, { result: null }, { result: "true" }, { result: { check: 1 } }]) {
    const client = new StartEligibilityFilter(endpoint, () => Promise.resolve(Response.json(body)));
    assertEquals(await client.filter([issue(1)], session), { issues: [], uncheckedCount: 1 });
  }
  for (const status of [400, 401, 403, 500]) {
    const client = new StartEligibilityFilter(endpoint, () => Promise.resolve(new Response(null, { status })));
    assertEquals(await client.filter([issue(1)], session), { issues: [], uncheckedCount: 1 });
  }
  for (const error of [new TypeError("offline"), new DOMException("timeout", "TimeoutError")]) {
    const client = new StartEligibilityFilter(endpoint, () => Promise.reject(error));
    assertEquals(await client.filter([issue(1)], session), { issues: [], uncheckedCount: 1 });
  }
});

Deno.test("invalid issue URLs and insecure remote endpoints do not receive credentials", async () => {
  let calls = 0;
  function request() {
    calls++;
    return Promise.resolve(Response.json({ result: true }));
  }
  const client = new StartEligibilityFilter(endpoint, request);
  assertEquals(await client.filter([{ ...issue(1), html_url: "https://other.example/issues/1" }], session), { issues: [], uncheckedCount: 1 });
  const insecure = new StartEligibilityFilter("http://eligibility.example/start", request);
  assertEquals(await insecure.filter([issue(1)], session), { issues: [], uncheckedCount: 1 });
  assertEquals(calls, 0);
});

Deno.test("empty candidate lists do not call the API", async () => {
  const client = new StartEligibilityFilter(endpoint, () => {
    throw new Error("Unexpected API request");
  });
  assertEquals(await client.filter([], session), { issues: [], uncheckedCount: 0 });
});
