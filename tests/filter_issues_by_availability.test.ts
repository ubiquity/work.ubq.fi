/// <reference lib="deno.ns" />
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { filterIssuesByAvailability } from "../src/home/sorting/filter-issues-by-availability.ts";
import type { GitHubIssue } from "../src/home/github-types.ts";

function issue(partial: Partial<GitHubIssue> & Pick<GitHubIssue, "number">): GitHubIssue {
  return {
    id: partial.number,
    node_id: `n${partial.number}`,
    title: "t",
    body: null,
    labels: [],
    repository_url: "https://github.com/o/r",
    html_url: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...partial,
  } as GitHubIssue;
}

Deno.test("filterIssuesByAvailability removes assigned issues by mirror-state flag", () => {
  const available = issue({ number: 1, assigned: false });
  const assigned = issue({ number: 2, assigned: true });
  const res = filterIssuesByAvailability([available, assigned]);
  assertEquals(
    res.map((i) => i.number),
    [1]
  );
});

Deno.test("filterIssuesByAvailability removes when assignee present or assignees non-empty", () => {
  const withAssignee = issue({ number: 1, assignee: { id: 1 } });
  const withAssignees = issue({ number: 2, assignees: [{}] });
  const clear = issue({ number: 3 });
  const res = filterIssuesByAvailability([withAssignee, withAssignees, clear]);
  assertEquals(
    res.map((i) => i.number),
    [3]
  );
});
