import { Octokit } from "@octokit/rest";
import { GitHubUser, GitHubUserResponse } from "../github-types";
import { OAuthToken } from "./get-github-access-token";
import { getLocalStore } from "./get-local-store";
import { displayPopupMessage } from "../rendering/display-popup-modal";
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
          // without a token we can't get a dynamic retry timeframe
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
  } catch (error: unknown) {
    if (error.status === 403 && error.message.includes("API rate limit exceeded")) {
      const resetTime = error.response.headers["x-ratelimit-reset"];
      const resetParsed = new Date(resetTime * 1000).toLocaleTimeString();

      displayPopupMessage(
        "GitHub API rate limit exceeded",
        `You have been rate limited. Please log in to GitHub to increase your GitHub API limits, otherwise you can try again at ${resetParsed}.`
      );
    }
  }
  return null;
}
