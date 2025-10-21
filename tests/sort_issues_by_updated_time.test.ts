/// <reference lib="deno.ns" />
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { sortIssuesByLatestActivity } from "../src/home/sorting/sort-issues-by-updated-time.ts";
import type { GitHubIssue } from "../src/home/github-types.ts";

function issue(updatedAt: string, number: number): GitHubIssue {
  return {
    id: number,
    node_id: `n${number}`,
    number,
    title: "t",
    body: null,
    labels: [],
    repository_url: "https://github.com/o/r",
    html_url: "",
    created_at: new Date().toISOString(),
    updated_at: updatedAt,
  };
}

Deno.test("sortIssuesByLatestActivity sorts newest first by default", () => {
  const now = new Date();
  const a = issue(new Date(now.getTime() - 60_000).toISOString(), 1);
  const b = issue(now.toISOString(), 2);
  const res = sortIssuesByLatestActivity([a, b]);
  assertEquals(
    res.map((i) => i.number),
    [2, 1]
  );
});

Deno.test("sortIssuesByLatestActivity sorts oldest first in reverse", () => {
  const now = new Date();
  const a = issue(new Date(now.getTime() - 60_000).toISOString(), 1);
  const b = issue(now.toISOString(), 2);
  const res = sortIssuesByLatestActivity([a, b], "reverse");
  assertEquals(
    res.map((i) => i.number),
    [1, 2]
  );
});
