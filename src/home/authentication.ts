import { displayGitHubUserInformation } from "./display-github-user-information";
import { getGitHubAccessToken } from "./get-github-access-token";
import { GitHubUser, getGitHubUser } from "./get-github-user";
import { renderGitHubLoginButton } from "./github-login-button";

export function authentication() {
  const accessToken = getGitHubAccessToken();
  if (!accessToken) {
    renderGitHubLoginButton();
  }

  getGitHubUser()
    .then((gitHubUser: null | GitHubUser) => {
      if (gitHubUser) {
        displayGitHubUserInformation(gitHubUser);
      }
    })
    .catch((error) => console.error(error));
}
