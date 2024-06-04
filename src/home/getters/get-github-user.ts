import { Octokit } from "@octokit/rest";
import { GitHubUser, GitHubUserResponse } from "../github-types";
import { OAuthToken } from "./get-github-access-token";
import { getLocalStore } from "./get-local-store";
import { handleRateLimit } from "../fetch-github/fetch-issues-preview";
import { RequestError } from "@octokit/request-error";
import { showError } from "../rendering/display-popup-modal";
declare const SUPABASE_STORAGE_KEY: string; // @DEV: passed in at build time check build/esbuild-build.ts

export async function getGitHubUser(): Promise<GitHubUser | null> {
  const activeSessionToken = await getSessionToken();
  return getNewGitHubUser(activeSessionToken);
}

async function getSessionToken(): Promise<string | null> {
  const cachedSessionToken = getLocalStore(`sb-${SUPABASE_STORAGE_KEY}-auth-token`) as OAuthToken | null;
  if (cachedSessionToken) {
    return cachedSessionToken.provider_token;
  }
  const newSessionToken = await getNewSessionToken();
  if (newSessionToken) {
    return newSessionToken;
  }
  return null;
}

async function getNewSessionToken(): Promise<string | null> {
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.substr(1)); // remove the '#' and parse
  const providerToken = params.get("provider_token");
  if (!providerToken) {
    const error = params.get("error_description");
    // supabase auth provider has failed for some reason
    showError(`${error}`, false, "GitHub login provider");
  }
  return providerToken || null;
}

async function getNewGitHubUser(providerToken: string | null): Promise<GitHubUser | null> {
  const octokit = new Octokit({ auth: providerToken });
  try {
    const response = (await octokit.request("GET /user")) as GitHubUserResponse;
    return response.data;
  } catch (error) {
    if (error instanceof RequestError && error.status === 403) {
      await handleRateLimit(providerToken ? octokit : undefined, error);
    }
  }
  return null;
}
