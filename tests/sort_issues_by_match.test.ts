/// <reference lib="deno.ns" />
import { assertEquals, assertGreater } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { GitHubIssue } from "../src/home/github-types.ts";
import type { DeveloperMatchProfile } from "../src/home/matching/developer-profile.ts";
import { calculateMatchScore, sortIssuesByMatch } from "../src/home/matching/sort-issues-by-match.ts";

function issue(partial: Partial<GitHubIssue> & Pick<GitHubIssue, "number" | "title">): GitHubIssue {
  return {
    id: partial.number,
    node_id: `n${partial.number}`,
    body: null,
    labels: [],
    repository_url: "https://github.com/ubiquity/work.ubq.fi",
    html_url: "",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    ...partial,
  } as GitHubIssue;
}

const profile: DeveloperMatchProfile = {
  terms: ["deno", "routing", "supabase"],
  repositories: ["ubiquity/work.ubq.fi"],
  updatedAt: 1,
};

Deno.test("calculateMatchScore rewards profile terms in task content", () => {
  const matching = issue({
    number: 1,
    title: "Add Deno routing fallback",
    body: "Supabase login should gracefully recover",
    labels: ["Price: 450 USD", "Priority: 3 (High)", "Time: <4 Hours"],
  });
  const unrelated = issue({
    number: 2,
    title: "Polish copy",
    body: "Small text update",
    labels: ["Price: 450 USD", "Priority: 3 (High)", "Time: <4 Hours"],
  });

  assertGreater(calculateMatchScore(matching, profile), calculateMatchScore(unrelated, profile));
});

Deno.test("sortIssuesByMatch ranks profile matches before higher-price unrelated tasks", () => {
  const matching = issue({
    number: 1,
    title: "Deno routing fallback",
    labels: ["Price: 150 USD", "Priority: 2 (Medium)", "Time: <2 Hours"],
  });
  const expensive = issue({
    number: 2,
    title: "Marketing campaign copy",
    labels: ["Price: 900 USD", "Priority: 3 (High)", "Time: <1 Day"],
  });

  assertEquals(
    sortIssuesByMatch([expensive, matching], profile).map((item) => item.number),
    [1, 2]
  );
});

Deno.test("sortIssuesByMatch falls back to opportunity score without profile terms", () => {
  const highPriority = issue({
    number: 1,
    title: "Small urgent task",
    labels: ["Price: 75 USD", "Priority: 3 (High)", "Time: <1 Hour"],
    updated_at: "2026-06-01T00:00:00.000Z",
  });
  const lowPriority = issue({
    number: 2,
    title: "Larger slow task",
    labels: ["Price: 75 USD", "Priority: 1 (Normal)", "Time: <1 Day"],
    updated_at: "2026-06-01T00:00:00.000Z",
  });

  assertEquals(
    sortIssuesByMatch([lowPriority, highPriority], null).map((item) => item.number),
    [1, 2]
  );
});
