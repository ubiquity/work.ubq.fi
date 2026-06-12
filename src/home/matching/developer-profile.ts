const MATCH_PROFILE_STORAGE_KEY = "devpoolMatchProfile";

export interface DeveloperMatchProfile {
  terms: string[];
  repositories: string[];
  updatedAt: number;
}

export interface ScrapedIssueProfileSource {
  markdown?: string | null;
  plaintext?: string | null;
  repository?: string | null;
}

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "against",
  "also",
  "because",
  "before",
  "being",
  "between",
  "could",
  "for",
  "from",
  "have",
  "into",
  "issue",
  "make",
  "more",
  "only",
  "should",
  "task",
  "that",
  "their",
  "there",
  "these",
  "this",
  "through",
  "with",
  "would",
]);

export function buildDeveloperMatchProfile(issues: ScrapedIssueProfileSource[], updatedAt = Date.now()): DeveloperMatchProfile {
  const termCounts = new Map<string, number>();
  const repositories = new Set<string>();

  for (const issue of issues) {
    const repository = issue.repository?.trim().toLowerCase();
    if (repository) repositories.add(repository);

    const text = [issue.plaintext, issue.markdown].filter(Boolean).join(" ");
    for (const term of tokenizeProfileText(text)) {
      termCounts.set(term, (termCounts.get(term) ?? 0) + 1);
    }
  }

  const terms = [...termCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 40)
    .map(([term]) => term);

  return {
    terms,
    repositories: [...repositories].sort(),
    updatedAt,
  };
}

export function saveDeveloperMatchProfile(profile: DeveloperMatchProfile, storage = getBrowserStorage()) {
  if (!storage || profile.terms.length === 0) return;
  storage.setItem(MATCH_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function loadDeveloperMatchProfile(storage = getBrowserStorage()): DeveloperMatchProfile | null {
  if (!storage) return null;

  try {
    const raw = storage.getItem(MATCH_PROFILE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.terms)) return null;

    return {
      terms: parsed.terms.filter((term: unknown): term is string => typeof term === "string"),
      repositories: Array.isArray(parsed.repositories) ? parsed.repositories.filter((repo: unknown): repo is string => typeof repo === "string") : [],
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
    };
  } catch {
    return null;
  }
}

function tokenizeProfileText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9#+.\s-]/g, " ")
    .split(/\s+/)
    .map((term) => term.replace(/^-+|-+$/g, ""))
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term) && !/^\d+$/.test(term));
}

function getBrowserStorage(): Storage | null {
  return typeof globalThis.localStorage === "undefined" ? null : globalThis.localStorage;
}
