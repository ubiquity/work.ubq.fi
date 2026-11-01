interface EligibilitySession {
  userId: string;
  accessToken: string;
}

interface EligibilityContext extends EligibilitySession {
  cache: Map<string, { expiresAt: number; result: Promise<boolean | null> }>;
  retryAt: number;
}

// command-start-stop owns the policy. This client only consumes its read-only /start API.
export class StartEligibilityFilter {
  private _context?: EligibilityContext;

  constructor(private readonly _endpoint: string, private readonly _fetch: typeof fetch = fetch, private readonly _now: () => number = Date.now) {}

  public async filter<TIssue extends { html_url: string; updated_at: string }>(issues: TIssue[], session: EligibilitySession) {
    if (this._context?.userId !== session.userId || this._context?.accessToken !== session.accessToken) {
      this._context = { ...session, cache: new Map(), retryAt: 0 };
    }
    const context = this._context;
    for (const [key, entry] of context.cache) {
      if (entry.expiresAt <= this._now()) context.cache.delete(key);
    }
    const decisions: (boolean | null)[] = Array(issues.length).fill(null);
    let cursor = 0;
    const now = this._now;
    const check = this._check.bind(this);
    async function worker() {
      while (cursor < issues.length) {
        const index = cursor++;
        const issue = issues[index];
        const key = `${issue.html_url}:${issue.updated_at}`;
        let entry = context.cache.get(key);
        if (!entry && context.retryAt <= now()) {
          entry = { expiresAt: now() + 60_000, result: check(issue.html_url, context) };
          context.cache.set(key, entry);
        }
        decisions[index] = entry ? await entry.result : null;
      }
    }
    // Bound API traffic; stop scheduling new checks on errors (including rate limits).
    await Promise.all(Array.from({ length: Math.min(4, issues.length) }, worker));
    return {
      issues: issues.filter((_, index) => decisions[index] === true),
      uncheckedCount: decisions.filter((decision) => decision === null).length,
    };
  }

  private async _check(issueUrl: string, context: EligibilityContext): Promise<boolean | null> {
    try {
      if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/[1-9]\d*\/?$/.test(issueUrl)) return null;
      const url = new URL(this._endpoint);
      if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) {
        throw new Error("Eligibility API requires HTTPS");
      }
      url.searchParams.set("issueURL", issueUrl);
      const response = await this._fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${context.accessToken}` },
        signal: AbortSignal.timeout(8_000),
        redirect: "error",
        cache: "no-store",
        credentials: "omit",
      });
      if (!response.ok) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        if (Number.isFinite(retryAfter) && retryAfter > 0) context.retryAt = this._now() + retryAfter * 1_000;
        throw new Error("Eligibility API unavailable");
      }
      const body: unknown = await response.json();
      if (!body || typeof body !== "object" || !("result" in body)) throw new Error("Invalid eligibility response");
      const result = body.result;
      if (typeof result === "boolean") return result;
      if (result && typeof result === "object" && !Array.isArray(result)) {
        const checks: unknown[] = Object.values(result);
        if (checks.length && checks.every((check) => typeof check === "boolean" || typeof check === "string")) {
          return checks.every((check) => check === true);
        }
      }
      throw new Error("Invalid eligibility result");
    } catch {
      context.retryAt = Math.max(context.retryAt, this._now() + 60_000);
      return null;
    }
  }
}
