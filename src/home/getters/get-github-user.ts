import { RequestError } from "@octokit/request-error";
import { Octokit } from "@octokit/rest";
import { handleRateLimit } from "../fetch-github/handle-rate-limit.ts";
import { GitHubUser, GitHubUserResponse } from "../github-types.ts";
import { OAuthToken } from "./get-github-access-token.ts";
import { getLocalStore } from "./get-local-store.ts";
declare const SUPABASE_STORAGE_KEY: string; // @DEV: passed in at build time check build/esbuild-build.ts

export async function getGitHubUser(): Promise<GitHubUser | null> {
  const activeSessionToken = await getSessionToken();
  return getNewGitHubUser(activeSessionToken);
}

async function getSessionToken(): Promise<string | null> {
  // Prefer a fresh token from the URL fragment first (after OAuth redirect)
  const newSessionToken = await getNewSessionToken();
  if (newSessionToken) return newSessionToken;

  // Fallback to cached token stored by Supabase in localStorage
  const cachedSessionToken = getLocalStore(`sb-${SUPABASE_STORAGE_KEY}-auth-token`) as OAuthToken | null;
  return cachedSessionToken?.provider_token ?? null;
}

async function getNewSessionToken(): Promise<string | null> {
  let hash = window.location.hash || "";
  // Strip a single leading '#'
  hash = hash.replace(/^#/, "");
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const providerToken = params.get("provider_token");
  if (!providerToken) {
    const error = params.get("error_description");
    console.error(`GitHub login provider: ${error ?? "missing provider_token"}`);
  }

  // Clean the hash from the URL to prevent double-hash issues on subsequent auth
  try {
    const cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState({}, "", cleanUrl);
  } catch {
    // no-op if history API not available
  }

  return providerToken || null;
}

async function getNewGitHubUser(providerToken: string | null): Promise<GitHubUser | null> {
  const octokit = new Octokit({ auth: providerToken });
  try {
    const response = (await octokit.request("GET /user")) as GitHubUserResponse;
    return response.data;
  } catch (error) {
    if (!!error && typeof error === "object" && "status" in error && error.status === 403) {
      await handleRateLimit(providerToken ? octokit : undefined, error as RequestError);
    }
    console.warn("You have been logged out. Please login again.", error);
  }
  return null;
}
