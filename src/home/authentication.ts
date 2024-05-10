import { Octokit } from "@octokit/rest";
import { trackDevRelReferral } from "./devrel-tracker";
import { getGitHubAccessToken } from "./getters/get-github-access-token";
import { getGitHubUser } from "./getters/get-github-user";
import { GitHubUser } from "./github-types";
import { displayGitHubUserInformation } from "./rendering/display-github-user-information";
import { renderAugmentAccessButton, renderGitHubLoginButton } from "./rendering/render-github-login-button";

/**
 * Checks if the logged-in user is part of Ubiquity's Org, and didn't grant the 'repo' scope
 */
async function isOrgMemberWithoutScope(accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });
  const { headers } = await octokit.request("HEAD /");
  if (headers) {
    const scopes = headers["x-oauth-scopes"]?.split(", ");
    return !scopes?.includes("repo");
  }
  return false;
}

export async function authentication() {
  const accessToken = await getGitHubAccessToken();
  if (!accessToken) {
    renderGitHubLoginButton();
  } else if (await isOrgMemberWithoutScope(accessToken)) {
    renderAugmentAccessButton();
  }

  const gitHubUser: null | GitHubUser = await getGitHubUser();
  if (gitHubUser) {
    trackDevRelReferral(gitHubUser.login + "|" + gitHubUser.id);
    displayGitHubUserInformation(gitHubUser);
  }
}
