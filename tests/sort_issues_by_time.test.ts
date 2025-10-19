/// <reference lib="deno.ns" />
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { sortIssuesByTime } from "../src/home/sorting/sort-issues-by-time.ts";
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

Deno.test("sortIssuesByTime sums Time: labels and sorts descending", () => {
  const a = issue(["Time: 2 hours"], 1); // 0.25
  const b = issue(["Time: 1 day", "Time: 2 hours"], 2); // 1 + 0.25 = 1.25
  const c = issue(["Time: 30 minutes"], 3); // 0.06
  const res = sortIssuesByTime([a, b, c]);
  assertEquals(
    res.map((i) => i.number),
    [2, 1, 3]
  );
});
