import { Octokit } from "@octokit/rest";
import { GitHubUser, GitHubUserResponse } from "../github-types";
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
    const err = params.get("error");
    const code = params.get("error_code");
    const desc = params.get("error_description");

    if (err === "server_error") {
      if (code === "500") {
        if (desc === "Error getting user profile from external provider") {
          displayPopupMessage(`GitHub Login Provider`, `Your access token may have reached it's rate limit, please try again after one hour.`);
          throw new Error("GitHub login provider");
        }
      }
    }
  }
  return providerToken;
}

async function getNewGitHubUser(providerToken: string | null): Promise<GitHubUser | null> {
  const octokit = new Octokit({ auth: providerToken });
  try {
    const response = (await octokit.request("GET /user")) as GitHubUserResponse;
    return response.data;
  } catch (err: unknown) {
    // API rate limit exceeded for user ID 106.... If you reach out to GitHub Support for help, ...
    if (err.status === 403 && err.message.includes("API rate limit exceeded")) {
      displayPopupMessage("GitHub API rate limit exceeded", err.message);
      throw new Error("GitHub API rate limit exceeded");
    }
    return null;
  }
}
