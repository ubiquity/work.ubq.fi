/// <reference lib="deno.ns" />
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { sortIssuesByPriority } from "../src/home/sorting/sort-issues-by-priority.ts";
import type { GitHubIssue } from "../src/home/github-types.ts";

function issue(labels: GitHubIssue["labels"], number: number): GitHubIssue {
  return {
    id: number,
    node_id: `n${number}`,
    number,
    title: "t",
    body: null,
    labels,
    repository_url: "https://github.com/o/r",
    html_url: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

Deno.test("sortIssuesByPriority respects numeric priority descending", () => {
  const a = issue(["Priority: 2"], 1);
  const b = issue(["Priority: 5"], 2);
  const c = issue(["No Priority"], 3);
  const res = sortIssuesByPriority([a, b, c]);
  assertEquals(
    res.map((i) => i.number),
    [2, 1, 3]
  );
});

Deno.test("sortIssuesByPriority matches both string and object labels", () => {
  const a = issue([{ name: "Priority: 1" }], 1);
  const b = issue(["Priority: 3"], 2);
  const c = issue([{ name: "Other" }], 3);
  const res = sortIssuesByPriority([a, b, c]);
  assertEquals(
    res.map((i) => i.number),
    [2, 1, 3]
  );
});
