import { Octokit } from "@octokit/rest";
import { getExistingSessionToken } from "./check-for-github-access-token";

export async function authenticatedGetGitHubUser() {
  const activeSessionToken = await getActiveSessionToken();
  if (activeSessionToken) {
    return getGitHubUser(activeSessionToken);
  } else {
    return null;
  }
}

async function getActiveSessionToken() {
  let token = getExistingSessionToken();
  if (!token) {
    token = await getNewSessionToken();
  }
  return token;
}

async function getNewSessionToken() {
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.substr(1)); // remove the '#' and parse

  // access_token=eyJhbGciOiJIUzI1NiIsImtpZCI6InJCQVV5bHBBeUN5Sk1LVUIiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzAxMzQ0NjY0LCJpYXQiOjE3MDEzNDEwNjQsImlzcyI6Imh0dHBzOi8vd2Z6cGV3bWx5aW96dXB1bGJ1dXIuc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6IjE3NmRlZjk0LWNiMGEtNGNlYi1iMWMwLTg1ODJiMDlmZmE5ZCIsImVtYWlsIjoiZ2l0aHViQHBhdmxvdmNpay5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImdpdGh1YiIsInByb3ZpZGVycyI6WyJnaXRodWIiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vYXZhdGFycy5naXRodWJ1c2VyY29udGVudC5jb20vdS80OTc1NjcwP3Y9NCIsImVtYWlsIjoiZ2l0aHViQHBhdmxvdmNpay5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoi44Ki44Os44Kv44K144Oz44OA44O8LmV0aCIsImlzcyI6Imh0dHBzOi8vYXBpLmdpdGh1Yi5jb20iLCJuYW1lIjoi44Ki44Os44Kv44K144Oz44OA44O8LmV0aCIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicHJlZmVycmVkX3VzZXJuYW1lIjoicGF2bG92Y2lrIiwicHJvdmlkZXJfaWQiOiI0OTc1NjcwIiwic3ViIjoiNDk3NTY3MCIsInVzZXJfbmFtZSI6InBhdmxvdmNpayJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzAxMzQxMDY0fV0sInNlc3Npb25faWQiOiI0YzBlNjA5MC0zZGJmLTQ4OTMtYTRjYi1lYTlmZTIwZDQ1YjcifQ.YgLDGqngdIBCO2o041Xv0UzymdMgYQlW8GLBmdfDKkM
  // &expires_at=1701344664
  // &expires_in=3600
  // &provider_token=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
  // &refresh_token=Zi1ixXNvljvBkqexEriiVA
  // &token_type=bearer
  const providerToken = params.get("provider_token");

  if (!providerToken) {
    // throw new Error("Access token not found in URL fragment");
    return null;
  }

  const expiresAt = params.get("expires_at");
  if (expiresAt && parseInt(expiresAt, 10) < Date.now() / 1000) {
    localStorage.removeItem("provider_token");
  } else if (providerToken) {
    localStorage.setItem("provider_token", providerToken);
  }

  return providerToken;
}

async function getGitHubUser(providerToken: string) {
  const octokit = new Octokit({ auth: providerToken });
  const response = (await octokit.request("GET /user")) as GitHubUserResponse;
  return response.data;
}

interface GitHubUserResponse {
  status: number;
  url: string;
  headers: {
    "cache-control": string;
    "content-type": string;
    etag: string;
    "last-modified": string;
    "x-accepted-oauth-scopes": string;
    "x-github-media-type": string;
    "x-github-request-id": string;
    "x-oauth-scopes": string;
    "x-ratelimit-limit": string;
    "x-ratelimit-remaining": string;
    "x-ratelimit-reset": string;
    "x-ratelimit-resource": string;
    "x-ratelimit-used": string;
  };
  data: GitHubUser;
}

export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string | null;
  hireable: boolean | null;
  bio: string;
  twitter_username: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}
