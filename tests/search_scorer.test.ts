/// <reference lib="deno.ns" />
import { assert, assertGreaterOrEqual, assertLessOrEqual } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { GitHubIssue } from "../src/home/github-types.ts";
import type { SearchResult } from "../src/home/types/search-types.ts";
import { SearchScorer } from "../src/home/search/search-scorer.ts";

const cfg = { fuzzySearchThreshold: 0.5, exactMatchBonus: 1, fuzzyMatchWeight: 0.5 } as const;

function issue(partial: Partial<GitHubIssue> = {}): GitHubIssue {
  const now = new Date().toISOString();
  return {
    id: 1,
    node_id: "n",
    number: 42,
    title: "Foo bar baz",
    body: "This is some code: ```const foo = 1;``` and more.",
    labels: ["area: foo"],
    repository_url: "https://api.github.com/repos/ubiquity/ubq-app",
    html_url: "",
    created_at: now,
    updated_at: now,
    ...partial,
  } as GitHubIssue;
}

Deno.test("SearchScorer.calculateTitleScore awards exact match bonus and caps at 3", () => {
  const scorer = new SearchScorer(cfg);
  const matches: SearchResult["matchDetails"] = { titleMatches: [], bodyMatches: [], labelMatches: [], numberMatch: false, fuzzyMatches: [], repoMatch: false };
  const score = scorer.calculateTitleScore(issue(), ["foo"], matches);
  assertGreaterOrEqual(score, cfg.exactMatchBonus);
  assertLessOrEqual(score, 3);
  assert(matches.titleMatches.includes("foo"));
});

Deno.test("SearchScorer.calculateMetaScore detects label and number matches", () => {
  const scorer = new SearchScorer(cfg);
  const matches: SearchResult["matchDetails"] = { titleMatches: [], bodyMatches: [], labelMatches: [], numberMatch: false, fuzzyMatches: [], repoMatch: false };
  const s1 = scorer.calculateMetaScore(issue(), ["foo"], matches);
  assertGreaterOrEqual(s1, 0.5);
  const matches2: SearchResult["matchDetails"] = {
    titleMatches: [],
    bodyMatches: [],
    labelMatches: [],
    numberMatch: false,
    fuzzyMatches: [],
    repoMatch: false,
  };
  const s2 = scorer.calculateMetaScore(issue(), ["42"], matches2);
  assertGreaterOrEqual(s2, 2);
  assert(matches2.numberMatch);
});

Deno.test("SearchScorer.calculateRepoScore gives credit for repo/org startswith", () => {
  const scorer = new SearchScorer(cfg);
  const matches: SearchResult["matchDetails"] = { titleMatches: [], bodyMatches: [], labelMatches: [], numberMatch: false, fuzzyMatches: [], repoMatch: false };
  const s = scorer.calculateRepoScore(issue(), ["ubq"], matches);
  assertGreaterOrEqual(s, 0.3);
});

Deno.test("SearchScorer.calculateFuzzyScore finds near matches", () => {
  const scorer = new SearchScorer(cfg);
  const matches: SearchResult["matchDetails"] = { titleMatches: [], bodyMatches: [], labelMatches: [], numberMatch: false, fuzzyMatches: [], repoMatch: false };
  const s = scorer.calculateFuzzyScore("hello world", ["hell"], matches);
  assert(s > 0);
});
