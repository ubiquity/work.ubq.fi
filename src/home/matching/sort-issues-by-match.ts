import { GitHubIssue, GitHubLabel } from "../github-types.ts";
import { calculateTimeLabelValue } from "../sorting/calculate-time-label-value.ts";
import { getLabelText } from "../sorting/label-utils.ts";
import { DeveloperMatchProfile, loadDeveloperMatchProfile } from "./developer-profile.ts";

export function sortIssuesByMatch(issues: GitHubIssue[], profile: DeveloperMatchProfile | null = loadDeveloperMatchProfile()) {
  return issues.sort((a, b) => {
    const scoreDiff = calculateMatchScore(b, profile) - calculateMatchScore(a, profile);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

function calculateMatchScore(issue: GitHubIssue, profile: DeveloperMatchProfile | null = loadDeveloperMatchProfile()): number {
  const profileTerms = new Set(profile?.terms.map((term) => term.toLowerCase()) ?? []);
  const profileRepositories = new Set(profile?.repositories.map((repo) => repo.toLowerCase()) ?? []);

  return (
    calculateProfileOverlap(issue, profileTerms) +
    calculateRepositoryScore(issue, profileRepositories) +
    calculateOpportunityScore(issue.labels) +
    calculateActivityScore(issue.updated_at)
  );
}

function calculateProfileOverlap(issue: GitHubIssue, profileTerms: Set<string>): number {
  if (profileTerms.size === 0) return 0;

  const title = issue.title.toLowerCase();
  const body = (issue.body ?? "").toLowerCase();
  const labels = issue.labels.map(getLabelText).join(" ").toLowerCase();
  let score = 0;

  for (const term of profileTerms) {
    if (title.includes(term)) score += 4;
    if (labels.includes(term)) score += 2.5;
    if (body.includes(term)) score += 1;
  }

  return score;
}

function calculateRepositoryScore(issue: GitHubIssue, profileRepositories: Set<string>): number {
  if (profileRepositories.size === 0) return 0;

  const repository = issue.repository_url.split("/").slice(-2).join("/").toLowerCase();

  return profileRepositories.has(repository) ? 6 : 0;
}

function calculateOpportunityScore(labels: GitHubLabel[]): number {
  const price = labels.map(getPriceFromLabel).find((value) => value !== null) ?? 0;
  const priority = labels.map(getPriorityFromLabel).find((value) => value !== null) ?? 0;
  const time = labels.map(getTimeFromLabel).find((value) => value !== null) ?? 0;

  return Math.log10(price + 1) * 1.5 + priority * 1.25 + (time > 0 ? 1 / time : 0);
}

function calculateActivityScore(updatedAt: string): number {
  const ageInDays = (Date.now() - new Date(updatedAt).getTime()) / 86_400_000;
  return Math.max(0, 2 - ageInDays / 30);
}

function getPriceFromLabel(label: GitHubLabel): number | null {
  const match = getLabelText(label).match(/^Price:\s*([\d,]+)/);
  return match ? parseInt(match[1].replace(/,/g, ""), 10) : null;
}

function getPriorityFromLabel(label: GitHubLabel): number | null {
  const match = getLabelText(label).match(/^Priority:\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function getTimeFromLabel(label: GitHubLabel): number | null {
  const text = getLabelText(label);
  return text.startsWith("Time: ") ? calculateTimeLabelValue(text) : null;
}
