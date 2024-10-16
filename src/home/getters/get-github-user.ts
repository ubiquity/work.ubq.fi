import { RequestError } from "@octokit/request-error";
import { handleRateLimit } from "../fetch-github/handle-rate-limit";
import { GitHubUser, GitHubUserResponse } from "../github-types";
import { initOctokit } from "../rendering/github-notifications/init-octokit";
import { OAuthToken } from "./get-github-access-token";
import { getLocalStore } from "./get-local-store";
declare const SUPABASE_STORAGE_KEY: string; // @DEV: passed in at build time check build/esbuild-build.ts

export async function getGitHubUser(): Promise<GitHubUser | null> {
  const activeSessionToken = await getSessionToken();
  return getNewGitHubUser(activeSessionToken);
}

async function getSessionToken(): Promise<string | null> {
  const cachedSessionToken = getLocalStore(`sb-${SUPABASE_STORAGE_KEY}-auth-token`) as OAuthToken | null;

  if (cachedSessionToken) {
    if (new Date(cachedSessionToken.expires_at) < new Date()) {
      return null;
    }
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
    console.error(`GitHub login provider: ${error}`);
  }
  return providerToken || null;
}

async function getNewGitHubUser(providerToken: string | null): Promise<GitHubUser | null> {
  if (!providerToken) {
    return null;
  }

  const octokit = await initOctokit();
  try {
    const response = (await octokit.request("GET /user")) as GitHubUserResponse;
    return response.data;
  } catch (error) {
    if (error instanceof RequestError && error.status === 403) {
      await handleRateLimit(octokit, error);
    } else {
      console.warn("Error fetching GitHub user data:", error);
    }
  }
  return null;
}
