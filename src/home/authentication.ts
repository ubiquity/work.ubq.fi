import { displayGitHubUserInformation } from "./display-github-user-information";
import { getGitHubAccessToken } from "./get-github-access-token";
import {  getGitHubUser } from "./get-github-user";
import { renderGitHubLoginButton } from "./github-login-button";
import { GitHubUser } from "./github-types";

export async function authentication() {
  const accessToken = getGitHubAccessToken();
  if (!accessToken) {
    renderGitHubLoginButton();
  }

  const gitHubUser: null | GitHubUser = await getGitHubUser();
  if (gitHubUser) {
    displayGitHubUserInformation(gitHubUser);
  }
}
