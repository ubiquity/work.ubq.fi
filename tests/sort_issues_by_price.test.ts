/// <reference lib="deno.ns" />
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { sortIssuesByPrice } from "../src/home/sorting/sort-issues-by-price.ts";
import type { GitHubIssue } from "../src/home/github-types.ts";

function issue(labels: GitHubIssue["labels"]): GitHubIssue {
  return {
    id: 1,
    node_id: "n",
    number: 1,
    title: "t",
    body: null,
    labels,
    repository_url: "https://github.com/o/r",
    html_url: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

Deno.test("sortIssuesByPrice sorts by highest price first and treats missing as -1", () => {
  const a = issue(["Price: 1,000"]);
  const b = issue(["Price: 10,000"]);
  const c = issue(["no price"]);
  const res = sortIssuesByPrice([a, b, c]);
  assertEquals(res[0], b);
  assertEquals(res[1], a);
  assertEquals(res[2], c);
});

Deno.test("sortIssuesByPrice handles object labels", () => {
  const a = issue([{ name: "Price: 5,000" }]);
  const b = issue([{ name: "Price: 4,000" }]);
  const res = sortIssuesByPrice([a, b]);
  assertEquals(res[0], a);
  assertEquals(res[1], b);
});
